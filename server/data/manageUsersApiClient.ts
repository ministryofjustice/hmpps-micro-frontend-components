import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import logger, { warnLevelLogger } from '../../logger'
import config from '../config'
import { UserCaseloadDetail } from '../interfaces/caseLoad'

export default class ManageUsersApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super(
      'Manage Users API',
      config.apis.manageUsersApi,
      config.production ? warnLevelLogger : logger,
      authenticationClient,
    )
  }

  async getUserCaseLoads(username: string): Promise<UserCaseloadDetail> {
    return this.get<UserCaseloadDetail>({ path: `/prisonusers/${username}/caseloads` }, asSystem())
  }
}
