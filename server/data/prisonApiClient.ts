import RestClient from './restClient'
import { CaseLoad } from '../interfaces/caseLoad'
import { StaffRole } from '../@types/StaffRole'
import { Location } from '../interfaces/location'

export default class PrisonApiClient {
  constructor(private restClient: RestClient) {}

  private async get<T>(args: object): Promise<T> {
    return this.restClient.get<T>(args)
  }

  async getUserCaseLoads(): Promise<CaseLoad[]> {
    return this.get<CaseLoad[]>({ path: '/api/users/me/caseLoads' })
  }

  async getStaffRoles(activeCaseloadId: string, staffId: number): Promise<StaffRole[]> {
    return this.get<StaffRole[]>({ path: `/api/staff/${staffId}/${activeCaseloadId}/roles` })
  }

  async getUserLocations(): Promise<Location[]> {
    return this.get<Location[]>({ path: '/api/users/me/locations' })
  }
}
