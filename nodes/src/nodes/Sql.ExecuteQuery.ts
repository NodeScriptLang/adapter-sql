import { SqlQueryResult } from '@nodescript/adapter-sql-protocol';
import { ModuleCompute, ModuleDefinition } from '@nodescript/core/types';

import { requireConnection, SqlConnection } from '../lib/SqlConnection.js';

interface P {
    connection: SqlConnection;
    query: string;
    params?: any[];
}
type R = Promise<SqlQueryResult>;

export const module: ModuleDefinition<P, R> = {
    version: '0.0.1',
    moduleName: 'SQL / Execute Query',
    description: 'Executes a query on a SQL Database',
    keywords: ['database'],
    params: {
        connection: {
            schema: {
                type: 'any',
                description: 'Takes output from SQL/Connect node'
            },
            hideValue: true,
        },
        query: {
            schema: { type: 'string', },
            attributes: {
                renderer: 'textarea',
            },
        },
        params: {
            schema: {
                type: 'array',
                items: { type: 'any' },
                optional: true,
                description: 'Array of values for parameterized queries. Optional'
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

export const compute: ModuleCompute<P, R> = async params => {
    const connection = requireConnection(params.connection);
    const { result } = await connection.Sql.query({
        connectionUrl: connection.connectionUrl,
        query: params.query,
        params: params.params ?? [],
    });
    return result;
};
