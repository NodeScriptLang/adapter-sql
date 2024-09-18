import { Schema } from 'airtight';

export interface SqlDefinitionResult {
    command: string;
}


export const SqlDefinitionResultSchema = new Schema<SqlDefinitionResult>({
    type: 'object',
    properties: {
        command: { type: 'string' },
    },
    additionalProperties: { type: 'any' }
});
