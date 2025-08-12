import { RestClient } from '@ministryofjustice/hmpps-rest-client'
import logger from '../../logger'

export type StaffAllocationPolicies = {
  policies: ('KEY_WORKER' | 'PERSONAL_OFFICER')[]
}

export default class AllocationsApiClient extends RestClient {
  async getStaffAllocationPolicies(prisonCode: string, staffId: number) {
    try {
      return await this.get<StaffAllocationPolicies>({
        path: `/prisons/${prisonCode}/staff/${staffId}/job-classifications`,
      })
    } catch (e) {
      logger.error('Error retrieving Staff Allocation Policies', e)
      return { policies: [] }
    }
  }
}
