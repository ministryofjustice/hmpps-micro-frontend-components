import { asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { CaseLoad } from '../interfaces/caseLoad'
import { Location } from '../interfaces/location'
import config from '../config'
import logger from '../../logger'

export default class PrisonApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Prison API', config.apis.prisonApi, logger, authenticationClient)
  }

  async getUserCaseLoads(token: string): Promise<CaseLoad[]> {
    return this.get<CaseLoad[]>({ path: '/api/users/me/caseLoads' }, asUser(token))
  }

  async getIsKeyworker(token: string, activeCaseloadId: string, staffId: number): Promise<boolean> {
    try {
      return await this.get<boolean>({ path: `/api/staff/${staffId}/${activeCaseloadId}/roles/KW` }, asUser(token))
    } catch (error) {
      if (error.status === 403 || error.status === 404) {
        // can happen for CADM (central admin) users
        return false
      }
      throw error
    }
  }

  async getUserLocations(token: string): Promise<Location[]> {
    return this.get<Location[]>({ path: '/api/users/me/locations' }, asUser(token))
  }
}
