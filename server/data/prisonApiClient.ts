import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { CaseLoad } from '../interfaces/caseLoad'
import config from '../config'
import logger, { warnLevelLogger } from '../../logger'

export default class PrisonApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Prison API', config.apis.prisonApi, config.production ? warnLevelLogger : logger, authenticationClient)
  }

  async getUserCaseLoads(staffId: number): Promise<CaseLoad[]> {
    return this.get<CaseLoad[]>({ path: `/api/staff/${staffId}/caseloads` }, asSystem())
  }
}
