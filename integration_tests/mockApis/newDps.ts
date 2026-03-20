import { stubFor } from './wiremock'

const stubCaseloadSwitcherPage = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/new-dps/change-caseload.*',
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
  stubCaseloadSwitcherPage,
}
