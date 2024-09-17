import { Schema } from 'airtight';

export interface SqlQueryResult {
    rows: Record<string, any>[];
    fieldData?: Record<string, any>;
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
        fieldData: {
            type: 'object',
            properties: {},
            additionalProperties: { type: 'any' },
            optional: true,
        }

    }
});
