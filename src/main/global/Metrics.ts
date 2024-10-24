import { CounterMetric, HistogramMetric, metric } from '@nodescript/metrics';

export class Metrics {

    @metric()
    connectionStats = new CounterMetric<{
        type: 'connect' | 'connectionCreated' | 'connectionClosed' | 'close' | 'fail';
        vendor: 'mysql' | 'postgres';
    }>('nodescript_sql_adapter_connections', 'Sql adapter connections');

    @metric()
    methodLatency = new HistogramMetric<{
        domain: string;
        method: string;
        error?: string;
    }>('nodescript_sql_adapter_latency', 'Sql adapter method latency');

}
