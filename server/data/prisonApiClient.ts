import RestClient from './restClient'
import { CaseLoad } from '../interfaces/caseLoad'
import { Location } from '../interfaces/location'

export default class PrisonApiClient {
  constructor(private restClient: RestClient) {}

  private async get<T>(args: object): Promise<T> {
    return this.restClient.get<T>(args)
  }

  async getUserCaseLoads(): Promise<CaseLoad[]> {
    return this.get<CaseLoad[]>({ path: '/api/users/me/caseLoads' })
  }

  async getIsKeyworker(activeCaseloadId: string, staffId: number): Promise<boolean> {
    return this.get<boolean>({ path: `/api/staff/${staffId}/${activeCaseloadId}/roles/KW` })
  }

  async getUserLocations(): Promise<Location[]> {
    return this.get<Location[]>({ path: '/api/users/me/locations' })
  }
}
