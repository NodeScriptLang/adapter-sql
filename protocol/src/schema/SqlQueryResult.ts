import { Schema } from 'airtight';

import { FieldInfo, FieldInfoSchema } from './FieldInfo.js';

export interface SqlQueryResult {
    rows: Record<string, any>[];
    rowCount: number;
    fieldData: FieldInfo[];
}

export const SqlQueryResultSchema = new Schema<SqlQueryResult>({
    type: 'object',
    properties: {
        rows: {
            type: 'array',
            items: {
                type: 'object',
                properties: {},
                additionalProperties: { type: 'any' }
            }
        },
        rowCount: { type: 'integer' },
        fieldData: {
            type: 'array',
            items: FieldInfoSchema.schema,
        }

    }
});
