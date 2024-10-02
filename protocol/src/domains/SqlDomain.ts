import { DomainDef } from '@nodescript/protocomm';

import { SqlQueryResultSchema } from '../schema/SqlQueryResult.js';

export interface SqlDomain {

    connect(req: {
        connectionUrl: string;
    }): Promise<{}>;

    query(req: {
        connectionUrl: string;
        query: string;
        params?: any[];
    }): Promise<{}>;

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
        query: {
            type: 'command',
            params: {
                connectionUrl: { type: 'string' },
                query: { type: 'string' },
                params: {
                    type: 'array',
                    items: { type: 'any' },
                    optional: true
                },
            },
            returns: { result: SqlQueryResultSchema.schema }
        }
    },
    events: {}
};
