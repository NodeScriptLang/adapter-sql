import { Logger } from '@nodescript/logger';
import { CounterMetric, metric } from '@nodescript/metrics';
import { dep } from 'mesh-ioc';
import { Event } from 'nanoevent';

export abstract class BasePool {
    @dep() logger!: Logger;

    becameIdle = new Event<void>();
    protected createdAt = Date.now();
    protected usedConnections = 0;

    @metric()
    protected connectionStats = new CounterMetric<{
        type: 'connect' | 'connectionCreated' | 'connectionClosed' | 'close' | 'fail';
    }>('nodescript_sql_adapter_connections', 'Sql adapter connections');

    constructor(
        readonly connectionUrl: string,
        readonly poolKey: string,
        readonly maxConnections: number,
        readonly connectionTimeout: number
    ) {}

    protected abstract setupEventListeners(): void;
    protected abstract getConnection(): Promise<any>;
    protected abstract closePool(): Promise<void>;

    get age() {
        return Date.now() - this.createdAt;
    }

    async connect() {
        try {
            const connection = await this.getConnection();
            this.connectionStats.incr(1, { type: 'connect' });
            this.logger.info('MySQL client connected', { poolKey: this.poolKey });
            return connection;
        } catch (error) {
            this.connectionStats.incr(1, { type: 'fail' });
            throw error;
        }
    }

    async closeGracefully(timeout = 10000) {
        await Promise.race([
            this.waitIdle(),
            new Promise<void>(resolve => setTimeout(resolve, timeout).unref()),
        ]);
        await this.closeNow();
    }

    async closeNow() {
        try {
            await this.closePool();
            this.logger.info(`Closed ${this.constructor.name}.`, { poolKey: this.poolKey });
            this.connectionStats.incr(1, { type: 'close' });
        } catch (error) {
            this.logger.error(`Failed to close ${this.constructor.name}`, {
                error,
                poolKey: this.poolKey
            });
            throw error;
        }
    }

    private waitIdle() {
        return new Promise<void>(resolve => {
            if (this.usedConnections === 0) {
                return resolve();
            }
            this.becameIdle.once(resolve);
        });
    }
}

