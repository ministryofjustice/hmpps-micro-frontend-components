import RestClient from './restClient'
import logger from '../../logger'

export type StaffAllocationPolicies = {
  policies: ('KEY_WORKER' | 'PERSONAL_OFFICER')[]
}

export default class AllocationsApiClient {
  constructor(private restClient: RestClient) {}

  private async get<T>(args: object): Promise<T> {
    return this.restClient.get<T>(args)
  }

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
