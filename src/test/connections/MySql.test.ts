import assert from 'assert';

import { runtime } from '../runtime.js';


describe('MySql Connections', () => {
    beforeEach(async () => {
        const connectionUrl = runtime.testMySqlUrl;
        await runtime.Sql.query({
            connectionUrl,
            query: 'DROP TABLE IF EXISTS test;'
        });
        await runtime.Sql.query({
            connectionUrl,
            query: 'CREATE TABLE test (id SERIAL PRIMARY KEY, username VARCHAR(50));'
        });
    });
    afterEach(async () => {
        const connectionUrl = runtime.testMySqlUrl;
        await runtime.Sql.query({
            connectionUrl,
            query: 'DROP TABLE test;'
        });
    });

    it('releases connection after use', async () => {
        const connectionUrl = runtime.testMySqlUrl;
        await runtime.Sql.query({ connectionUrl, query: 'SELECT * FROM test;', params: [] });
        const pool = runtime.app.connectionManager.getPool(connectionUrl);
        assert.deepEqual(pool.connectionCount, 0);
    });

    it('releases connection on error', async () => {
        const connectionUrl = runtime.testMySqlUrl;
        try {
            await runtime.Sql.query({ connectionUrl, query: 'SELECT * FROM nonexistent;', params: [] });
        } catch (err) {
            // ignore the error
        }
        const pool = runtime.app.connectionManager.getPool(connectionUrl);
        assert.deepEqual(pool.connectionCount, 0);

        const { result } = await runtime.Sql.query({ connectionUrl, query: 'SELECT * FROM test;', params: [] });
        assert.ok(result);
    });

    it('queue + release - pool size limit 10', async () => {
        const connectionUrl = runtime.testMySqlUrl;
        const concurrency = 15;
        const runDurationMs = 30;

        const queryPromises = [];
        for (let i = 0; i < concurrency; i++) {
            queryPromises.push(runtime.Sql.query({
                connectionUrl,
                query: `SELECT SLEEP(${runDurationMs / 1000});`,
                params: []
            }));
        }

        const pool = runtime.app.connectionManager.getPool(connectionUrl);

        const counts: number[] = [];
        await new Promise(resolve => {
            const startTime = Date.now();
            const checkInterval = setInterval(() => {
                if (Date.now() - startTime > (runDurationMs * 2)) {
                    clearInterval(checkInterval);
                    resolve(null);
                }
                counts.push(pool.connectionCount);
            }, 5);
        });

        const poolCappedAndReleased = counts.includes(10) && counts.at(-1) !== 10;
        assert.ok(poolCappedAndReleased);
        await Promise.all(queryPromises); // let all queries run
        assert.equal(pool.connectionCount, 0); // no stale connections after queue + release
    });
});
