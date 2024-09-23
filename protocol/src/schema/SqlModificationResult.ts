import { Schema } from 'airtight';

import { FieldInfo, FieldInfoSchema } from './FieldInfo.js';

export interface SqlModificationResult {
    rows?: Record<string, any>[];
    fieldData?: FieldInfo[];
    affectedRowCount: number;
}

export const SqlModificationResultSchema = new Schema<SqlModificationResult>({
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
        fieldData: {
            type: 'array',
            items: FieldInfoSchema.schema,
            optional: true
        },
        affectedRowCount: { type: 'number' },
    }
});
