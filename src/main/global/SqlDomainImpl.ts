import { SqlDomain } from '@nodescript/adapter-sql-protocol';
import { dep } from 'mesh-ioc';

import { SqlQueryResult } from '../../../protocol/src/schema/SqlQueryResult.js';
import { ConnectionManager } from './ConnectionManager.js';

export class SqlDomainImpl implements SqlDomain {

    @dep() private connectionManager!: ConnectionManager;

    async query(req: {
        connectionUrl: string;
        query: string;
        params?: any[];
    }): Promise<{ result: SqlQueryResult }> {
        const connection = await this.getConnection(req.connectionUrl);
        const result = await connection.query(req.query, req.params);
        return { result };
    }

    private async getConnection(databaseUrl: string) {
        const pool = this.connectionManager.getPool(databaseUrl);
        const connection = await pool.connect();
        return connection;
    }

}
