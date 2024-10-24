import { SqlProtocol, sqlProtocol } from '@nodescript/adapter-sql-protocol';
import { HttpProtocolHandler } from '@nodescript/http-server';
import { HistogramMetric, metric } from '@nodescript/metrics';
import { dep } from 'mesh-ioc';

import { SqlProtocolImpl } from './SqlProtocolImpl.js';

export class SqlProtocolHandler extends HttpProtocolHandler<SqlProtocol> {

    @dep() protocolImpl!: SqlProtocolImpl;

    protocol = sqlProtocol;

    @metric()
    private methodLatency = new HistogramMetric<{
        domain: string;
        method: string;
        error?: string;
    }>('nodescript_sql_adapter_latency', 'Sql adapter method latency');

    constructor() {
        super();
        this.methodStats.on(stats => {
            this.methodLatency.addMillis(stats.latency, {
                domain: stats.domain,
                method: stats.method,
                error: stats.error,
            });
        });
    }

}
