import { SqlModificationResult, SqlQueryResult } from '@nodescript/adapter-sql-protocol';
import { FieldPacket, PoolConnection, QueryResult, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { SqlError } from '../../global/SqlError.js';
import { BaseConnection } from '../BaseConnection.js';
import { getMySqlTypeByCode } from './MySqlFieldTypeMap.js';

export class MySqlConnection extends BaseConnection {
    constructor(
       protected override client: PoolConnection
    ) {
        super(client);
    }

    async define(text: string): Promise<void> {
        await this.execute(text);
    }

    async modify(text: string, params?: any[]): Promise<SqlModificationResult> {
        const [result,] = await this.execute<ResultSetHeader>(text, params);

        return {
            affectedRowCount: result.affectedRows,
        };
    }

    async query(text: string, params?: any[]): Promise<SqlQueryResult> {
        const [result, resultFields] = await this.execute<RowDataPacket[]>(text, params);

        const fields = resultFields.map((field: any) => {
            const type = getMySqlTypeByCode(field.columnType);
            if (type === 'Unknown') {
                this.logger.info('Unidentified MySql type code', { code: field.columnType });
            }
            return {
                name: field.name,
                type
            };
        });

        return {
            rows: result,
            rowCount: result.length,
            fieldData: fields
        };
    }

    release() {
        this.client.release();
    }

    private async execute<T extends QueryResult>(text: string, params?: any[]): Promise<[T, FieldPacket[]]> {
        try {
            return await this.client.execute<T>(text, params);
        } catch (err) {
            throw new SqlError(err);
        } finally {
            this.release();
        }
    }

}
