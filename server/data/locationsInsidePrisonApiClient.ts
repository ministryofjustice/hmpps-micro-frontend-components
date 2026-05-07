import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { PrisonHierarchyDto } from '../interfaces/location'
import config from '../config'
import logger, { warnLevelLogger } from '../../logger'
import { PrisonCaseload } from '../interfaces/caseLoad'

export default class LocationsInsidePrisonApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super(
      'Locations Inside Prison API',
      config.apis.locationsInsidePrisonApi,
      config.production ? warnLevelLogger : logger,
      authenticationClient,
    )
  }

  async getUserLocations(caseLoad: PrisonCaseload): Promise<PrisonHierarchyDto[]> {
    if (caseLoad.function === 'ADMIN') return [] as PrisonHierarchyDto[]
    return this.get<PrisonHierarchyDto[]>(
      { path: `/locations/prison/${caseLoad.id}/residential-first-level` },
      asSystem(),
    )
  }
}
