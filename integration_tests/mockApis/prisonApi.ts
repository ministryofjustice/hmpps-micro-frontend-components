import { stubFor } from './wiremock'
import { CaseLoad } from '../../server/interfaces/caseLoad'
import { PrisonHierarchyDto } from '../../server/interfaces/location'

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

const stubLocations = (
  locations: PrisonHierarchyDto[] = [
    {
      locationId: '2475f250-434a-4257-afe7-b911f1773a4d',
      locationType: 'CELL',
      locationCode: '001',
      fullLocationPath: 'A-1-001',
      localName: 'Wing A',
      level: 1,
      status: 'ACTIVE',
      subLocations: [],
    },
  ],
) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/prison/api/users/me/locations',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: locations,
    },
  })

export default {
  stubCaseloads,
  stubLocations,
}
