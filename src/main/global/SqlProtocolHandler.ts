import { SqlProtocol, sqlProtocol } from '@nodescript/adapter-sql-protocol';
import { HttpProtocolHandler } from '@nodescript/http-server';
import { dep } from 'mesh-ioc';

import { Metrics } from './Metrics.js';
import { SqlProtocolImpl } from './SqlProtocolImpl.js';

export class SqlProtocolHandler extends HttpProtocolHandler<SqlProtocol> {

    @dep() protocolImpl!: SqlProtocolImpl;
    @dep() metrics!: Metrics;

    protocol = sqlProtocol;

    constructor() {
        super();
        this.methodStats.on(stats => {
            this.metrics.methodLatency.addMillis(stats.latency, {
                domain: stats.domain,
                method: stats.method,
                error: stats.error,
            });
        });
    }
}
