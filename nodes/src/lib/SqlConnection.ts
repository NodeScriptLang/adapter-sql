import { SqlProtocol, sqlProtocol } from '@nodescript/adapter-sql-protocol';
import { InvalidTypeError } from '@nodescript/core/util';
import { createHttpClient } from '@nodescript/protocomm';

const SYM_SQL_CONNECTION = Symbol.for('ns:SqlConnection');

export function requireConnection(value: unknown): SqlConnection {
    if ((value as any)[SYM_SQL_CONNECTION]) {
        return value as SqlConnection;
    }
    throw new InvalidTypeError('SQL Connection required. Use the output of "SQL / Connect" node.');
}

export class SqlConnection {

    rpc!: SqlProtocol;

    constructor(readonly connectionUrl: string, readonly adapterUrl: string) {
        const parsedUrl = new URL(adapterUrl);
        const secret = parsedUrl.username;
        parsedUrl.username = '';
        parsedUrl.password = '';
        const rpc = createHttpClient(sqlProtocol, {
            baseUrl: parsedUrl.href,
            headers: secret ?
                {
                    authorization: `Bearer ${secret}`,
                } :
                undefined,
        });
        Object.defineProperties(this, {
            connectionUrl: {
                enumerable: false,
                value: connectionUrl,
            },
            adapterUrl: {
                enumerable: false,
                value: adapterUrl,
            },
            rpc: {
                enumerable: false,
                value: rpc,
            },
        });
    }

    get Sql() {
        return this.rpc.Sql;
    }

    get [SYM_SQL_CONNECTION]() {
        return true;
    }

}
