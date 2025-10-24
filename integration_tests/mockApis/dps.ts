import { stubFor } from './wiremock'

const stubSearchPage = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/dps/prisoner-search.*',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: '<html><body><h1>Search</h1></body></html>',
    },
  })

const stubCaseloadSwitcherPage = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/dps/change-caseload.*',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: '<html><body><h1>Caseload Switcher</h1></body></html>',
    },
  })

export default {
  stubSearchPage,
  stubCaseloadSwitcherPage,
}
