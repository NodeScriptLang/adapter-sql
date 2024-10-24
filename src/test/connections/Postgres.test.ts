import assert from 'assert';

import { runtime } from '../runtime.js';

describe('Postgres Connections', () => {
    beforeEach(async () => {
        const connectionUrl = runtime.testPostgresUrl;
        await runtime.Sql.query({ connectionUrl,
            query: 'DROP TABLE IF EXISTS test;' });
        await runtime.Sql.query({ connectionUrl,
            query: 'CREATE TABLE test (id SERIAL PRIMARY KEY, username VARCHAR(50));' });
    });
    afterEach(async () => {
        const connectionUrl = runtime.testPostgresUrl;
        await runtime.Sql.query({ connectionUrl,
            query: 'DROP TABLE test;' });
    });

    it('releases connection after use', async () => {
        const connectionUrl = runtime.testPostgresUrl;
        await runtime.Sql.query({ connectionUrl, query: 'SELECT * FROM test;', params: [] });
        const pool = runtime.app.connectionManager.getPool(connectionUrl);
        assert.deepEqual(pool.connectionCount, 0);
    });

    it('releases connection on error', async () => {
        const connectionUrl = runtime.testPostgresUrl;
        try {
            await runtime.Sql.query({ connectionUrl, query: 'SELECT * FROM nonexistent;', params: [] });
        } catch (_err) {
            // ignore the error
        }
        const pool = runtime.app.connectionManager.getPool(connectionUrl);
        assert.deepEqual(pool.connectionCount, 0);

        const { result } = await runtime.Sql.query({ connectionUrl, query: 'SELECT * FROM test;', params: [] });
        assert.ok(result);
    });

    it('queue + release - pool size limit 10', async () => {
        const connectionUrl = runtime.testPostgresUrl;
        const concurrency = 15;
        const runDurationMs = 30;

        const queryPromises = [];
        for (let i = 0; i < concurrency; i++) {
            queryPromises.push(runtime.Sql.query({
                connectionUrl,
                query: `SELECT pg_sleep_for('${runDurationMs} milliseconds'::interval);`,
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
