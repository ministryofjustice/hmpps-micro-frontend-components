[< Back](../README.md)
---

## Testing

### Run linter

`npm run lint`

### Run tests

Some of the unit tests currently depend on Redis. Start a redis container:

`docker compose -f docker-compose-test.yml up redis`

Then run the unit tests:

`npm run test`

### Running integration tests

#### Setup redis and wiremock using Docker:

`docker compose -f docker-compose-test.yml up`

#### Start the Micro Frontend Components service in integration test mode:

`npm run start-feature:dev`

#### Build and run the test service:

To recreate the client use of the components, there is a separate application in the integration_tests folder that
calls the components endpoint and implements the response.

Build and run the test application:

```shell
npm -prefix integration_tests install
npm -prefix integration_tests run build
npm run start-feature-test-app
```

#### Run the integration test suite:

In headless mode: `npm run int-test`
or with the cypress UI: `npm run int-test-ui`
