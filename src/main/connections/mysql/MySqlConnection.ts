import { SqlQueryResult } from '@nodescript/adapter-sql-protocol';
import { FieldPacket, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { SqlError } from '../../global/SqlError.js';
import { BaseConnection } from '../BaseConnection.js';
import { getMySqlTypeByCode } from './MySqlFieldTypeMap.js';

export class MySqlConnection extends BaseConnection {

    constructor(
       protected override client: PoolConnection
    ) {
        super(client);
    }

    async query(text: string, params?: any[]): Promise<SqlQueryResult> {
        try {
            const [res, resultFields] = await this.client.execute(text, params);

            if (Array.isArray(res)) {
                const rows = res as RowDataPacket[];

                return {
                    rows,
                    rowCount: rows.length,
                    fieldData: this.getReadableFields(resultFields)
                };
            }
            const resultHeader = res as ResultSetHeader;
            return resultHeader.affectedRows ? { rowCount: resultHeader.affectedRows } : {};
        } catch (err) {
            throw new SqlError(err);
        } finally {
            this.release();
        }
    }

    private getReadableFields(resultFields: any[]) {
        return resultFields.map((field: FieldPacket) => {
            const type = getMySqlTypeByCode(field.columnType);
            if (type === 'Unknown') {
                this.logger.info('Unidentified MySql type code', { code: field.columnType });
            }
            return {
                name: field.name,
                type
            };
        });
    }

    release() {
        this.client.release();
    }

}
