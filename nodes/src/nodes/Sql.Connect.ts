import { ModuleCompute, ModuleDefinition } from '@nodescript/core/types';

import { SqlConnection } from '../lib/SqlConnection.js';

type P = {
    adapterUrl: string;
    connectionUrl: string;
};
type R = Promise<unknown>;

export const module: ModuleDefinition<P, R> = {
    version: '0.0.1',
    moduleName: 'SQL / Connect',
    description: 'Connects to a SQL database. Returns the connection required by other nodes.',
    keywords: ['Sql', 'database', 'storage', 'connect'],
    params: {
        adapterUrl: {
            schema: {
                type: 'string',
                default: '',
                description: 'URL of the SQL adapter'
            },
        },
        connectionUrl: {
            schema: {
                type: 'string',
                description: 'Connection string for a SQL Database'
            },
        },
    },
    result: {
        async: true,
        schema: { type: 'any' },
    },
    evalMode: 'manual',
    cacheMode: 'always',
};

export const compute: ModuleCompute<P, R> = async params => {
    const connectionUrl = params.connectionUrl;
    const connection = new SqlConnection(connectionUrl, params.adapterUrl);
    await connection.Sql.connect({ connectionUrl });
    return connection;
};

