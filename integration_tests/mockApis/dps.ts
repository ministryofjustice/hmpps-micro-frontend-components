import { stubFor } from './wiremock'

const stubSearchPage = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/new-dps/prisoner-search.*',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: '<html><body><h1>Search</h1></body></html>',
    },
  })

export default {
  stubSearchPage,
}
