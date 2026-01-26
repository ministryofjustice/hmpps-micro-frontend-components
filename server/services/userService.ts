import logger from '../../logger'
import getServicesForUser from './utils/getServicesForUser'
import CacheService from './cacheService'
import { ServiceActiveAgencies } from '../@types/activeAgencies'
import config from '../config'
import { PrisonUser, PrisonUserAccess } from '../interfaces/hmppsUser'
import { Service } from '../interfaces/Service'
import { PrisonCaseload } from '../interfaces/caseLoad'
import AllocationsApiClient, { StaffAllocationPolicies } from '../data/AllocationsApiClient'
import { Role } from './utils/roles'
import LocationsInsidePrisonApiClient from '../data/locationsInsidePrisonApiClient'
import ManageUsersApiClient from '../data/manageUsersApiClient'

export type UserAccessCache = PrisonUserAccess & { userRoles?: string[] }

export const API_COOL_OFF_MINUTES = 5
export const API_ERROR_LIMIT = 100
export const DEFAULT_USER_ACCESS: PrisonUserAccess = {
  caseLoads: [],
  activeCaseLoad: null,
  services: [],
  allocationJobResponsibilities: [],
}

export default class UserService {
  private errorCount = 0

  constructor(
    private readonly allocationsApiClient: AllocationsApiClient,
    private readonly cacheService: CacheService,
    private readonly locationsInsidePrisonApiClient: LocationsInsidePrisonApiClient,
    private readonly manageUsersApiClient: ManageUsersApiClient,
  ) {}

  async getPrisonUserAccess(user: PrisonUser): Promise<PrisonUserAccess> {
    if (this.errorCount >= API_ERROR_LIMIT) return DEFAULT_USER_ACCESS

    const cache: UserAccessCache = await this.getCache(user)
    const { userRoles, ...cachedResponse } = cache || ({} as UserAccessCache)

    if (cache?.caseLoads.length === 1 && this.rolesHaveNotChanged(user.userRoles, cache)) return cachedResponse

    try {
      const userCaseloadDetail = await this.manageUsersApiClient.getUserCaseLoads(user.username)
      if (!userCaseloadDetail.activeCaseload) {
        const potentialCaseLoad = userCaseloadDetail.caseloads.find(cl => cl.id !== '___')

        // if there's no potential caseload we should return the default access
        if (!potentialCaseLoad) return DEFAULT_USER_ACCESS

        userCaseloadDetail.activeCaseload = potentialCaseLoad
      }

      const activeCaseLoad = userCaseloadDetail.activeCaseload
      const caseLoads = userCaseloadDetail.caseloads

      if (!userCaseloadDetail.caseloads.length) return DEFAULT_USER_ACCESS
      if (
        cache &&
        this.activeCaseLoadHasNotChanged(activeCaseLoad, cache) &&
        this.caseLoadsHaveNotChanged(caseLoads, cache) &&
        this.rolesHaveNotChanged(user.userRoles, cache)
      ) {
        return cachedResponse
      }

      const services = await this.getServicesForUser(
        user,
        activeCaseLoad,
        this.locationsInsidePrisonApiClient,
        this.allocationsApiClient,
      )

      const allocationPolicies = await this.getAllocationPolicies(user, activeCaseLoad?.id, this.allocationsApiClient)

      const userAccess: PrisonUserAccess = {
        caseLoads,
        activeCaseLoad,
        services,
        allocationJobResponsibilities: allocationPolicies.policies,
      }

      await this.setCache(user, { ...userAccess, userRoles: user.userRoles })

      // successfully retrieved user access, reset error counter
      this.errorCount = 0

      return userAccess
    } catch (error) {
      this.handleError(error)
      return DEFAULT_USER_ACCESS
    }
  }

  private getCache(user: PrisonUser): Promise<UserAccessCache> {
    return this.cacheService.getData<UserAccessCache>(`${user.username}_meta_data`)
  }

  private async setCache(user: PrisonUser, access: UserAccessCache): Promise<string> {
    return (await this.cacheService.setData(`${user.username}_meta_data`, access))?.toString()
  }

  private activeCaseLoadHasNotChanged(activeCaseLoad: PrisonCaseload, cache: PrisonUserAccess): boolean {
    return cache?.activeCaseLoad?.id === activeCaseLoad?.id
  }

  private caseLoadsHaveNotChanged(caseLoads: PrisonCaseload[], cache: PrisonUserAccess): boolean {
    return (
      cache?.caseLoads
        ?.map(c => c.id)
        .sort()
        .join(',') ===
      caseLoads
        ?.map(c => c.id)
        .sort()
        .join(',')
    )
  }

  private rolesHaveNotChanged(userRoles: Role[], cache: UserAccessCache): boolean {
    // Prevent Prison API traffic spike upon initial deployment:
    if (!cache?.userRoles) return true

    return cache?.userRoles?.sort()?.join(',') === userRoles?.sort()?.join(',')
  }

  private async getServicesForUser(
    user: PrisonUser,
    activeCaseLoad: PrisonCaseload,
    locationsInsidePrisonApiClient: LocationsInsidePrisonApiClient,
    allocationsApiClient: AllocationsApiClient,
  ): Promise<Service[]> {
    const [locations, allocationPolicies] = await Promise.all([
      locationsInsidePrisonApiClient.getUserLocations(activeCaseLoad),
      this.getAllocationPolicies(user, activeCaseLoad.id, allocationsApiClient),
    ])

    const activeServices = config.features.servicesStore.enabled
      ? await this.cacheService.getData<ServiceActiveAgencies[]>('applicationInfo')
      : null

    return getServicesForUser(
      user.userRoles,
      allocationPolicies,
      activeCaseLoad.id ?? null,
      user.staffId,
      locations,
      activeServices,
    )
  }

  private async getAllocationPolicies(
    user: PrisonUser,
    caseLoadId: string,
    allocationsApiClient: AllocationsApiClient,
  ) {
    const allocationCacheKey = `${user.username}_${caseLoadId}_allocation`
    let allocation = await this.cacheService.getData<StaffAllocationPolicies>(allocationCacheKey)
    if (!allocation?.policies) {
      allocation = await allocationsApiClient.getStaffAllocationPolicies(caseLoadId, user.staffId)
      await this.cacheService.setData(allocationCacheKey, allocation)
    }
    return allocation
  }

  private handleError(error: Error) {
    logger.error(error)

    this.errorCount += 1

    if (this.errorCount >= API_ERROR_LIMIT - 1) {
      logger.info('Prison API calls suspended')

      setTimeout(() => {
        logger.info('Prison API calls active')
        this.errorCount = 0
      }, API_COOL_OFF_MINUTES * 60000)
    }
  }
}
