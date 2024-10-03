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

- **POOL_TTL_MS** (default: 60_000) - pools created that many millis ago will be recycled (this eliminates connection leaks otherwise occurring with high-throughput scenarios)

- **CONNECT_TIMEOUT_MS** (default: 10_000) — the adapter will throw an error if the connection cannot be established within specified timeout.

- **SWEEP_INTERVAL_MS** (default: 30_000) — the interval at which pools are checked for TTL and closed.

Ensure the user/password you use for your database management has admin and/or create-database permissions.


## Testing

Before running tests, ensure you have a supported sql server running locally with a database configured.

Optionally, you can set up docker to host your databases:

MySql container:
```
docker run --name mysql-adapter-test \
  -e MYSQL_ALLOW_EMPTY_PASSWORD=yes \
  -p 5010:3306 \
  -d mysql
```
Postgres container:
```
docker run --name postgres-adapter-test \
  -e POSTGRES_HOST_AUTH_METHOD=trust \
  -p 5011:5432 \
  -d postgres
```

If you aren't using docker, in `.env.test` or just a `.env` (gitignored), file you will need to set two variables:

- **MYSQL_BASE_URL**: `mysql://<user>:<password>@<host>:<port>` 
    - e.g: `mysql://root:admin123@localhost:5010`
- **POSTGRES_BASE_URL**: `postgresql://<user>:<password>@<host>:<port>`
    - e.g: `postgresql://postgres:admin123@localhost:5011`

Replacing your local connection details as necessary. This allows the tests to setup and teardown a test database.

### Load nodes into Nodescript

1. Ensure you have a `.env` file in the `nodes` directory of this repo, with the following variables:

```
    NODESCRIPT_API_URL=http://localhost:32001
    NODESCRIPT_API_TOKEN=
    NODESCRIPT_WORKSPACE_ID=
```

2. If not already cloned, in a different directory clone [Nodescript](https://github.com/ubio/nodescript-platform) repo and follow the instructions in the documentation to get it running locally.

3. Sign into NodeScript and create a new workspace. Copy the Workspace Id from the URL into `NODESCRIPT_WORKSPACE_ID` in `.env`.

4. Create an access token:

    - go to `http://localhost:8082/user/tokens`
    - generate a new token
    - copy the token and paste it into the `NODESCRIPT_API_TOKEN` in `.env` file you created above


5. With `.env` filled, run `npm run publish:nodes`. Make sure the logs list the published nodes.

6. Open (or reload) any graph locally and confirm that the adapter-sql nodes are now available.

**NOTE** - To actually use the nodes in nodescript, you will need to be running this adapter server locally or have a link to a deployed instance of it.
