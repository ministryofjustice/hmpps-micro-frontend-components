/* eslint-disable import/no-relative-packages */
import { stubFor } from './wiremock'
import { CaseLoad } from '../../../server/interfaces/caseLoad'

const stubCaseloads = (
  caseloads: CaseLoad[] = [
    {
      caseLoadId: 'MDI',
      currentlyActive: true,
      description: 'Moorland',
      type: 'INST',
      caseloadFunction: 'GENERAL',
    },
    {
      caseLoadId: 'LEI',
      currentlyActive: false,
      description: 'Leeds',
      type: 'INST',
      caseloadFunction: 'GENERAL',
    },
  ],
) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/prison/api/users/me/caseLoads',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: caseloads,
    },
  })

const stubLocations = (staffId = '12345', prisonCode = 'MDI', isKeyworker: boolean = true) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/prison/api/staff/${staffId}/${prisonCode}/roles/KW`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: isKeyworker,
    },
  })

export default {
  stubCaseloads,
  stubLocations,
}
