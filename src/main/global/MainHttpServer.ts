import { HttpChain, HttpContext, HttpCorsHandler, HttpErrorHandler, HttpMetricsHandler, HttpNext, HttpServer, HttpStatusHandler } from '@nodescript/http-server';
import { dep } from 'mesh-ioc';

import { AuthHandler } from './AuthHandler.js';
import { SqlProtocolHandler } from './SqlProtocolHandler.js';

export class MainHttpServer extends HttpServer {

    @dep() private errorHandler!: HttpErrorHandler;
    @dep() private corsHandler!: HttpCorsHandler;
    @dep() private metricsHandler!: HttpMetricsHandler;
    @dep() private statusHandler!: HttpStatusHandler;
    @dep() private authHandler!: AuthHandler;

    @dep() private sqlProtocolHandler!: SqlProtocolHandler;


    handler = new HttpChain([
        this.errorHandler,
        this.statusHandler,
        this.metricsHandler,
        this.corsHandler,
        this.authHandler,
        this.sqlProtocolHandler,
    ]);

    async handle(ctx: HttpContext, next: HttpNext): Promise<void> {
        await this.handler.handle(ctx, next);
    }

}
