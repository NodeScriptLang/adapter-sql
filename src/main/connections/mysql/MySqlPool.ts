import { CounterMetric, metric } from '@nodescript/metrics';
import { createPool, Pool } from 'mysql2/promise';

import { BasePool } from '../BasePool.js';
import { MySqlConnection } from './MySqlConnection.js';

export class MySqlPool extends BasePool {

    protected pool: Pool;

    @metric()
    protected connectionStats = new CounterMetric<{
        type: 'connect' | 'connectionCreated' | 'close' | 'fail';
        vendor: 'mysql';
    }>('nodescript_sql_adapter_connections', 'Sql adapter connections');

    constructor(
        connectionUrl: string,
        poolKey: string,
        connectionLimit: number,
        connectTimeout: number
    ) {
        super(connectionUrl, poolKey, connectionLimit, connectTimeout);
        this.pool = createPool({
            uri: connectionUrl,
            connectionLimit,
            waitForConnections: true,
            queueLimit: 0,
            connectTimeout,
        });
        this.setupEventListeners();
    }

    protected setupEventListeners() {
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

    async getConnection() {
        const client = await this.pool.getConnection();
        return new MySqlConnection(client);
    }

    async closePool() {
        await this.pool.end();
    }

}
