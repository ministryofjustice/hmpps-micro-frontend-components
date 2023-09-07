import { convertToTitleCase } from '../utils/utils'
import type HmppsAuthClient from '../data/hmppsAuthClient'
import { RestClientBuilder } from '../data'
import { CaseLoad } from '../interfaces/caseLoad'
import PrisonApiClient from '../data/prisonApiClient'
import { TokenData } from '../@types/express'

interface UserDetails {
  name: string
  displayName: string
  roles: string[]
}

export default class UserService {
  constructor(
    private readonly hmppsAuthClientBuilder: RestClientBuilder<HmppsAuthClient>,
    private readonly prisonApiClientBuilder: RestClientBuilder<PrisonApiClient>,
  ) {}

  async getUser(token: string, tokenData?: TokenData): Promise<UserDetails> {
    if (!tokenData) {
      const user = await this.hmppsAuthClientBuilder(token).getUser()
      return { ...user, displayName: convertToTitleCase(user.name), roles: [] }
    }

    return {
      displayName: convertToTitleCase(tokenData.name),
      name: tokenData.name,
      roles: tokenData.authorities,
    }
  }

  getUserCaseLoads(token: string): Promise<CaseLoad[]> {
    return this.prisonApiClientBuilder(token).getUserCaseLoads()
  }
}
