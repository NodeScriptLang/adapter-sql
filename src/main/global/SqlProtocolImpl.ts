import { SqlProtocol } from '@nodescript/adapter-sql-protocol';
import { dep } from 'mesh-ioc';

import { SqlDomainImpl } from './SqlDomainImpl.js';

export class SqlProtocolImpl implements SqlProtocol {

    @dep() Sql!: SqlDomainImpl;

}
