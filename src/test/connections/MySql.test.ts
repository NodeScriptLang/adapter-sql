import assert from 'assert';

import { runtime } from '../runtime.js';


describe('MySql Connections', () => {
    beforeEach(async () => {
        const connectionUrl = runtime.testMySqlUrl;
        await runtime.Sql.executeDefinition({
            connectionUrl,
            definition: 'DROP TABLE IF EXISTS test;'
        });
        await runtime.Sql.executeDefinition({
            connectionUrl,
            definition: 'CREATE TABLE test (id SERIAL PRIMARY KEY, username VARCHAR(50));'
        });
    });
    afterEach(async () => {
        const connectionUrl = runtime.testMySqlUrl;
        await runtime.Sql.executeDefinition({
            connectionUrl,
            definition: 'DROP TABLE test;'
        });
    });

    it('releases connection after use', async () => {
        const connectionUrl = runtime.testMySqlUrl;
        await runtime.Sql.executeQuery({ connectionUrl, query: 'SELECT * FROM test;', params: [] });
        const pool = runtime.app.connectionManager.getPool(connectionUrl);
        assert.deepEqual(pool.connectionCount, 0);
    });

    it('releases connection on error', async () => {
        const connectionUrl = runtime.testMySqlUrl;
        try {
            await runtime.Sql.executeQuery({ connectionUrl, query: 'SELECT * FROM nonexistent;', params: [] });
        } catch (err) {
            // ignore the error
        }
        const pool = runtime.app.connectionManager.getPool(connectionUrl);
        assert.deepEqual(pool.connectionCount, 0);

        const { result } = await runtime.Sql.executeQuery({ connectionUrl, query: 'SELECT * FROM test;', params: [] });
        assert.ok(result);
    });

    it('queue + release - pool size limit 10', async () => {
        const connectionUrl = runtime.testMySqlUrl;
        const concurrency = 15;
        const runDurationMs = 30;

        const queryPromises = [];
        for (let i = 0; i < concurrency; i++) {
            queryPromises.push(runtime.Sql.executeQuery({
                connectionUrl,
                query: `SELECT SLEEP(${runDurationMs / 1000});`,
                params: []
            }));
        }

        await new Promise(resolve => setTimeout(resolve, 20).unref()); // allow queries to start running

        const pool = runtime.app.connectionManager.getPool(connectionUrl);
        assert.equal(pool.connectionCount, 10);

        await new Promise(resolve => setTimeout(resolve, runDurationMs).unref()); // allow initial batch to finish
        assert.equal(pool.connectionCount, 5);
        await Promise.all(queryPromises);
    });
});
