import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import logger, { warnLevelLogger } from '../../logger'
import config from '../config'

export type StaffAllocationPolicies = {
  policies: ('KEY_WORKER' | 'PERSONAL_OFFICER')[]
}

export default class AllocationsApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super(
      'Allocations API',
      config.apis.allocationsApi,
      config.production ? warnLevelLogger : logger,
      authenticationClient,
    )
  }

  async getStaffAllocationPolicies(prisonCode: string, staffId: number) {
    try {
      return await this.get<StaffAllocationPolicies>(
        {
          path: `/prisons/${prisonCode}/staff/${staffId}/job-classifications`,
        },
        asSystem(),
      )
    } catch (e) {
      logger.error('Error retrieving Staff Allocation Policies', e)
      return { policies: [] }
    }
  }
}
