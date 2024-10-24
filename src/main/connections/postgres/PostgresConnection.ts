import { SqlQueryResult } from '@nodescript/adapter-sql-protocol';
import pg, { FieldDef, PoolClient } from 'pg';

import { SqlError } from '../../global/SqlError.js';
import { BaseConnection } from '../BaseConnection.js';

export class PostgresConnection extends BaseConnection {

    private postgresTypes: Record<string, string>;
    constructor(
        protected override client: PoolClient
    ) {
        super(client);
        this.postgresTypes = Object.fromEntries(
            Object.entries(pg.types.builtins).map(([name, oid]) => [oid, name])
        );
    }

    async query(text: string, params?: any[]): Promise<SqlQueryResult> {
        try {
            const res = await this.client.query(text, params);

            if (res.rows.length && res.rowCount) {
                return {
                    rows: res.rows,
                    rowCount: res.rowCount ?? 0,
                    fieldData: this.getFieldData(res.fields)
                };
            }

            if (res.rowCount) {
                return {
                    rowCount: res.rowCount ?? 0,
                };
            }

            return {};
        } catch (err) {
            throw new SqlError(err);
        } finally {
            this.release();
        }
    }

    release() {
        this.client.release();
    }

    private getFieldData(fields: FieldDef[]) {
        if (fields.length) {
            return fields.map(f => ({ name: f.name, type: this.postgresTypes[f.dataTypeID] }));
        }
    }

}
