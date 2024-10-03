import assert from 'assert';

import { BulkInsertBuilder } from '../../lib/BulkInsertBuilder.js';
import { SqlConnection } from '../../lib/SqlConnection.js';

describe('InsertBuilder', () => {

    context('PostgreSQL', () => {

        it('returns query in expected format', () => {
            const builder = new BulkInsertBuilder({
                connection: new SqlConnection('postgres://test', 'http://localhost:1234'),
                tableName: 'users',
                rowData: [{ id: 'test', other: 'data' }, { id: 'test2', other: 'data2' }]
            });
            const result = builder.buildQuery();
            const expected = 'INSERT INTO users (id, other) VALUES ($1, $2), ($3, $4);';
            assert.equal(result.query, expected);
        });

        it('correct number + order of params', () => {
            const builder = new BulkInsertBuilder({
                connection: new SqlConnection('postgres://test', 'http://localhost:1234'),
                tableName: 'users',
                rowData: [{ id: 'test', other: 'data' }, { id: 'test2', other: 'data2' }]
            });
            const result = builder.buildQuery();
            assert.equal(result.params.length, 4);
            assert.deepEqual(result.params, ['test', 'data', 'test2', 'data2']);
        });
    });

    context('MySQL', () => {

        it('returns query in expected format', () => {
            const builder = new BulkInsertBuilder({
                connection: new SqlConnection('mysql://test', 'http://localhost:1234'),
                tableName: 'users',
                rowData: [{ id: 'test', other: 'data' }]
            });
            const result = builder.buildQuery();
            const expected = 'INSERT INTO users (id, other) VALUES (?, ?);';
            assert.equal(result.query, expected);
        });
    });
});
