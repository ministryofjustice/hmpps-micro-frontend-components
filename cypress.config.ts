import { defineConfig } from 'cypress'
import { resetStubs } from './integration_tests/mockApis/wiremock'
import auth from './integration_tests/mockApis/auth'
import manageUsersApi from './integration_tests/mockApis/manageUsersApi'
import tokenVerification from './integration_tests/mockApis/tokenVerification'
import exampleApi from './integration_tests/mockApis/exampleApi'
import dps from './integration_tests/mockApis/dps'
import allocationsApi from './integration_tests/mockApis/allocationsApi'
import locationsInsidePrisonApi from './integration_tests/mockApis/locationsInsidePrisonApi'

export default defineConfig({
  chromeWebSecurity: false,
  fixturesFolder: 'integration_tests/fixtures',
  screenshotsFolder: 'integration_tests/screenshots',
  videosFolder: 'integration_tests/videos',
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    configFile: 'reporter-config.json',
  },
  taskTimeout: 60000,
  e2e: {
    experimentalRunAllSpecs: true,
    setupNodeEvents(on) {
      on('task', {
        reset: resetStubs,
        ...auth,
        ...manageUsersApi,
        ...tokenVerification,
        ...exampleApi,
        ...dps,
        ...allocationsApi,
        ...locationsInsidePrisonApi,
      })
    },
    baseUrl: 'http://localhost:3007',
    excludeSpecPattern: '**/!(*.cy).ts',
    specPattern: 'integration_tests/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'integration_tests/support/index.ts',
    allowCypressEnv: false,
  },
})
