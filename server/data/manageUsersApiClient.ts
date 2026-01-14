import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import logger, { warnLevelLogger } from '../../logger'
import config from '../config'
import { UserCaseloadDetail } from '../interfaces/userCaseloadDetail'
import { CaseLoad } from '../interfaces/caseLoad'

export default class ManageUsersApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Manage Users API', config.apis.manageUsersApi, config.production ? warnLevelLogger : logger, authenticationClient)
  }

  async getUserCaseLoads(username: string): Promise<CaseLoad[]> {
    const userCaseloadDetail = await this.get<UserCaseloadDetail>({ path: `/prisonusers/${username}/caseloads` }, asSystem())
    return userCaseloadDetail.caseloads.map(c => ({
        caseLoadId: c.id,
        description: c.name,
        type: "N/A",
        caseloadFunction: ['CADM_I', 'ADMIN_C', 'ADMIN_I'].includes(c.id)? 'ADMIN' : 'GENERAL',
        currentlyActive: userCaseloadDetail.activeCaseload.id === c.id,
    }))
  }
}
