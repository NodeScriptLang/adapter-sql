import assert from 'assert';

import { runtime } from '../runtime.js';

describe('SqlDomain', () => {

    context('psql', () => {
        beforeEach(async () => {
            const connectionUrl = runtime.testPostgresUrl;
            await runtime.Sql.query({ connectionUrl,
                query: 'CREATE TABLE test (id SERIAL PRIMARY KEY, username VARCHAR(50));' });
        });
        afterEach(async () => {
            const connectionUrl = runtime.testPostgresUrl;
            await runtime.Sql.query({ connectionUrl,
                query: 'DROP TABLE test;' });
        });

        it('defines', async () => {
            const connectionUrl = runtime.testPostgresUrl;
            const result = await runtime.Sql.query({
                connectionUrl,
                query: 'CREATE TABLE psqldefined (id SERIAL PRIMARY KEY);'
            });
            assert.ok(result);
        });

        it('modifies', async () => {
            const connectionUrl = runtime.testPostgresUrl;
            const { result } = await runtime.Sql.query({
                connectionUrl,
                query: `INSERT INTO test (username) VALUES ($1);`,
                params: ['test2']
            });
            assert.ok(result);
        });

        it('queries', async () => {
            const connectionUrl = runtime.testPostgresUrl;
            const { result } = await runtime.Sql.query({ connectionUrl, query: 'SELECT * FROM test;', params: [] });
            assert.ok(result);
        });
    });

    context('mysql', () => {
        beforeEach(async () => {
            const connectionUrl = runtime.testMySqlUrl;
            await runtime.Sql.query({ connectionUrl,
                query: 'CREATE TABLE test (id SERIAL PRIMARY KEY, username VARCHAR(50));' });
        });
        afterEach(async () => {
            const connectionUrl = runtime.testMySqlUrl;
            await runtime.Sql.query({ connectionUrl,
                query: 'DROP TABLE test;' });
        });

        it('defines', async () => {
            const connectionUrl = runtime.testMySqlUrl;
            const result = await runtime.Sql.query({
                connectionUrl,
                query: 'CREATE TABLE mysqldefined (id SERIAL PRIMARY KEY);'
            });
            assert.ok(result);
        });

        it('modifies', async () => {
            const connectionUrl = runtime.testMySqlUrl;
            const { result } = await runtime.Sql.query({
                connectionUrl,
                query: `INSERT INTO test (username) VALUES (?);`,
                params: ['test2']
            });
            assert.ok(result);
        });

        it('queries', async () => {
            const connectionUrl = runtime.testMySqlUrl;
            const { result } = await runtime.Sql.query({ connectionUrl, query: 'SELECT * FROM test;', params: [] });
            assert.ok(result);
        });
    });

});
