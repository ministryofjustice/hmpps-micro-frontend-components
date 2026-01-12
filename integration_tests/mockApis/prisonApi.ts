import { stubFor } from './wiremock'
import { CaseLoad } from '../../server/interfaces/caseLoad'

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
      urlPattern: '/prison/api/staff/[^/]+/caseloads',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: caseloads,
    },
  })

export default {
  stubCaseloads,
}
