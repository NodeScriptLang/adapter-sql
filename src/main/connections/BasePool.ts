import { Logger } from '@nodescript/logger';
import { dep } from 'mesh-ioc';
import { Event } from 'nanoevent';

import { Metrics } from '../global/Metrics.js';
import { MySqlConnection } from './mysql/MySqlConnection.js';
import { PostgresConnection } from './postgres/PostgresConnection.js';

export abstract class BasePool {
    @dep() logger!: Logger;
    @dep() metrics!: Metrics;

    becameIdle = new Event<void>();
    protected createdAt = Date.now();
    protected usedConnections = 0;

    constructor(
        readonly connectionUrl: string,
        readonly poolKey: string,
        readonly maxConnections: number,
        readonly connectionTimeout: number,
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
            this.metrics.connectionStats.incr(1, { type: 'connect' });
            this.logger.info('Client connected', { poolKey: this.poolKey });
            return connection;
        } catch (error) {
            this.metrics.connectionStats.incr(1, { type: 'fail' });
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
            this.metrics.connectionStats.incr(1, { type: 'close' });
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
