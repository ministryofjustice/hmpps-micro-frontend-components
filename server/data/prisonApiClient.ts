import { asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { CaseLoad } from '../interfaces/caseLoad'
import { Location } from '../interfaces/location'
import config from '../config'
import logger, { warnLevelLogger } from '../../logger'

export default class PrisonApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Prison API', config.apis.prisonApi, config.production ? warnLevelLogger : logger, authenticationClient)
  }

  async getUserCaseLoads(token: string): Promise<CaseLoad[]> {
    return this.get<CaseLoad[]>({ path: '/api/users/me/caseLoads' }, asUser(token))
  }

  async getUserLocations(token: string): Promise<Location[]> {
    return this.get<Location[]>({ path: '/api/users/me/locations' }, asUser(token))
  }
}
