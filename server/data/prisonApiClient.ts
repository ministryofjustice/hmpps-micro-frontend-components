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
    try {
      return await this.get<boolean>({ path: `/api/staff/${staffId}/${activeCaseloadId}/roles/KW` })
    } catch (error) {
      if (error.status === 403 || error.status === 404) {
        // can happen for CADM (central admin) users
        return false
      }
      throw error
    }
  }

  async getUserLocations(): Promise<Location[]> {
    return this.get<Location[]>({ path: '/api/users/me/locations' })
  }
}
