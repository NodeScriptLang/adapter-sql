import assert from 'assert';

import { runtime } from '../runtime.js';

describe('Connection Manager', () => {

    beforeEach(async () => {
        await runtime.app.connectionManager.stop();
        await runtime.app.connectionManager.start();
    });

    it('same url = single pool', async () => {
        const connectionUrl = runtime.testPostgresUrl;

        runtime.app.connectionManager.getPool(connectionUrl);
        runtime.app.connectionManager.getPool(connectionUrl);
        const poolCount = runtime.app.connectionManager.poolCount;
        assert.equal(poolCount, 1);
    });

    it('multiple urls = multiple pools', async () => {
        const connectionUrl = runtime.testPostgresUrl;
        const connectionUrl2 = runtime.testMySqlUrl;

        runtime.app.connectionManager.getPool(connectionUrl);
        runtime.app.connectionManager.getPool(connectionUrl2);
        const poolCount = runtime.app.connectionManager.poolCount;
        assert.equal(poolCount, 2);
    });

    context('Postgres', () => {
        it('closes + can reopen pools after TTL expires', async () => {
            const connectionUrl = runtime.testPostgresUrl;

            runtime.app.connectionManager.getPool(connectionUrl);
            await new Promise(resolve => setTimeout(resolve, 1)); // pool age > expiry time
            await runtime.app.connectionManager.closeExpired(0);

            const sweptCount = runtime.app.connectionManager.poolCount;
            assert.equal(sweptCount, 0, 'Expected no pools to be open');

            runtime.app.connectionManager.getPool(connectionUrl);
            const activeCount = runtime.app.connectionManager.poolCount;
            assert.equal(activeCount, 1, 'Expected 1 pool to be open');
        });
    });

    context('MySql', () => {
        it('closes + can reopen pools after TTL expires', async () => {
            const connectionUrl = runtime.testMySqlUrl;

            runtime.app.connectionManager.getPool(connectionUrl);
            await new Promise(resolve => setTimeout(resolve, 1)); // pool age > expiry time
            await runtime.app.connectionManager.closeExpired(0);

            const sweptCount = runtime.app.connectionManager.poolCount;
            assert.equal(sweptCount, 0, 'Expected no pools to be open');

            runtime.app.connectionManager.getPool(connectionUrl);
            const activeCount = runtime.app.connectionManager.poolCount;
            assert.equal(activeCount, 1, 'Expected 1 pool to be open');
        });
    });
});
