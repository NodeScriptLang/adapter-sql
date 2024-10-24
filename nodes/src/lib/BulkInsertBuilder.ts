import { BulkInsertParams } from '../nodes/Sql.ExecuteBulkInsert.js';

export class BulkInsertBuilder {

    private connectionUrl: string;
    private rowData: Array<Record<string, any>>;
    private tableName: string;
    private queryParams: any[] = [];

    constructor(params: BulkInsertParams) {
        this.connectionUrl = params.connection.connectionUrl;
        this.rowData = params.rowData;
        this.tableName = params.tableName;
    }

    buildQuery() {
        const fields = Object.keys(this.rowData[0]);
        let query = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES `;

        const valuePlaceholders = this.rowData.map(data => {
            const placeholders = fields.map(field => this.extractParam(data[field]));
            return `(${placeholders.join(', ')})`;
        });

        query += valuePlaceholders.join(', ');

        return { query: query + ';', params: this.queryParams };
    }

    private extractParam(value: any): string {
        this.queryParams.push(value);
        return this.getVendorPlaceholder(this.queryParams.length);
    }

    private getVendorPlaceholder(paramIndex: number): string {
        if (this.connectionUrl.startsWith('postgres')) {
            return `$${paramIndex}`;
        }
        if (this.connectionUrl.startsWith('mysql')) {
            return '?';
        }
        return '';
    }

}
