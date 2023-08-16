import { convertToTitleCase } from '../utils/utils'
import type HmppsAuthClient from '../data/hmppsAuthClient'
import { RestClientBuilder } from '../data'
import { CaseLoad } from '../interfaces/caseLoad'
import PrisonApiClient from '../data/prisonApiClient'

interface UserDetails {
  name: string
  displayName: string
}

export default class UserService {
  constructor(
    private readonly hmppsAuthClientBuilder: RestClientBuilder<HmppsAuthClient>,
    private readonly prisonApiClientBuilder: RestClientBuilder<PrisonApiClient>,
  ) {}

  async getUser(token: string): Promise<UserDetails> {
    const user = await this.hmppsAuthClientBuilder(token).getUser()
    return { ...user, displayName: convertToTitleCase(user.name) }
  }

  getUserCaseLoads(token: string): Promise<CaseLoad[]> {
    return this.prisonApiClientBuilder(token).getUserCaseLoads()
  }
}
