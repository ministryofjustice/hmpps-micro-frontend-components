import jwtDecode from 'jwt-decode'
import { convertToTitleCase } from '../utils/utils'
import type HmppsAuthClient from '../data/hmppsAuthClient'
import { RestClientBuilder } from '../data'
import PrisonApiClient from '../data/prisonApiClient'
import logger from '../../logger'
import { AuthUser, TokenData } from '../@types/Users'
import { UserData } from '../interfaces/UserData'

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
  ) {}

  async getUser(token: string, tokenData?: TokenData): Promise<AuthUser | UserDetails> {
    if (!tokenData) {
      const user = await this.hmppsAuthClientBuilder(token).getUser()
      const { authorities } = jwtDecode(token) as { authorities?: string[] }
      return {
        ...user,
        displayName: convertToTitleCase(user.name),
        roles: authorities.map(role => role.substring(role.indexOf('_') + 1)),
      }
    }

    return {
      displayName: convertToTitleCase(tokenData.name),
      name: tokenData.name,
      roles: tokenData.authorities.map(role => role.substring(role.indexOf('_') + 1)),
    }
  }

  async getUserData(token: string, staffId: number): Promise<UserData> {
    const defaultResponse: UserData = { staffRoles: [], caseLoads: [], activeCaseLoad: null, locations: [] }

    try {
      if (this.errorCount >= API_ERROR_LIMIT) return defaultResponse

      const prisonApiClient = this.prisonApiClientBuilder(token)
      const [caseLoads, locations] = await Promise.all([
        prisonApiClient.getUserCaseLoads(),
        prisonApiClient.getUserLocations(),
      ])

      const activeCaseLoad = caseLoads.find(caseLoad => caseLoad.currentlyActive)
      const staffRoles = await prisonApiClient.getStaffRoles(activeCaseLoad.caseLoadId, staffId)

      this.errorCount = 0
      return { caseLoads, staffRoles, activeCaseLoad, locations }
    } catch (error) {
      this.errorCount += 1

      if (this.errorCount >= API_ERROR_LIMIT - 1) {
        logger.info('Prison API calls suspended')

        setTimeout(() => {
          logger.info('Prison API calls active')
          this.errorCount = 0
        }, API_COOL_OFF_MINUTES * 60000)
      }

      return defaultResponse
    }
  }
}
