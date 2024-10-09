import { DomainDef } from '@nodescript/protocomm';

import { SqlQueryResult, SqlQueryResultSchema } from '../schema/SqlQueryResult.js';

export interface SqlDomain {

    query(req: {
        connectionUrl: string;
        query: string;
        params?: any[];
    }): Promise<{result: SqlQueryResult}>;

}

export const SqlDomain: DomainDef<SqlDomain> = {
    name: 'Sql',
    methods: {
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
