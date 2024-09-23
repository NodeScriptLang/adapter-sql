import { SqlModificationResult, SqlQueryResult } from '@nodescript/adapter-sql-protocol';
import pg, { FieldDef, PoolClient } from 'pg';

import { SqlError } from '../../global/SqlError.js';
import { BaseConnection } from '../BaseConnection.js';


export class PostgresConnection extends BaseConnection {
    private postgresTypes: Record<string, string>;
    constructor(
        protected client: PoolClient
    ) {
        super(client);
        this.postgresTypes = Object.fromEntries(
            Object.entries(pg.types.builtins).map(([name, oid]) => [oid, name])
        );
    }

    async define(text: string): Promise<void> {
        await this.execute(text);
    }

    async modify(text: string, params?: any[]): Promise<SqlModificationResult> {
        const res = await this.execute(text, params);

        return {
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
        try {
            return await this.client.query(text, params);
        } catch (err) {
            throw new SqlError(err);
        } finally {
            this.client.release();
        }
    }

    private getFieldData(fields: FieldDef[]) {
        return fields.map(f => ({ name: f.name, type: this.postgresTypes[f.dataTypeID] }));
    }
}
