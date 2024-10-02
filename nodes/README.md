# Adapter-sql-nodes

This package contains the specs for Nodescript nodes used when interacting with SQL databases.

## Running locally

Install with `npm i`, compile with  `npm run compile`

### Load nodes into Nodescript

1. Ensure you have a `.env` file in the root of this repo, with the following variables:

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

**NOTE** - To actually use the nodes in nodescript, you will also need to be running [adapter-sql](https://github.com/NodeScriptLang/adapter-sql) or have a link to a deployed instance of it. Refer to the documentation in that repo to get it set up.