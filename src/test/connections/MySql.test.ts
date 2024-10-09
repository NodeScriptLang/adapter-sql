import assert from 'assert';

import { runtime } from '../runtime.js';
import { poll } from '../utils.js';


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
        const poolCappedAndReleased = await pollConnections(connectionUrl);
        assert.ok(poolCappedAndReleased);
        await Promise.all(queryPromises);
    });
});

async function pollConnections(connectionUrl: string) {
    let reachedLimit = false;
    return await poll(async () => {
        const pool = runtime.app.connectionManager.getPool(connectionUrl);
        if (pool.connectionCount === 10 && !reachedLimit) {
            reachedLimit = true;
        }
        if (pool.connectionCount < 10 && reachedLimit) {
            return true;
        }
        throw new Error('Never reached pool limit or failed to release');
    });
}
