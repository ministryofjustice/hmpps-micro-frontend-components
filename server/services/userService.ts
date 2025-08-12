import PrisonApiClient from '../data/prisonApiClient'
import logger from '../../logger'
import getServicesForUser from './utils/getServicesForUser'
import CacheService from './cacheService'
import { ServiceActiveAgencies } from '../@types/activeAgencies'
import config from '../config'
import { PrisonUser, PrisonUserAccess } from '../interfaces/hmppsUser'
import { Service } from '../interfaces/Service'
import { CaseLoad } from '../interfaces/caseLoad'
import AllocationsApiClient, { StaffAllocationPolicies } from '../data/AllocationsApiClient'

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
    private readonly prisonApiClient: PrisonApiClient,
    private readonly allocationsApiClient: AllocationsApiClient,
    private readonly cacheService: CacheService,
  ) {}

  async getPrisonUserAccess(user: PrisonUser): Promise<PrisonUserAccess> {
    if (this.errorCount >= API_ERROR_LIMIT) return DEFAULT_USER_ACCESS

    const cache: PrisonUserAccess = await this.getCache(user)
    if (cache?.caseLoads.length === 1) return cache

    try {
      const caseLoads = await this.prisonApiClient.getUserCaseLoads()
      const activeCaseLoad = caseLoads.find(caseLoad => caseLoad.currentlyActive)

      if (!caseLoads.length) return DEFAULT_USER_ACCESS
      if (
        cache &&
        this.activeCaseLoadHasNotChanged(activeCaseLoad, cache) &&
        this.caseLoadsHaveNotChanged(caseLoads, cache)
      ) {
        return cache
      }

      const services = await this.getServicesForUser(
        user,
        activeCaseLoad?.caseLoadId,
        this.prisonApiClient,
        this.allocationsApiClient,
      )
      const allocationPolicies = await this.getAllocationPolicies(
        user,
        activeCaseLoad?.caseLoadId,
        this.allocationsApiClient,
      )
      const userAccess: PrisonUserAccess = {
        caseLoads,
        activeCaseLoad,
        services,
        allocationJobResponsibilities: allocationPolicies.policies,
      }
      await this.setCache(user, userAccess)

      // successfully retrieved user access, reset error counter
      this.errorCount = 0

      return userAccess
    } catch (error) {
      this.handleError(error)
      return DEFAULT_USER_ACCESS
    }
  }

  private getCache(user: PrisonUser): Promise<PrisonUserAccess> {
    return this.cacheService.getData<PrisonUserAccess>(`${user.username}_meta_data`)
  }

  private async setCache(user: PrisonUser, access: PrisonUserAccess): Promise<string> {
    return (await this.cacheService.setData(`${user.username}_meta_data`, access))?.toString()
  }

  private activeCaseLoadHasNotChanged(activeCaseLoad: CaseLoad, cache: PrisonUserAccess): boolean {
    return cache?.activeCaseLoad?.caseLoadId === activeCaseLoad?.caseLoadId
  }

  private caseLoadsHaveNotChanged(caseLoads: CaseLoad[], cache: PrisonUserAccess): boolean {
    return (
      cache?.caseLoads
        ?.map(c => c.caseLoadId)
        .sort()
        .join(',') ===
      caseLoads
        ?.map(c => c.caseLoadId)
        .sort()
        .join(',')
    )
  }

  private async getServicesForUser(
    user: PrisonUser,
    caseLoadId: string,
    prisonApiClient: PrisonApiClient,
    allocationsApiClient: AllocationsApiClient,
  ): Promise<Service[]> {
    const [locations, isKeyworker, allocationPolicies] = await Promise.all([
      prisonApiClient.getUserLocations(),
      prisonApiClient.getIsKeyworker(caseLoadId, user.staffId),
      this.getAllocationPolicies(user, caseLoadId, allocationsApiClient),
    ])

    const activeServices = config.features.servicesStore.enabled
      ? await this.cacheService.getData<ServiceActiveAgencies[]>('applicationInfo')
      : null

    return getServicesForUser(
      user.userRoles,
      isKeyworker,
      allocationPolicies,
      caseLoadId ?? null,
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
