import assert from 'assert';

import { BulkInsertBuilder } from '../../lib/BulkInsertBuilder.js';

describe('InsertBuilder', () => {

    context('PostgreSQL', () => {

        it('returns query in expected format', () => {
            const builder = new BulkInsertBuilder({
                vendor: 'PostgreSQL',
                tableName: 'users',
                returning: '',
                rowData: [{ id: 'test', other: 'data' }, { id: 'test2', other: 'data2' }]
            });
            const result = builder.buildQuery();
            const expected = 'INSERT INTO users (id, other) VALUES ($1, $2), ($3, $4);';
            assert.equal(result.query, expected);
        });

        it('correct number + order of params', () => {
            const builder = new BulkInsertBuilder({
                vendor: 'PostgreSQL',
                tableName: 'users',
                returning: '',
                rowData: [{ id: 'test', other: 'data' }, { id: 'test2', other: 'data2' }]
            });
            const result = builder.buildQuery();
            assert.equal(result.params.length, 4);
            assert.deepEqual(result.params, ['test', 'data', 'test2', 'data2']);
        });

        it('handles returning operations', () => {
            const builder = new BulkInsertBuilder({
                vendor: 'PostgreSQL',
                tableName: 'users',
                returning: '*',
                rowData: [{ id: 'test', other: 'data' }]
            });
            const result = builder.buildQuery();
            assert.ok(result.query.endsWith('RETURNING *;'));
        });
    });

    context('MySQL', () => {

        it('returns query in expected format', () => {
            const builder = new BulkInsertBuilder({
                vendor: 'MySQL',
                tableName: 'users',
                returning: '',
                rowData: [{ id: 'test', other: 'data' }]
            });
            const result = builder.buildQuery();
            const expected = 'INSERT INTO users (id, other) VALUES (?, ?);';
            assert.equal(result.query, expected);
        });
    });
});
