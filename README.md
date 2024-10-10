# NodeScript SQL Adapter

Facilitates SQL nodes in [NodeScript](https://nodescript.dev).

## Concepts

In order to communicate to SQL from NodeScript you need to deploy the adapter application.

```mermaid
graph LR
    subgraph Cluster
        adapter[SQL Adapter] -- private network --> SQL
    end
    subgraph NodeScript Graph
        node[SQL Nodes] -- public internet --> adapter
    end
```

A single adapter application is able to connect to multiple different SQL databases, thus typically a single adapter deployment is required to facilitate connections to all databases you need. Currently, `PostgreSQL` and `MySQL` are supported. 

NodeScript SQL Adapter is currently available as a docker image at `ghcr.io/nodescriptlang/adapter-sql`.

Example: `docker run -d -e AUTH_SECRET=<some_secret> -p 8080:8080 ghcr.io/nodescriptlang/adapter-sql`

## Configuration

NodeScript Sql Adapter can be configured with the following environment variables:

- **AUTH_SECRET** — authentication shared secret, used to restrict access from graphs to the adapter.

- **POOL_SIZE** (default: 5) - the maximum number of connections to establish to *each* database the adapter connects to.

- **POOL_TTL_MS** (default: 60_000) - pools created that many millis ago will be recycled (this eliminates connection leaks otherwise occurring with high-throughput scenarios)

- **CONNECT_TIMEOUT_MS** (default: 10_000) — the adapter will throw an error if the connection cannot be established within specified timeout.

- **SWEEP_INTERVAL_MS** (default: 30_000) — the interval at which pools are checked for TTL and closed.

## Observability

NodeScript SQL Adapter exposes the following Prometheus metrics on `/metrics` endpoint:

- `nodescript_sql_adapter_connections` — counters depicting connection pool operations, further narrowed down by the `type` label:

    - `connect` — the connection successfully established, but no connection added to the pool just yet
    - `connectionCreated` — a new connection is added to the pool
    - `connectionClosed` — the pool recycles unused connection
    - `fail` — connection failed

- `nodescript_sql_adapter_latency` — histogram with response latencies, includes the following labels:

    - `method` — one of the endpoint methods (e.g. `findOne`, `updateOne`, `updateMany`, etc.)
    - `error` — the error code, omitted if the response was successful

## Usage

1. Ensure your adapter and database are deployed. Refer to the [Readme](./README.md) for guidance.
2. Login to [Nodescript](https://nodescript.dev/login)
3. Either open an existing graph in your chosen workspace, or create a new one.

![Nodescript integration](./docs/images/nodescript-usage.jpeg)

4. Add a `SQL / Connect` node in a graph, then input your adapter and sql connection urls.
    - These can be securely stored as secrets/variables in the workspace `Variables` section, then accessed in graphs within that workspace and connected to the node, as shown above.
5. Add a `SQL / Query` node and connect the output of the `SQL / Connect` to the `connection` socket.
6. Enter your query into the text field. Optionally, provide a parameters array if you are using a parameterized query.
7. Running the `SQL / Query` node will query your designated database using the connection established with your adapter.
