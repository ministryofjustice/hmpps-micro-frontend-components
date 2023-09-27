import { convertToTitleCase } from '../utils/utils'
import type HmppsAuthClient from '../data/hmppsAuthClient'
import { RestClientBuilder } from '../data'
import { CaseLoad } from '../interfaces/caseLoad'
import PrisonApiClient from '../data/prisonApiClient'
import { RedisClient } from '../data/redisClient'
import logger from '../../logger'
import { AuthUser, TokenData } from '../@types/Users'

interface UserDetails {
  name: string
  displayName: string
  roles: string[]
}

export default class UserService {
  constructor(
    private readonly hmppsAuthClientBuilder: RestClientBuilder<HmppsAuthClient>,
    private readonly prisonApiClientBuilder: RestClientBuilder<PrisonApiClient>,
    private readonly redisClient: RedisClient,
  ) {}

  async getUser(token: string, tokenData?: TokenData): Promise<AuthUser | UserDetails> {
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

  private async ensureConnected() {
    if (!this.redisClient.isOpen) {
      await this.redisClient.connect()
    }
  }

  async getUserCaseLoads(token: string, username: string): Promise<CaseLoad[]> {
    try {
      await this.ensureConnected()
      const redisData = await this.redisClient.get(username)
      if (redisData) {
        return JSON.parse(redisData).caseLoads as CaseLoad[]
      }

      const caseLoads = await this.prisonApiClientBuilder(token).getUserCaseLoads()
      if (caseLoads.length <= 1) {
        await this.redisClient.set(username, JSON.stringify({ caseLoads }), { EX: 300 })
      }
      return caseLoads
    } catch (error) {
      logger.error(error.stack, `Error calling redis`)
      return this.prisonApiClientBuilder(token).getUserCaseLoads()
    }
  }
}
