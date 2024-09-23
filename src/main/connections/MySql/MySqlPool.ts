import { Logger } from '@nodescript/logger';
import { CounterMetric, metric } from '@nodescript/metrics';
import { dep } from 'mesh-ioc';
import { createPool, Pool, PoolConnection } from 'mysql2/promise';
import { Event } from 'nanoevent';

import { MySqlConnection } from './MySqlConnection.js';

/**
 * Encapsulates MySQL Client to facilitate connection pool usage and cleanups.
 */
export class MySqlPool {

    @dep() private logger!: Logger;

    becameIdle = new Event<void>();

    pool: Pool;
    private createdAt = Date.now();
    private usedConnections = 0;
    private connectPromise: Promise<PoolConnection> | null = null;

    @metric()
    private connectionStats = new CounterMetric<{
        type: 'connect' | 'connectionCreated' | 'connectionClosed' | 'close' | 'fail';
    }>('nodescript_sql_adapter_connections', 'Sql adapter connections');

    constructor(
        readonly connectionUrl: string,
        readonly poolKey: string,
        connectionLimit: number,
        connectTimeout: number
    ) {
        this.pool = createPool({
            uri: connectionUrl,
            connectionLimit,
            waitForConnections: true,
            queueLimit: 0,
            connectTimeout,
        });
        this.setupEventListeners();
    }

    private setupEventListeners() {
        this.pool.on('connection', () => {
            this.logger.info('Connection created', { poolKey: this.poolKey });
            this.connectionStats.incr(1, {
                type: 'connectionCreated'
            });
        });
        this.pool.on('acquire', () => {
            this.usedConnections += 1;
        });
        this.pool.on('release', () => {
            this.usedConnections -= 1;
            if (this.usedConnections === 0) {
                this.becameIdle.emit();
            }
        });
    }

    get age() {
        return Date.now() - this.createdAt;
    }

    async connect() {
        try {
            const client = await this.pool.getConnection();
            this.connectionStats.incr(1, { type: 'connect' });
            this.logger.info(`MySQL client connected`, { poolKey: this.poolKey });
            return new MySqlConnection(client);
        } catch (error) {
            this.connectionStats.incr(1, { type: 'fail' });
            this.connectPromise = null;
            throw error;
        }
    }

    async closeNow() {
        try {
            await this.pool.end();
            this.logger.info('MySQL pool closed', { poolKey: this.poolKey });
            this.connectionStats.incr(1, { type: 'close' });
        } catch (error) {
            this.logger.error('MySQL pool close failed', {
                error,
                poolKey: this.poolKey
            });
            throw error;
        }
    }

    async closeGracefully(timeout = 10000) {
        await Promise.race([
            this.waitIdle(),
            new Promise<void>(resolve => setTimeout(resolve, timeout).unref()),
        ]);
        await this.closeNow();
    }

    private waitIdle() {
        return new Promise<void>(resolve => {
            if (this.usedConnections === 0) {
                return resolve();
            }
            this.becameIdle.once(resolve);
        });
    }
}
