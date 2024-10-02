import { ModuleCompute, ModuleDefinition } from '@nodescript/core/types';

import { requireConnection } from '../lib/SqlConnection.js';

type P = {
    connection: unknown;
    query: string;
    params?: any[];
};
type R = Promise<unknown>;

export const module: ModuleDefinition<P, R> = {
    version: '0.0.1',
    moduleName: 'SQL / Execute Query',
    description: 'Executes a query on a SQL Database',
    keywords: ['sql', 'database', 'select', 'insert', 'create', 'update', 'delete', 'alter', 'table', 'query'],
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
                description: 'Query parameters for prepared statements. Optional'
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
    const { result } = await connection.Sql.executeQuery({
        connectionUrl: connection.connectionUrl,
        query: params.query,
        params: params.params ?? [],
    });
    return result;
};
