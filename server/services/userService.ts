import { convertToTitleCase } from '../utils/utils'
import type HmppsAuthClient from '../data/hmppsAuthClient'
import { RestClientBuilder } from '../data'
import { PrisonApiClient } from '../data/interfaces/prisonApiClient'
import { CaseLoad } from '../interfaces/caseLoad'
import CentralSessionClient from '../data/centralSessionClient'
import { UserPassport } from '../interfaces/userPassport'

interface UserDetails {
  name: string
  displayName: string
}

export default class UserService {
  constructor(
    private readonly hmppsAuthClientBuilder: RestClientBuilder<HmppsAuthClient>,
    private readonly prisonApiClientBuilder: RestClientBuilder<PrisonApiClient>,
    private readonly centralSessionClientBuilder: RestClientBuilder<CentralSessionClient>,
  ) {}

  async getUser(token: string): Promise<UserDetails> {
    const user = await this.hmppsAuthClientBuilder(token).getUser()
    return { ...user, displayName: convertToTitleCase(user.name) }
  }

  getUserCaseLoads(token: string): Promise<CaseLoad[]> {
    return this.prisonApiClientBuilder(token).getUserCaseLoads()
  }

  getCentralUserPassport(sid: string, serviceName: string, centralStorageToken = 'TODO'): Promise<UserPassport> {
    return this.centralSessionClientBuilder(centralStorageToken).getUserPassport(sid, serviceName)
  }
}
