import { asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger, { warnLevelLogger } from '../../logger'

type PrisonApiCaseload = {
  caseLoadId: string
  description: string
  caseloadFunction?: string
  currentlyActive: boolean
}

export default class PrisonApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Prison API', config.apis.prisonApi, config.production ? warnLevelLogger : logger, authenticationClient)
  }

  async setActiveCaseload(userToken: string, caseLoad: PrisonApiCaseload): Promise<void> {
    await this.put<Record<string, string>>({ path: '/api/users/me/activeCaseLoad', data: caseLoad }, asUser(userToken))
  }
}
