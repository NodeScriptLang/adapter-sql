import { Schema } from 'airtight';

import { FieldInfo, FieldInfoSchema } from './FieldInfo.js';

export interface SqlQueryResult {
    rows?: Array<Record<string, any>>;
    rowCount?: number;
    fieldData?: FieldInfo[];
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
            },
            optional: true
        },
        rowCount: { type: 'integer', optional: true },
        fieldData: {
            type: 'array',
            items: FieldInfoSchema.schema,
            optional: true
        }

    }
});
