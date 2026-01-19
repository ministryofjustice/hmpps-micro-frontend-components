import { stubFor } from './wiremock'

const stubUser = (name: string = 'john smith') =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/manage-users-api/users/me',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {
        username: 'USER1',
        active: true,
        name,
      },
    },
  })

const stubUserRoles = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/manage-users-api/users/me/roles',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: [{ roleCode: 'SOME_USER_ROLE' }],
    },
  })

const ping = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/manage-users-api/health/ping',
    },
    response: {
      status: 200,
    },
  })

const stubUserCaseloads = (
  caseloads = [
    { id: 'MDI', name: 'Moorland', function: 'GENERAL' },
    { id: 'LEI', name: 'Leeds', function: 'GENERAL' },
  ],
) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/manage-users-api/prisonusers/[^/]+/caseloads',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {
        username: 'TOKEN_USER',
        active: true,
        accountType: '',
        activeCaseload: caseloads[0],
        caseloads,
      },
    },
  })

export default {
  stubManageUser: stubUser,
  stubManageUsersPing: ping,
  stubManageUserRoles: stubUserRoles,
  stubUserCaseloads,
}
