import { SqlQueryResult } from '@nodescript/adapter-sql-protocol';
import { Logger } from '@nodescript/logger';
import { dep } from 'mesh-ioc';
import { PoolConnection } from 'mysql2/promise';
import { PoolClient } from 'pg';

export abstract class BaseConnection {
    @dep() logger!: Logger;

    constructor(protected client: PoolClient | PoolConnection) {}

    abstract query(text: string): Promise<SqlQueryResult>;
    abstract release(): void;
}
