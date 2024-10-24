export class SqlError extends Error {

    override name = 'SqlError';
    status = 500;
    details: any;

    constructor(err: any) {
        super(err.message);
        this.details = {
            code: err.code,
        };
    }

}
