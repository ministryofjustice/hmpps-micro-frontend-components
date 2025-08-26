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

For local running, start a test db and wiremock instance and build the components application by:

`docker compose -f docker-compose-test.yml up --build`

To recreate the client use of the components, there is a separate application in the integration_tests folder that calls the components endpoint running in docker and implements the response.

Run this server in test mode by:

`npm run start-feature-test-app`

And then either, run tests in headless mode with:

`npm run int-test`

Or run tests with the cypress UI:

`npm run int-test-ui`
