import { SqlDefinitionResult, SqlModificationResult, SqlQueryResult } from '@nodescript/adapter-sql-protocol';
import { FieldPacket, PoolConnection, QueryResult, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { SqlError } from '../../global/SqlError.js';
import { getMySqlTypeByCode } from './MySqlFieldTypeMap.js';

export class MySqlConnection {
    constructor(
        protected client: PoolConnection
    ) {}
    async define(text: string): Promise<SqlDefinitionResult> {
        await this.execute(text);
        return { command: text.split(' ')[0] };
    }

    async modify(text: string, params?: any[]): Promise<SqlModificationResult> {
        const [result,] = await this.execute<ResultSetHeader>(text, params);

        return {
            command: text.split(' ')[0],
            affectedRowCount: result.affectedRows,
        };
    }

    async query(text: string, params?: any[]): Promise<SqlQueryResult> {
        const [result, resultFields] = await this.execute<RowDataPacket[]>(text, params);

        const fields = resultFields.map((field: any) => ({
            name: field.name,
            type: getMySqlTypeByCode(field.columnType),
        }));

        return {
            rows: result,
            rowCount: result.length,
            fieldData: fields
        };
    }

    private async execute<T extends QueryResult>(text: string, params?: any[]): Promise<[T, FieldPacket[]]> {
        try {
            return await this.client.execute<T>(text, params);
        } catch (err) {
            throw new SqlError(err);
        } finally {
            this.client.release();
        }
    }

}
