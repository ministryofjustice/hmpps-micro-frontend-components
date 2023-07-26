import { stubFor } from './wiremock'

export default {
  getSession: (token: string) =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/session/sessions/(\\S*)/(\\S*)',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          passport: {
            user: {
              token,
              username: 'USER1',
              authSource: 'nomis',
            },
          },
        },
      },
    }),
  postSession: () =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: '/session/sessions/(\\S*)/(\\S*)',
      },
      response: {
        status: 200,
        jsonBody: {},
      },
    }),
  deleteSession: () =>
    stubFor({
      request: {
        method: 'DELETE',
        urlPattern: '/session/sessions/(\\S*)/(\\S*)',
      },
      response: {
        status: 200,
        jsonBody: {},
      },
    }),
}
