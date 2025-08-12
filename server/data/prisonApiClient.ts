import { RestClient, SanitisedError } from '@ministryofjustice/hmpps-rest-client'
import { CaseLoad } from '../interfaces/caseLoad'
import { Location } from '../interfaces/location'

export default class PrisonApiClient extends RestClient {
  async getUserCaseLoads(): Promise<CaseLoad[]> {
    return this.get<CaseLoad[]>({ path: '/api/users/me/caseLoads' })
  }

  async getIsKeyworker(activeCaseloadId: string, staffId: number): Promise<boolean> {
    return this.get<boolean>({
      path: `/api/staff/${staffId}/${activeCaseloadId}/roles/KW`,
      errorHandler: <ERROR>(path: string, verb: string, error: SanitisedError<ERROR>) => {
        if (error.responseStatus === 403 || error.responseStatus === 404) {
          return false
        }
        throw error
      },
    })
  }

  async getUserLocations(): Promise<Location[]> {
    return this.get<Location[]>({ path: '/api/users/me/locations' })
  }
}
