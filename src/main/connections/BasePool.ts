import { Logger } from '@nodescript/logger';
import { CounterMetric } from '@nodescript/metrics';
import { dep } from 'mesh-ioc';
import { Event } from 'nanoevent';

import { MySqlConnection } from './mysql/MySqlConnection.js';
import { PostgresConnection } from './postgres/PostgresConnection.js';

export abstract class BasePool {

    @dep() logger!: Logger;

    becameIdle = new Event<void>();
    protected createdAt = Date.now();
    protected usedConnections = 0;
    protected abstract connectionStats: CounterMetric;

    constructor(
        readonly connectionUrl: string,
        readonly poolKey: string,
        readonly maxConnections: number,
        readonly connectionTimeout: number
    ) {}

    protected abstract setupEventListeners(): void;
    protected abstract getConnection(): Promise<PostgresConnection | MySqlConnection>;
    protected abstract closePool(): Promise<void>;

    get age() {
        return Date.now() - this.createdAt;
    }

    get connectionCount() {
        return this.usedConnections;
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
            this.logger.info(`Closed ${this.constructor.name}`, { poolKey: this.poolKey });
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
