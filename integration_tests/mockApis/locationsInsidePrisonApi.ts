import { stubFor } from './wiremock'
import { PrisonHierarchyDto } from '../../server/interfaces/location'

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
      urlPattern: '/locations/prison/[^/]+/residential-first-level',
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
  stubLocations,
}
