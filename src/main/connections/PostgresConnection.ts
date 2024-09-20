import { SqlDefinitionResult, SqlModificationResult, SqlQueryResult } from '@nodescript/adapter-sql-protocol';
import { Logger } from '@nodescript/logger';
import { CounterMetric, metric } from '@nodescript/metrics';
import { dep } from 'mesh-ioc';
import { Event } from 'nanoevent';
import pg, { FieldDef, Pool, PoolClient } from 'pg';

import { SqlError } from '../global/SqlError.js';


/**
 * Encapsulates PostgreSQL Client to facilitate connection pool usage and cleanups.
 */
export class PostgresConnection {

    @dep() private logger!: Logger;

    becameIdle = new Event<void>();

    private createdAt = Date.now();
    private usedConnections = 0;
    private activeClient: PoolClient | null = null;
    private postgresTypes: Record<string, any>;
    private connectPromise: Promise<void> | null = null;


    @metric()
    private connectionStats = new CounterMetric<{
        type: 'connect' | 'connectionCreated' | 'connectionClosed' | 'close' | 'fail';
    }>('nodescript_sql_adapter_connections', 'Sql adapter connections');

    constructor(
        readonly connectionKey: string,
        protected pool: Pool
    ) {
        this.pool.on('connect', () => {
            this.logger.info('Connection created', { connectionKey });
            this.connectionStats.incr(1, {
                type: 'connectionCreated'
            });
        });
        this.pool.on('remove', async () => {
            this.logger.info('Connection closed', { connectionKey });
            this.connectionStats.incr(1, {
                type: 'connectionClosed',
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

        this.postgresTypes = Object.fromEntries(
            Object.entries(pg.types.builtins).map(([name, oid]) => [oid, name])
        );
    }

    get age() {
        return Date.now() - this.createdAt;
    }

    async connect() {
        if (!this.connectPromise) {
            this.connectPromise = (async () => {
                try {
                    this.activeClient = await this.pool.connect();
                    this.connectionStats.incr(1, { type: 'connect' });
                    this.logger.info(`PostgreSQL client connected`, { connectionKey: this.connectionKey });
                } catch (error) {
                    this.connectionStats.incr(1, { type: 'fail' });
                    this.connectPromise = null;
                    throw error;
                }
            })();
        }
        await this.connectPromise;
        return this.activeClient;
    }

    async closeNow() {
        try {
            if (this.activeClient) {
                this.activeClient.release();
            }
            await this.pool.end();
            this.logger.info('PostgreSQL pool closed.', { connectionKey: this.connectionKey });
        } catch (error) {
            this.logger.error('PostgreSQL pool close failed', {
                error,
                connectionKey: this.connectionKey
            });
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
        const res = await this.execute(text);
        return { command: res.command };
    }

    async modify(text: string, params?: any[]): Promise<SqlModificationResult> {
        const res = await this.execute(text, params);

        return {
            command: res.command,
            affectedRowCount: res.rowCount ?? 0,
            rows: res.rows,
            fieldData: this.getFieldData(res.fields)
        };
    }

    async query(text: string, params?: any[]): Promise<SqlQueryResult> {
        const res = await this.execute(text, params);

        return {
            rows: res.rows,
            rowCount: res.rowCount ?? 0,
            fieldData: this.getFieldData(res.fields)
        };
    }

    private async execute(text: string, params?: any[]) {
        if (!this.activeClient) {
            throw new Error('No active client. Call connect() first.');
        }

        try {
            return await this.activeClient.query(text, params);
        } catch (err) {
            this.activeClient.release();
            throw new SqlError(err);
        }
    }

    private getFieldData(fields: FieldDef[]) {
        return fields.map(f => ({ name: f.name, type: this.postgresTypes[f.dataTypeID] }));
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
