import { SqlDomain } from '@nodescript/adapter-sql-protocol';
import { dep } from 'mesh-ioc';

import { SqlDefinitionResult } from '../../../protocol/src/schema/SqlDefinitionResult.js';
import { SqlModificationResult } from '../../../protocol/src/schema/SqlModificationResult.js';
import { SqlQueryResult } from '../../../protocol/src/schema/SqlQueryResult.js';
import { ConnectionManager } from './ConnectionManager.js';

export class SqlDomainImpl implements SqlDomain {

    @dep() private connectionManager!: ConnectionManager;

    async connect(req: {
        connectionUrl: string;
    }): Promise<{}> {
        await this.getConnection(req.connectionUrl);
        return {};
    }

    async executeDefinition(req: {
        connectionUrl: string;
        definition: string;
    }): Promise<{result: SqlDefinitionResult}> {
        const connection = await this.getConnection(req.connectionUrl);
        const result = await connection.define(req.definition);
        return { result };
    }

    async executeModification(req: {
        connectionUrl: string;
        modification: string;
        params: any[];
    }): Promise<{result: SqlModificationResult}> {
        const connection = await this.getConnection(req.connectionUrl);
        const result = await connection.modify(req.modification, req.params);
        return { result };
    }

    async executeQuery(req: {
        connectionUrl: string;
        query: string;
        params: any[];
    }): Promise<{result: SqlQueryResult}> {
        const connection = await this.getConnection(req.connectionUrl);
        const result = await connection.query(req.query, req.params);
        return { result };
    }

    private async getConnection(databaseUrl: string) {
        const pool = this.connectionManager.getPool(databaseUrl);
        const client = await pool.connect();
        return client;
    }
}
