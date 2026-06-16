[← Back](../README.md)
---

## Building and running

To use the same version of NodeJS locally as is used in CI and production, follow [these notes](nvm.md).

First, build the project by running:

`npm run setup` and then `npm run build`

The front-end components service has a number of dependencies:

* [redis](https://redis.io/) - session store and token caching
* [hmpps-auth](https://github.com/ministryofjustice/hmpps-auth) - for authentication
* [prison-api](https://github.com/ministryofjustice/prison-api) - the main API for retrieving data from NOMIS

### Developing against the development environment
Development of this application has mainly relied on configuring `hmpps-micro-frontent-components` to point at the development
environment instances of the above dependencies (redis being the exception, a local instance of this was used).

Here's the process.

1) Run sidecar services locally using Docker:
    ```shell
    docker compose -f docker-compose-test.yml up
    ```

2) Create a `.env` file with environment variables pointing to the development environment by copying `.env.example`
and following the instructions in the file

3) And then, to build the assets and start the app with esbuild:
    ```shell
    npm run start:dev
    ```

4) To access the service, navigate in a web browser to http://localhost:3000/develop
this will take you to a landing page containing links to the components.

### Run tests & linters

- Unit tests: `npm test` runs `jest` (sidecar services are needed from the previous section).
- Integration tests: in separate shells `npm run start-feature` or `npm run start-feature:dev`,
  `npm run start-feature-test-app`,
  `npm run int-test` or `npm run int-test-ui` runs `cypress` (sidecar services are needed from the previous section).
- Code style: `npm run lint` runs `eslint`.
- Type checking: `npm run typecheck` runs the TypeScript compiler `tsc`.
