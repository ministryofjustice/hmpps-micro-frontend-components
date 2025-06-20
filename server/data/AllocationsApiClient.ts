import RestClient from './restClient'

export type StaffAllocationPolicies = {
  policies: ('KEY_WORKER' | 'PERSONAL_OFFICER')[]
}

export default class AllocationsApiClient {
  constructor(private restClient: RestClient) {}

  private async get<T>(args: object): Promise<T> {
    return this.restClient.get<T>(args)
  }

  async getStaffAllocationPolicies(prisonCode: string, staffId: number) {
    return this.get<StaffAllocationPolicies>({ path: `/prisons/${prisonCode}/staff/${staffId}/job-classifications` })
  }
}
