import { Schema } from 'airtight';

export interface SqlModificationResult {
    rows?: Record<string, any>[];
    fieldData: Record<string, any>;
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
            type: 'object',
            properties: {},
            additionalProperties: { type: 'any' }
        }
    }
});
