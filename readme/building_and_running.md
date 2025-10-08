[< Back](../README.md)
---

## Building and Running



To use the same version of NodeJS locally as is used in CI and production, follow [these notes](nvm.md).

First, build the project by running:

`npm install` and then `npm run build`

The front-end components service has a number of dependencies:

* [redis](https://redis.io/) - session store and token caching
* [hmpps-auth](https://github.com/ministryofjustice/hmpps-auth) - for authentication
* [prison-api](https://github.com/ministryofjustice/prison-api) - the main API for retrieving data from NOMIS

### Developing against the development environment
Development of this application has mainly relied on configuring `hmpps-micro-frontent-components` to point at the development
environment instances of the above dependencies (redis being the exception, a local instance of this was used).

Here's the process.

1/ Run redis locally using Docker:
```
docker compose pull && docker compose up
```

2/ Create a .env file with environment variables pointing to the development environment
<details>
<summary>Click here for an example of the .env file</summary>
<br>
Note, personal client credentials need to be requested from the Auth team
to provide the missing client id and secret variables.

```
PORT=3000
NODE_ENV=development
API_CLIENT_ID=
API_CLIENT_SECRET=
SYSTEM_CLIENT_ID=
SYSTEM_CLIENT_SECRET=
TOKEN_VERIFICATION_ENABLED=true
HMPPS_AUTH_URL=https://sign-in-dev.hmpps.service.justice.gov.uk/auth
PRISON_API_URL=https://prison-api-dev.prison.service.justice.gov.uk
TOKEN_VERIFICATION_API_URL=https://token-verification-api-dev.prison.service.justice.gov.uk
CONTENTFUL_HOST=https://graphql.eu.contentful.com
CONTENTFUL_ENVIRONMENT=master
CONTENTFUL_ACCESS_TOKEN=
CONTENTFUL_SPACE_ID=
```
</details>

3/ And then, to build the assets and start the app with esbuild:
```
npm run start:dev
```

4/ To access the service, navigate in a web browser to http://localhost:3000/develop
this will take you to a landing page containing links to the components.

### Developing locally

TODO

### Run linter

After making code changes eslint can be used to ensure code style is maintained
(although husky ensures this is run as part of the pre-commit hook too)
```
npm run lint
```
