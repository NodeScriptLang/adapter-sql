import { config } from 'mesh-config';
import { createPool, Pool as mysql2Pool } from 'mysql2/promise';
import pg from 'pg';

const { Pool } = pg;

export class TestDb {

    @config({ default: 'adapter_sql_test' }) DB_NAME!: string;

    private postgresPool: pg.Pool | null = null;
    private mysqlPool: mysql2Pool | null = null;

    async setupPools(postgresUrl: string, mysqlUrl: string) {
        this.postgresPool = new Pool({ connectionString: postgresUrl, max: 20 });
        this.mysqlPool = createPool({ uri: mysqlUrl, connectionLimit: 10 });
    }

    async closePools() {
        if (this.postgresPool) {
            await this.postgresPool.end();
        }
        if (this.mysqlPool) {
            await this.mysqlPool.end();
        }
    }

    async dropPostgres() {
        const client = await this.postgresPool!.connect();
        await client.query(`DROP DATABASE IF EXISTS ${this.DB_NAME};`);
        client.release();
    }

    async dropMySql() {
        const client = await this.mysqlPool!.getConnection();
        await client.query(`DROP DATABASE IF EXISTS ${this.DB_NAME};`);
        client.release();
    }

    async startPostgres() {
        const client = await this.postgresPool!.connect();
        await client.query(`CREATE DATABASE ${this.DB_NAME};`);
        client.release();
    }

    async startMySql() {
        const client = await this.mysqlPool!.getConnection();
        await client.query(`CREATE DATABASE ${this.DB_NAME};`);
        client.release();
    }

}
