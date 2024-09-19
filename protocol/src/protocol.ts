import { ProtocolIndex } from '@nodescript/protocomm';

import { SqlDomain } from './domains/SqlDomain.js';

export interface SqlProtocol {
    Sql: SqlDomain;
}

export const sqlProtocol = new ProtocolIndex<SqlProtocol>({
    Sql: SqlDomain,
});
