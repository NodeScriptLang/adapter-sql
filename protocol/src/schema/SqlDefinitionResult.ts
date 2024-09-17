import { Schema } from 'airtight';

export interface SqlDefinitionResult {
    command: string;
    fieldData: Record<string, any>;
}


export const SqlDefinitionResultSchema = new Schema<SqlDefinitionResult>({
    type: 'object',
    properties: {
        command: { type: 'string' },
        fieldData: {
            type: 'object',
            properties: {},
            additionalProperties: { type: 'any' }
        }
    },
    additionalProperties: { type: 'any' }
});
