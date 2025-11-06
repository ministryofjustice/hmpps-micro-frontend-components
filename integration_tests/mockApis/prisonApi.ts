import { stubFor } from './wiremock'
import { CaseLoad } from '../../server/interfaces/caseLoad'
import { Location } from '../../server/interfaces/location'

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
  locations: Location[] = [
    {
      locationId: 1,
      locationType: 'INST',
      description: 'Moorland (HMP & YOI)',
      agencyId: 'MDI',
      currentOccupancy: 1,
      locationPrefix: 'MDI',
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
