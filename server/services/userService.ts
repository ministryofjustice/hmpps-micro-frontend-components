import { jwtDecode } from 'jwt-decode'
import { convertToTitleCase } from '../utils/utils'
import type HmppsAuthClient from '../data/hmppsAuthClient'
import { RestClientBuilder } from '../data'
import PrisonApiClient from '../data/prisonApiClient'
import logger from '../../logger'
import { AuthUser, isApiUser, TokenData, User } from '../@types/Users'
import { UserData } from '../interfaces/UserData'
import getServicesForUser from './utils/getServicesForUser'
import { isPrisonUser } from '../controllers/componentsController'
import CacheService from './cacheService'
import { ServiceActiveAgencies } from '../@types/activeAgencies'
import config from '../config'

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
    private readonly cacheService: CacheService,
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

  async getUserData(user: User, cachedData?: UserData): Promise<UserData> {
    if (cachedData?.caseLoads.length === 1) return cachedData

    const apiUser = isApiUser(user)
    const { token, roles } = user
    const staffId = apiUser ? Number(user.user_id) : user.staffId
    const prisonUser = isPrisonUser(user)

    const defaultResponse: UserData = {
      caseLoads: [],
      activeCaseLoad: null,
      services: [],
    }

    try {
      if (!prisonUser || this.errorCount >= API_ERROR_LIMIT) return defaultResponse

      const prisonApiClient = this.prisonApiClientBuilder(token)
      const caseLoads = await prisonApiClient.getUserCaseLoads()
      const activeCaseLoad = caseLoads.find(caseLoad => caseLoad.currentlyActive)

      // return cached data if active caseload has not changed
      if (cachedData?.activeCaseLoad.caseLoadId === activeCaseLoad.caseLoadId) return cachedData

      const [locations, isKeyworker] = await Promise.all([
        prisonApiClient.getUserLocations(),
        prisonApiClient.getIsKeyworker(activeCaseLoad.caseLoadId, staffId),
      ])

      const activeServices = config.features.servicesStore.enabled
        ? await this.cacheService.getData<ServiceActiveAgencies[]>('applicationInfo')
        : null

      const services = getServicesForUser(
        roles,
        isKeyworker,
        activeCaseLoad?.caseLoadId ?? null,
        staffId,
        locations,
        activeServices,
      )

      this.errorCount = 0
      return { caseLoads, activeCaseLoad, services }
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
