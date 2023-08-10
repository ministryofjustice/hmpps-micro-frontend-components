import RestClient from './restClient'
import { CaseLoad } from '../interfaces/caseLoad'

export default class PrisonApiClient {
  constructor(private restClient: RestClient) {}

  private async get<T>(args: object): Promise<T> {
    return this.restClient.get<T>(args)
  }

  async getUserCaseLoads(): Promise<CaseLoad[]> {
    return this.get<CaseLoad[]>({ path: '/api/users/me/caseLoads' })
  }
}
