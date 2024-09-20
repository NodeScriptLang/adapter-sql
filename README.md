# NodeScript SQL Adapter

Facilitates SQL nodes in [NodeScript](https://nodescript.dev).

## Development

### Requirements

- Node
- Postgres
- MySql

### Run locally:

Install with `npm i` then run with `npm run dev`. Ensure you have a supported sql server running with a database configured.

Make requests to `http://localhost:8183/Sql/<endpoint>`. Refer to the schemas in `/protocol` for further information on the requirements for each request.


## Configuration

NodeScript Sql Adapter can be configured with the following environment variables:

- **AUTH_SECRET** — authentication shared secret, used to restrict access from graphs to the adapter.

- **POOL_SIZE** (default: 5) - the maximum number of connections to establish to *each* database the adapter connects to.

- **POOL_TTL_MS** (default: 60_00) - pools created that many millis ago will be recycled (this eliminates connection leaks otherwise occurring with high-throughput scenarios)

- **CONNECT_TIMEOUT_MS** (default: 10_000) — the adapter will throw an error if the connection cannot be established within specified timeout.

- **SWEEP_INTERVAL_MS** (default: 30_000) — the interval at which pools are checked for TTL and closed.

Ensure the user/password you use for your database management has admin and/or create-database permissions.


## Testing

Before running tests, ensure you have a supported sql server running locally with a database configured. In `.env.test` file you will need to set:

- **POSTGRES_BASE_URL** - e.g: `postgres://root:admin123@localhost:2345`
- **MYSQL_BASE_URL** - e.g: `mysql://root:admin123@localhost:2345`

This allows the tests to setup and teardown a test database.