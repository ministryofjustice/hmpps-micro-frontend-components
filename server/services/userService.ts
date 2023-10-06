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

export const API_COOL_OFF_MINUTES = 5
export const API_ERROR_LIMIT = 100

export default class UserService {
  private errorCount = 0

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

  private async getCaseLoadsFromCache(username: string): Promise<CaseLoad[] | null> {
    try {
      await this.ensureConnected()
      const redisData = await this.redisClient.get(username)
      if (!redisData) return null

      return JSON.parse(redisData).caseLoads as CaseLoad[]
    } catch (error) {
      logger.error(error.stack, `Error calling redis`)
      return null
    }
  }

  private async setCaseLoadsCache(username: string, caseLoads: CaseLoad[]): Promise<string> {
    try {
      await this.ensureConnected()
      return await this.redisClient.set(username, JSON.stringify({ caseLoads }), { EX: 300 })
    } catch (error) {
      logger.error(error.stack, `Error calling redis`)
      return ''
    }
  }

  async getUserCaseLoads(token: string, username: string): Promise<CaseLoad[]> {
    try {
      const cachedCaseLoads = await this.getCaseLoadsFromCache(username)
      if (cachedCaseLoads) return cachedCaseLoads

      if (this.errorCount >= API_ERROR_LIMIT) return []

      const caseLoads = await this.prisonApiClientBuilder(token).getUserCaseLoads()
      if (caseLoads.length <= 1) await this.setCaseLoadsCache(username, caseLoads)

      this.errorCount = 0
      return caseLoads
    } catch (error) {
      this.errorCount += 1

      if (this.errorCount >= API_ERROR_LIMIT - 1) {
        logger.info('Prison API calls suspended')

        setTimeout(() => {
          logger.info('Prison API calls active')
          this.errorCount = 0
        }, API_COOL_OFF_MINUTES * 60000)
      }

      return []
    }
  }
}
