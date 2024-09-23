import { Logger } from '@nodescript/logger';
import { config } from 'mesh-config';
import { dep, Mesh } from 'mesh-ioc';

import { MySqlPool } from '../connections/mysql/MySqlPool.js';
import { PostgresPool } from '../connections/postgres/PostgresPool.js';

export class ConnectionManager {

    @config({ default: 10 }) POOL_SIZE!: number;
    @config({ default: 60_000 }) POOL_TTL_MS!: number;
    @config({ default: 30_000 }) SWEEP_INTERVAL_MS!: number;
    @config({ default: 10_000 }) CONNECT_TIMEOUT_MS!: number;

    @dep() private mesh!: Mesh;
    @dep() private logger!: Logger;

    private poolMap = new Map<string, PostgresPool | MySqlPool>();
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

    getPool(url: string) {
        const { connectionUrl, poolKey } = this.prepareConnectionDetails(url);
        const existing = this.poolMap.get(poolKey);
        if (existing) {
            return existing;
        }
        const pool = this.selectPool(connectionUrl, poolKey);
        this.poolMap.set(poolKey, pool);
        this.mesh.connect(pool);
        return pool;
    }

    private selectPool(connectionUrl: string, poolKey: string) {
        if (connectionUrl.startsWith('mysql')) {
            return new MySqlPool(connectionUrl, poolKey, this.POOL_SIZE, this.CONNECT_TIMEOUT_MS);
        }
        if (connectionUrl.startsWith('postgres')) {
            return new PostgresPool(connectionUrl, poolKey, this.POOL_SIZE, this.CONNECT_TIMEOUT_MS);
        }
        throw new Error('Invalid connection string');
    }

    private async closeAllConnections() {
        const conns = [...this.poolMap.values()];
        this.poolMap.clear();
        await Promise.all(conns.map(_ => _.closeGracefully()));
    }

    private async closeExpired() {
        const expiredConnections = [...this.poolMap.values()].filter(_ => _.age > this.POOL_TTL_MS);
        this.logger.info(`Sweep: closing ${expiredConnections.length} expired pools`);
        for (const conn of expiredConnections) {
            this.poolMap.delete(conn.poolKey);
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
        const poolKey = parsedUrl.href;
        return { connectionUrl, poolKey };
    }

}
