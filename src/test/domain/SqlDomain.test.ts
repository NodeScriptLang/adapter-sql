import assert from 'assert';

import { runtime } from '../runtime.js';

describe('SqlDomain', () => {

    context('psql', () => {
        beforeEach(async () => {
            const connectionUrl = runtime.testPostgresUrl;
            await runtime.Sql.executeDefinition({ connectionUrl,
                definition: 'CREATE TABLE test (id SERIAL PRIMARY KEY, username VARCHAR(50));' });
        });
        afterEach(async () => {
            const connectionUrl = runtime.testPostgresUrl;
            await runtime.Sql.executeDefinition({ connectionUrl,
                definition: 'DROP TABLE test;' });
        });

        it('defines', async () => {
            const connectionUrl = runtime.testPostgresUrl;
            try {
                const result = await runtime.Sql.executeDefinition({
                    connectionUrl,
                    definition: 'CREATE TABLE defined (id SERIAL PRIMARY KEY);'
                });
                assert.ok(result);
            } catch (error: any) {
                assert.fail(`Error thrown during table creation: ${error.message}`);
            }
        });

        it('modifies', async () => {
            const connectionUrl = runtime.testPostgresUrl;
            const { result } = await runtime.Sql.executeModification({
                connectionUrl,
                modification: `INSERT INTO test (username) VALUES ($1);`,
                params: ['test2']
            });
            assert.ok(result);
        });

        it('queries', async () => {
            const connectionUrl = runtime.testPostgresUrl;
            const { result } = await runtime.Sql.executeQuery({ connectionUrl, query: 'SELECT * FROM test;', params: [] });
            assert.ok(result);
        });
    });

    context('mysql', () => {
        beforeEach(async () => {
            const connectionUrl = runtime.testMySqlUrl;
            await runtime.Sql.executeDefinition({ connectionUrl,
                definition: 'CREATE TABLE test (id SERIAL PRIMARY KEY, username VARCHAR(50));' });
        });
        afterEach(async () => {
            const connectionUrl = runtime.testMySqlUrl;
            await runtime.Sql.executeDefinition({ connectionUrl,
                definition: 'DROP TABLE test;' });
        });

        it('defines', async () => {
            const connectionUrl = runtime.testMySqlUrl;
            try {
                const result = await runtime.Sql.executeDefinition({
                    connectionUrl,
                    definition: 'CREATE TABLE defined (id SERIAL PRIMARY KEY);'
                });
                assert.ok(result);
            } catch (error: any) {
                assert.fail(`Error thrown during table creation: ${error.message}`);
            }
        });

        it('modifies', async () => {
            const connectionUrl = runtime.testMySqlUrl;
            const { result } = await runtime.Sql.executeModification({
                connectionUrl,
                modification: `INSERT INTO test (username) VALUES (?);`,
                params: ['test2']
            });
            assert.ok(result);
        });

        it('queries', async () => {
            const connectionUrl = runtime.testMySqlUrl;
            const { result } = await runtime.Sql.executeQuery({ connectionUrl, query: 'SELECT * FROM test;', params: [] });
            assert.ok(result);
        });
    });

});
