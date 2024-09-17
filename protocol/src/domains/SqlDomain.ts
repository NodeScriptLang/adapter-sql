import { DomainDef } from '@nodescript/protocomm';

import { SqlDefinitionResult, SqlDefinitionResultSchema } from '../schema/SqlDefinitionResult.js';
import { SqlModificationResult, SqlModificationResultSchema } from '../schema/SqlModificationResult.js';
import { SqlQueryResult, SqlQueryResultSchema } from '../schema/SqlQueryResult.js';

export interface SqlDomain {

    connect(req: {
        connectionUrl: string;
    }): Promise<{}>;

    executeDefinition(req: {
        connectionUrl: string;
        definition: string;
    }): Promise<{ result: SqlDefinitionResult }>;

    executeModification(req: {
        connectionUrl: string;
        modification: string;
        params: any[];
    }): Promise<{ result: SqlModificationResult }>;

    executeQuery(req: {
        connectionUrl: string;
        query: string;
        params: any[];
        includeFieldData?: boolean;
    }): Promise<{ result: SqlQueryResult }>;
}

export const SqlDomain: DomainDef<SqlDomain> = {
    name: 'Sql',
    methods: {
        connect: {
            type: 'command',
            params: {
                connectionUrl: { type: 'string' },
            },
            returns: {},
        },
        executeDefinition: {
            type: 'command',
            params: {
                connectionUrl: { type: 'string' },
                definition: { type: 'string' },
            },
            returns: { result: SqlDefinitionResultSchema.schema },
        },
        executeModification: {
            type: 'command',
            params: {
                connectionUrl: { type: 'string' },
                modification: { type: 'string' },
                params: { type: 'array', items: { type: 'any' } }
            },
            returns: { result: SqlModificationResultSchema.schema }
        },
        executeQuery: {
            type: 'command',
            params: {
                connectionUrl: { type: 'string' },
                query: { type: 'string' },
                params: { type: 'array', items: { type: 'any' } },
                includeFieldData: { type: 'boolean', optional: true, default: false }
            },
            returns: { result: SqlQueryResultSchema.schema }
        }
    },
    events: {}
};
