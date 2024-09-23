import pg, { Pool as PoolType } from 'pg';

import { BasePool } from '../BasePool.js';
import { PostgresConnection } from './PostgresConnection.js';

const { Pool } = pg;

export class PostgresPool extends BasePool {
    protected pool: PoolType;
    constructor(
        connectionUrl: string,
        poolKey: string,
        maxConnections: number,
        connectionTimeout: number,
    ) {
        super(connectionUrl, poolKey, maxConnections, connectionTimeout);
        this.pool = new Pool({
            connectionString: connectionUrl,
            max: maxConnections,
            connectionTimeoutMillis: connectionTimeout,
        });
        this.setupEventListeners();
    }

    protected setupEventListeners() {
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

    protected async getConnection() {
        const client = await this.pool.connect();
        return new PostgresConnection(client);
    }

    protected async closePool() {
        await this.pool.end();
    }
}
