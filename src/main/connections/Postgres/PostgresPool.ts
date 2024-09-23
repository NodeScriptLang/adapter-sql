import { Logger } from '@nodescript/logger';
import { CounterMetric, metric } from '@nodescript/metrics';
import { config } from 'mesh-config';
import { dep } from 'mesh-ioc';
import { Event } from 'nanoevent';
import pg, { Pool as PoolType } from 'pg';

import { PostgresConnection } from './PostgresConnection.js';

const { Pool } = pg;


/**
 * Encapsulates PostgreSQL Client to facilitate connection pool usage and cleanups.
 */
export class PostgresPool {

    @config({ default: 10 }) POOL_SIZE!: number;
    @config({ default: 10_000 }) CONNECT_TIMEOUT_MS!: number;

    @dep() private logger!: Logger;


    becameIdle = new Event<void>();

    pool: PoolType;
    private createdAt = Date.now();
    private usedConnections = 0;

    @metric()
    private connectionStats = new CounterMetric<{
        type: 'connect' | 'connectionCreated' | 'connectionClosed' | 'close' | 'fail';
    }>('nodescript_sql_adapter_connections', 'Sql adapter connections');

    constructor(
        readonly connectionUrl: string,
        readonly poolKey: string,
        readonly max: number,
        readonly connectionTimeoutMillis: number
    ) {
        this.pool = new Pool({
            connectionString: connectionUrl,
            max,
            connectionTimeoutMillis,
        });
        this.setupEventListeners();
    }

    private setupEventListeners() {
        this.pool.on('connect', () => {
            this.logger.info('Connection created', { poolKey: this.poolKey });
            this.connectionStats.incr(1, {
                type: 'connectionCreated'
            });
        });
        this.pool.on('remove', async () => {
            this.connectionStats.incr(1, {
                type: 'connectionClosed',
            });
        });
        this.pool.on('acquire', () => {
            this.usedConnections += 1;
            this.logger.info('Connection count: ', { count: this.usedConnections });
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
            const client = await this.pool.connect();
            this.connectionStats.incr(1, { type: 'connect' });
            this.logger.info(`PostgreSQL client connected`, { poolKey: this.poolKey });
            return new PostgresConnection(client);
        } catch (error) {
            this.connectionStats.incr(1, { type: 'fail' });
            throw error;
        }
    }

    async closeNow() {
        try {
            await this.pool.end();
            this.logger.info('PostgreSQL pool closed.', { poolKey: this.poolKey });
        } catch (error) {
            this.logger.error('PostgreSQL pool close failed', {
                error,
                poolKey: this.poolKey
            });
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
