import assert from 'assert';

import { runtime } from '../runtime.js';

describe('HTTP', () => {
    it('throws sql errors with psql', async () => {
        const res = await fetch(runtime.baseUrl + '/Sql/query', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                connectionUrl: runtime.testPostgresUrl,
                query: 'SELECT daisy FROM whoopsie;',
                params: []
            }),
        });
        const body = await res.json();
        assert.strictEqual(body.name, 'SqlError');
    });

    it('throws sql errors with mysql', async () => {
        const res = await fetch(runtime.baseUrl + '/Sql/query', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                connectionUrl: runtime.testMySqlUrl,
                query: 'SELECT daisy FROM whoopsie;',
                params: []
            }),
        });
        const body = await res.json();
        assert.strictEqual(body.name, 'SqlError');
    });

});
