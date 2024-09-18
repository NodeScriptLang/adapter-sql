import { Schema } from 'airtight';

import { FieldInfo, FieldInfoSchema } from './FieldInfo.js';

export interface SqlModificationResult {
    command: string;
    rows?: Record<string, any>[];
    fieldData?: FieldInfo[];
    affectedRows: number;
}

export const SqlModificationResultSchema = new Schema<SqlModificationResult>({
    type: 'object',
    properties: {
        command: { type: 'string' },
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
        affectedRows: { type: 'number' },
    }
});
