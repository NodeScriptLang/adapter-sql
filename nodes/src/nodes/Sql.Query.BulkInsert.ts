import { ModuleCompute, ModuleDefinition } from '@nodescript/core/types';

import { BulkInsertBuilder, BulkInsertParams, BulkInsertResult } from '../lib/BulkInsertBuilder.js';

export const module: ModuleDefinition<BulkInsertParams, BulkInsertResult> = {
    version: '0.0.1',
    moduleName: 'SQL / Query / Bulk Insert',
    description: 'Converts an input array representing rows of data to a SQL INSERT query string and params array.',
    keywords: ['sql', 'database', 'insert', 'bulk', 'query'],
    params: {
        vendor: {
            schema: { type: 'string', enum: ['PostgreSQL', 'MySQL'] },
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
        },
        returning: {
            schema: {
                type: 'string',
                optional: true,
                description: 'PostgreSQL only.'
            }
        }
    },
    result: {
        schema: {
            type: 'object',
            properties: {
                query: { type: 'string' },
                params: {
                    type: 'array',
                    items: { type: 'string' }
                }
            }
        }
    },
    evalMode: 'manual',
    cacheMode: 'always',
};

export const compute: ModuleCompute<BulkInsertParams, BulkInsertResult> = params => {
    const builder = new BulkInsertBuilder(params);
    return builder.buildQuery();
};

