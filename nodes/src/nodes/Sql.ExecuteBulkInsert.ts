import { SqlQueryResult } from '@nodescript/adapter-sql-protocol';
import { ModuleCompute, ModuleDefinition } from '@nodescript/core/types';

import { BulkInsertBuilder } from '../lib/BulkInsertBuilder.js';
import { requireConnection, SqlConnection } from '../lib/SqlConnection.js';

export interface BulkInsertParams {
    connection: SqlConnection;
    tableName: string;
    rowData: Array<Record<string, any>>;
}

type R = Promise<SqlQueryResult>;

export const module: ModuleDefinition<BulkInsertParams, R> = {
    version: '0.0.1',
    moduleName: 'SQL / Execute Bulk Insert',
    description: 'Takes an array of objects representing row data and executes a SQL INSERT parameterized query.',
    keywords: ['database', 'query'],
    params: {
        connection: {
            schema: {
                type: 'any',
                description: 'Takes output from SQL/Connect node'
            },
            hideValue: true,
        },
        tableName: {
            schema: { type: 'string' }
        },
        rowData: {
            schema: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {},
                    additionalProperties: { type: 'any' }
                },
                description: 'Array of objects representing row data for insertion'
            }
        }
    },
    result: {
        async: true,
        schema: { type: 'any' },
    },
    evalMode: 'manual',
    cacheMode: 'always',
};

export const compute: ModuleCompute<BulkInsertParams, R> = async params => {
    const connection = requireConnection(params.connection);
    const builder = new BulkInsertBuilder(params);
    const insert = builder.buildQuery();
    const { result } = await connection.Sql.query({
        connectionUrl: connection.connectionUrl,
        query: insert.query,
        params: insert.params ?? [],
    });
    return result;
};
