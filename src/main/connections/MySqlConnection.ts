import { SqlDefinitionResult, SqlModificationResult, SqlQueryResult } from '@nodescript/adapter-sql-protocol';
import { Logger } from '@nodescript/logger';
import { CounterMetric, metric } from '@nodescript/metrics';
import { dep } from 'mesh-ioc';
import { Pool, PoolConnection } from 'mysql2/promise';
import { Event } from 'nanoevent';

import { SqlError } from '../global/SqlError.js';
import { getMySqlTypeByCode } from './SqlTypeMaps.js';

/**
 * Encapsulates MySQL Client to facilitate connection pool usage and cleanups.
 */
export class MySqlConnection {

    @dep() private logger!: Logger;

    becameIdle = new Event<void>();

    private createdAt = Date.now();
    private usedConnections = 0;
    private activeClient: PoolConnection | null = null;
    private connectPromise: Promise<void> | null = null;

    @metric()
    private connectionStats = new CounterMetric<{
        type: 'connect' | 'connectionCreated' | 'connectionClosed' | 'close' | 'fail';
    }>('nodescript_sql_adapter_connections', 'Sql adapter connections');

    constructor(
        readonly connectionKey: string,
        protected pool: Pool
    ) {
        this.pool.on('connection', () => {
            this.logger.info('Connection created', { connectionKey });
            this.connectionStats.incr(1, {
                type: 'connectionCreated'
            });
        });
        this.pool.on('acquire', () => {
            this.usedConnections += 1;
            this.logger.info('Connection acquired', { connectionKey });
        });
        this.pool.on('release', () => {
            this.logger.info('Connection closed', {
                connectionKey,
            });
            this.connectionStats.incr(1, {
                type: 'connectionClosed',
            });
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
        if (!this.connectPromise) {
            this.connectPromise = (async () => {
                try {
                    this.activeClient = await this.pool.getConnection();
                    this.connectionStats.incr(1, { type: 'connect' });
                    this.logger.info(`MySQL client connected`, { connectionKey: this.connectionKey });
                } catch (error) {
                    this.connectionStats.incr(1, { type: 'fail' });
                    this.connectPromise = null;
                    throw error;
                }
            })();
        }
        await this.connectPromise;
    }

    async closeNow() {
        try {
            if (this.activeClient) {
                this.activeClient.release();
            }
            await this.pool.end();
            this.logger.info('MySQL pool closed', { connectionKey: this.connectionKey });
            this.connectionStats.incr(1, { type: 'close' });
        } catch (error) {
            this.logger.error('MySQL pool close failed', {
                error,
                connectionKey: this.connectionKey
            });
            throw error;
        } finally {
            this.activeClient = null;
            this.connectPromise = null;
        }
    }

    async closeGracefully(timeout = 10000) {
        await Promise.race([
            this.waitIdle(),
            new Promise<void>(resolve => setTimeout(resolve, timeout).unref()),
        ]);
        await this.closeNow();
    }

    async define(text: string): Promise<SqlDefinitionResult> {
        await this.execute(text);
        return { command: text.split(' ')[0] };
    }

    async modify(text: string, params?: any[]): Promise<SqlModificationResult> {
        const [result] = await this.execute(text, params);

        if (Array.isArray(result)) {
            throw new Error('Invalid query');
        }

        return {
            command: text.split(' ')[0],
            affectedRowCount: result.affectedRows,
        };
    }

    async query(text: string, params?: any[]): Promise<SqlQueryResult> {
        const [result, resultFields] = await this.execute(text, params);

        if (!Array.isArray(result)) {
            throw new Error('Invalid query');
        }

        const fields = resultFields.map(field => ({
            name: field.name,
            type: getMySqlTypeByCode(field.columnType),
        }));

        return {
            rows: result,
            rowCount: result.length,
            fieldData: fields
        };
    }

    private async execute(text: string, params?: any[]) {
        if (!this.activeClient) {
            throw new Error('No active connection. Call connect() first.');
        }

        try {
            return await this.activeClient.execute(text, params);
        } catch (err) {
            this.activeClient.release();
            throw new SqlError(err);
        }
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
