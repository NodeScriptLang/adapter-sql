import 'reflect-metadata';

import { HttpServer } from '@nodescript/http-server';
import { BaseApp } from '@nodescript/microframework';
import { dep, Mesh } from 'mesh-ioc';

import { AuthHandler } from './global/AuthHandler.js';
import { ConnectionManager } from './global/ConnectionManager.js';
import { MainHttpServer } from './global/MainHttpServer.js';
import { SqlDomainImpl } from './global/SqlDomainImpl.js';
import { SqlProtocolHandler } from './global/SqlProtocolHandler.js';
import { SqlProtocolImpl } from './global/SqlProtocolImpl.js';

export class App extends BaseApp {

    @dep() httpServer!: HttpServer;
    @dep() connectionManager!: ConnectionManager;

    constructor() {
        super(new Mesh('App'));
        this.mesh.service(AuthHandler);
        this.mesh.service(HttpServer, MainHttpServer);
        this.mesh.service(ConnectionManager);
        this.mesh.service(SqlDomainImpl);
        this.mesh.service(SqlProtocolHandler);
        this.mesh.service(SqlProtocolImpl);
    }

    override async start() {
        await super.start();
        await this.connectionManager.start();
        await this.httpServer.start();
    }

    override async stop() {
        await super.stop();
        await this.connectionManager.stop();
        await this.httpServer.stop();
    }

}
