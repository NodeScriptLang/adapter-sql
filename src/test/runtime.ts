import { config } from 'mesh-config';
import { dep } from 'mesh-ioc';

import { App } from '../main/app.js';
import { SqlDomainImpl } from '../main/global/SqlDomainImpl.js';
import { TestDb } from './TestDb.js';

export class TestRuntime {
    app = new App();

    @dep({ cache: false }) Sql!: SqlDomainImpl;
    @dep({ cache: false }) testDb!: TestDb;
    @config({ default: '8080' }) HTTP_PORT!: string;
    @config() POSTGRES_BASE_URL!: string;
    @config() MYSQL_BASE_URL!: string;
    @config({ default: 'adaptersqltest' }) DB_NAME!: string;


    async setup() {
        this.app = new App();
        this.app.mesh.connect(this);
        this.app.mesh.service(TestDb);
        await this.app.start();
        await this.testDb.setupPools(`${this.POSTGRES_BASE_URL}/postgres`, `${this.MYSQL_BASE_URL}`);
        await this.testDb.dropPostgres();
        await this.testDb.dropMySql();
        await this.testDb.startPostgres();
        await this.testDb.startMySql();
        await this.testDb.closePools();
    }

    async teardown() {
        await this.app.stop();
    }

    get baseUrl() {
        return `http://localhost:${this.HTTP_PORT}`;
    }

    get testPostgresUrl() {
        return `${this.POSTGRES_BASE_URL}/${this.DB_NAME}`;
    }

    get testMySqlUrl() {
        return `${this.MYSQL_BASE_URL}/${this.DB_NAME}`;
    }

}

export const runtime = new TestRuntime();
