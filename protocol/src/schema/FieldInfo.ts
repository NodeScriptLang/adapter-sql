import { Schema } from 'airtight';

export interface FieldInfo {
    name: string;
    type: string;
}

export const FieldInfoSchema = new Schema<FieldInfo>({
    type: 'object',
    properties: {
        name: { type: 'string' },
        type: { type: 'string' }
    },
});
