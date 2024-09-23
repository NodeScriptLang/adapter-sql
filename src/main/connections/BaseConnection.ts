import { SqlModificationResult, SqlQueryResult } from '@nodescript/adapter-sql-protocol';

export abstract class BaseConnection {

    constructor(client: any) {}

    abstract define(text: string): Promise<void>;
    abstract modify(text: string): Promise<SqlModificationResult>;
    abstract query(text: string): Promise<SqlQueryResult>;
}
