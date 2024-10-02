export type BulkInsertParams = {
    vendor: 'PostgreSQL' | 'MySQL';
    tableName: string;
    rowData: Record<string, any>[];
    returning?: string;
};

export type BulkInsertResult = {
    query: string;
    params: any[];
};

export class BulkInsertBuilder {
    private vendor: 'PostgreSQL' | 'MySQL';
    private rowData: Record<string, any>[];
    private tableName: string;
    private returning: string;
    private queryParams: any[] = [];

    constructor(params: BulkInsertParams) {
        this.vendor = params.vendor;
        this.rowData = params.rowData;
        this.tableName = params.tableName;
        this.returning = params.returning ?? '';
    }

    buildQuery() {
        const fields = Object.keys(this.rowData[0]);
        let query = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES `;

        const valuePlaceholders = this.rowData.map(data => {
            const placeholders = fields.map(field => this.extractParam(data[field]));
            return `(${placeholders.join(', ')})`;
        });

        query += valuePlaceholders.join(', ');

        if (this.vendor === 'PostgreSQL') {
            query += this.formatReturningClause();
        }

        return { query: query + ';', params: this.queryParams };
    }

    private extractParam(value: any): string {
        this.queryParams.push(value);
        let suffix = '';
        if (typeof value === 'number' && this.vendor === 'PostgreSQL') {
            suffix = '::integer';
        }
        return this.getVendorPlaceholder(this.queryParams.length) + suffix;
    }

    private getVendorPlaceholder(paramIndex: number): string {
        if (this.vendor === 'PostgreSQL') {
            return `$${paramIndex}`;
        }
        if (this.vendor === 'MySQL') {
            return '?';
        }
        return '';
    }

    private formatReturningClause(): string {
        if (this.returning.trim() !== '') {
            return ` RETURNING ${this.returning.trimEnd().replace(/;$/, '')}`;
        }
        return '';
    }

}

