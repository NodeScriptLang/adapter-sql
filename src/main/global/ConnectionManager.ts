import { Logger } from '@nodescript/logger';
import { config } from 'mesh-config';
import { dep, Mesh } from 'mesh-ioc';
import { createPool, Pool } from 'mysql2/promise';
import pg from 'pg';

import { MySqlConnection } from '../connections/MySqlConnection.js';
import { PostgresConnection } from '../connections/PostgresConnection.js';

const { Pool } = pg;

export class ConnectionManager {

    @config({ default: 10 }) POOL_SIZE!: number;
    @config({ default: 60_000 }) POOL_TTL_MS!: number;
    @config({ default: 30_000 }) SWEEP_INTERVAL_MS!: number;
    @config({ default: 10_000 }) CONNECT_TIMEOUT_MS!: number;

    @dep() private mesh!: Mesh;
    @dep() private logger!: Logger;

    private connectionMap = new Map<string, PostgresConnection | MySqlConnection>();
    private running = false;
    private sweepPromise: Promise<void> = Promise.resolve();

    async start() {
        if (this.running) {
            return;
        }
        this.running = true;
        this.sweepPromise = this.sweepLoop();
    }

    async stop() {
        this.running = false;
        await this.sweepPromise;
        await this.closeAllConnections();
    }

    getConnection(url: string) {
        const { connectionUrl, connectionKey } = this.prepareConnectionDetails(url);
        const existing = this.connectionMap.get(connectionKey);
        if (existing) {
            return existing;
        }
        const connection = this.selectConnection(connectionUrl, connectionKey);
        this.connectionMap.set(connectionKey, connection);
        this.mesh.connect(connection);
        return connection;
    }

    private selectConnection(connectionUrl: string, connectionKey: string) {
        if (connectionUrl.startsWith('mysql')) {
            const pool = createPool({
                uri: connectionUrl,
                connectionLimit: this.POOL_SIZE,
                waitForConnections: true,
                queueLimit: 0,
                connectTimeout: this.CONNECT_TIMEOUT_MS,
            });
            return new MySqlConnection(connectionKey, pool);
        }
        if (connectionUrl.startsWith('postgres')) {
            const pool = new Pool({
                connectionString: connectionUrl,
                max: this.POOL_SIZE,
                connectionTimeoutMillis: this.CONNECT_TIMEOUT_MS,
            });
            return new PostgresConnection(connectionKey, pool);
        }
        throw new Error('Invalid connection string');
    }

    private async closeAllConnections() {
        const conns = [...this.connectionMap.values()];
        this.connectionMap.clear();
        await Promise.all(conns.map(_ => _.closeGracefully()));
    }

    private async closeExpired() {
        const expiredConnections = [...this.connectionMap.values()].filter(_ => _.age > this.POOL_TTL_MS);
        this.logger.info(`Sweep: closing ${expiredConnections.length} expired connections`);
        for (const conn of expiredConnections) {
            this.connectionMap.delete(conn.connectionKey);
            await conn.closeGracefully();
        }
    }

    private async sweepLoop() {
        if (!this.SWEEP_INTERVAL_MS) {
            return;
        }
        while (this.running) {
            await new Promise(resolve => setTimeout(resolve, this.SWEEP_INTERVAL_MS).unref());
            this.closeExpired();
        }
    }

    private prepareConnectionDetails(url: string) {
        const parsedUrl = new URL(url);
        parsedUrl.search = '';
        const connectionUrl = parsedUrl.href;
        parsedUrl.password = '';
        const connectionKey = parsedUrl.href;
        return { connectionUrl, connectionKey };
    }

}
