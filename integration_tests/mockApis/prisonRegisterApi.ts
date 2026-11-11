import { stubFor } from './wiremock'

const stubPrisonRegister = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/prison-register/prisons',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: [
        { prisonId: 'MDI', active: true },
        { prisonId: 'LEI', active: true },
      ],
    },
  })

export default {
  stubPrisonRegister,
}
