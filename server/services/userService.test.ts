import UserService, { API_COOL_OFF_MINUTES, API_ERROR_LIMIT, DEFAULT_USER_ACCESS, UserAccessCache } from './userService'
import { PrisonCaseload, UserCaseloadDetail } from '../interfaces/caseLoad'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import CacheService from './cacheService'
import { prisonUserMock, servicesMock } from '../../tests/mocks/hmppsUserMock'
import { PrisonUserAccess } from '../interfaces/hmppsUser'
import { PrisonHierarchyDto } from '../interfaces/location'
import AllocationsApiClient from '../data/AllocationsApiClient'
import { Role } from './utils/roles'
import LocationsInsidePrisonApiClient from '../data/locationsInsidePrisonApiClient'

const expectedCaseLoads: PrisonCaseload[] = [
  { function: 'ADMIN', id: 'ADM_TEST', name: 'An Admin Caseload' },
  { function: 'GENERAL', id: 'GEN_TEST', name: 'A General Caseload' },
]

const expectedUserAccess: PrisonUserAccess = {
  caseLoads: expectedCaseLoads,
  activeCaseLoad: expectedCaseLoads[0],
  services: servicesMock,
  allocationJobResponsibilities: ['KEY_WORKER'],
}

const cacheServiceMock = {
  getData: jest.fn(),
  setData: jest.fn(),
} as undefined as jest.Mocked<CacheService>

afterEach(() => {
  jest.resetAllMocks()
})

describe('User service', () => {
  let userService: UserService

  describe('getPrisonUserAccess', () => {
    let allocationsApiClient: AllocationsApiClient
    let locationsInsidePrisonApiClient: LocationsInsidePrisonApiClient
    let manageUsersApiClient: ManageUsersApiClient

    beforeEach(() => {
      allocationsApiClient = {
        getStaffAllocationPolicies: jest.fn().mockResolvedValue({ policies: ['KEY_WORKER'] }),
      } as unknown as AllocationsApiClient
      locationsInsidePrisonApiClient = {
        getUserLocations: jest.fn().mockResolvedValue([] as PrisonHierarchyDto[]),
      } as unknown as LocationsInsidePrisonApiClient

      manageUsersApiClient = {
        getUserCaseLoads: jest
          .fn()
          .mockResolvedValue({ activeCaseload: expectedCaseLoads[0], caseloads: expectedCaseLoads }),
      } as unknown as ManageUsersApiClient

      userService = new UserService(
        allocationsApiClient,
        cacheServiceMock,
        locationsInsidePrisonApiClient,
        manageUsersApiClient,
      )
    })

    describe('with no cached data', () => {
      beforeEach(() => {
        cacheServiceMock.getData.mockResolvedValue(null)
      })

      it('Returns prison user access data', async () => {
        const userAccess = await userService.getPrisonUserAccess(prisonUserMock)

        expect(manageUsersApiClient.getUserCaseLoads).toHaveBeenCalledTimes(1)
        expect(locationsInsidePrisonApiClient.getUserLocations).toHaveBeenCalledTimes(1)

        expect(userAccess).toEqual(expectedUserAccess)
      })

      it('Sets cache', async () => {
        await userService.getPrisonUserAccess(prisonUserMock)
        expect(cacheServiceMock.setData).toHaveBeenCalledWith('PRISON_USER_meta_data', {
          ...expectedUserAccess,
          userRoles: prisonUserMock.userRoles,
        })
      })

      it('Does not set cache if user has no case loads', async () => {
        manageUsersApiClient.getUserCaseLoads = jest.fn(async () => ({ caseloads: [] }) as UserCaseloadDetail)

        const userAccess = await userService.getPrisonUserAccess(prisonUserMock)

        expect(manageUsersApiClient.getUserCaseLoads).toHaveBeenCalledTimes(1)
        expect(locationsInsidePrisonApiClient.getUserLocations).not.toHaveBeenCalled()
        expect(cacheServiceMock.setData).not.toHaveBeenCalled()

        expect(userAccess).toEqual(DEFAULT_USER_ACCESS)
      })

      it('Returns default access if api fails', async () => {
        manageUsersApiClient.getUserCaseLoads = jest.fn(async () => {
          throw new Error('API FAIL')
        })
        const userAccess = await userService.getPrisonUserAccess(prisonUserMock)
        expect(manageUsersApiClient.getUserCaseLoads).toHaveBeenCalledTimes(1)
        expect(userAccess).toEqual(DEFAULT_USER_ACCESS)
      })

      it(`Sets circuit breaker if api fails ${API_ERROR_LIMIT} times`, async () => {
        jest.useFakeTimers()
        manageUsersApiClient.getUserCaseLoads = jest.fn(() => {
          throw new Error('API FAIL')
        })
        await Promise.all([...Array(API_ERROR_LIMIT)].map(() => userService.getPrisonUserAccess(prisonUserMock)))

        const userAccess = await userService.getPrisonUserAccess(prisonUserMock)
        expect(manageUsersApiClient.getUserCaseLoads).toHaveBeenCalledTimes(API_ERROR_LIMIT)
        expect(userAccess).toEqual(DEFAULT_USER_ACCESS)

        jest.runAllTimers()
      })

      it(`Unsets circuit breaker after ${API_COOL_OFF_MINUTES} minutes`, async () => {
        jest.useFakeTimers()
        manageUsersApiClient.getUserCaseLoads = jest.fn(async () => {
          throw new Error('API FAIL')
        })
        await Promise.all([...Array(API_ERROR_LIMIT)].map(() => userService.getPrisonUserAccess(prisonUserMock)))

        jest.advanceTimersByTime(API_COOL_OFF_MINUTES * 60000)

        await userService.getPrisonUserAccess(prisonUserMock)
        expect(manageUsersApiClient.getUserCaseLoads).toHaveBeenCalledTimes(API_ERROR_LIMIT + 1)

        jest.useRealTimers()
      })

      it('Handles the API returning a user with no active caseload', async () => {
        manageUsersApiClient.getUserCaseLoads = jest.fn(
          async () =>
            ({
              activeCaseload: undefined,
              caseloads: expectedCaseLoads,
            }) as UserCaseloadDetail,
        )

        const res = await userService.getPrisonUserAccess(prisonUserMock)

        expect(res.activeCaseLoad).toEqual(expectedCaseLoads[0])
      })

      it('Handles the API returning a user with no active caseload and no potential caseload', async () => {
        manageUsersApiClient.getUserCaseLoads = jest.fn(
          async () =>
            ({
              activeCaseload: undefined,
              caseloads: [{ function: 'ADMIN', id: '___', name: 'An invalid caseload' }],
            }) as UserCaseloadDetail,
        )

        const res = await userService.getPrisonUserAccess(prisonUserMock)

        expect(res).toEqual(DEFAULT_USER_ACCESS)
      })
    })

    describe('with cached allocation data', () => {
      it('uses cached allocation job responsibilities', async () => {
        cacheServiceMock.getData.mockImplementation(async key => {
          if (key.endsWith('_allocation')) {
            return { policies: ['PERSONAL_OFFICER'] }
          }
          return null
        })

        const userAccess = await userService.getPrisonUserAccess(prisonUserMock)
        expect(allocationsApiClient.getStaffAllocationPolicies).toHaveBeenCalledTimes(0)
        expect(userAccess.allocationJobResponsibilities).toStrictEqual(['PERSONAL_OFFICER'])
      })
    })

    describe('with cached data', () => {
      it('returns cached data if number of caseloads is 1 and roles have not changed', async () => {
        const cachedResponse: PrisonUserAccess = {
          ...expectedUserAccess,
          caseLoads: [expectedCaseLoads[0]],
          activeCaseLoad: expectedCaseLoads[0],
        }

        cacheServiceMock.getData.mockResolvedValue({ ...cachedResponse, userRoles: prisonUserMock.userRoles })

        const output = await userService.getPrisonUserAccess(prisonUserMock)
        expect(manageUsersApiClient.getUserCaseLoads).not.toHaveBeenCalled()
        expect(locationsInsidePrisonApiClient.getUserLocations).not.toHaveBeenCalled()
        expect(output).toEqual(cachedResponse)
      })

      it('gets new data if number of caseloads is 1 but roles have changed', async () => {
        const cachedData: UserAccessCache = {
          ...expectedUserAccess,
          userRoles: [],
          caseLoads: [expectedCaseLoads[0]],
          activeCaseLoad: expectedCaseLoads[0],
        }

        cacheServiceMock.getData.mockResolvedValue(cachedData)

        const output = await userService.getPrisonUserAccess(prisonUserMock)

        expect(manageUsersApiClient.getUserCaseLoads).toHaveBeenCalledTimes(1)
        expect(locationsInsidePrisonApiClient.getUserLocations).toHaveBeenCalledTimes(1)

        expect(output).toEqual(expectedUserAccess)
      })

      it('returns cached data if active case load and case load list is unchanged', async () => {
        cacheServiceMock.getData.mockResolvedValue({ ...expectedUserAccess, userRoles: prisonUserMock.userRoles })

        const output = await userService.getPrisonUserAccess(prisonUserMock)
        expect(manageUsersApiClient.getUserCaseLoads).toHaveBeenCalledTimes(1)
        expect(locationsInsidePrisonApiClient.getUserLocations).toHaveBeenCalledTimes(0)
        expect(output).toEqual(expectedUserAccess)
      })

      it('gets new data if active caseload has changed', async () => {
        const cachedData: UserAccessCache = {
          userRoles: [Role.PathfinderStdPrison],
          caseLoads: expectedCaseLoads,
          activeCaseLoad: expectedCaseLoads[1],
          services: [],
          allocationJobResponsibilities: [],
        }

        cacheServiceMock.getData.mockResolvedValue(cachedData)

        const output = await userService.getPrisonUserAccess(prisonUserMock)

        expect(manageUsersApiClient.getUserCaseLoads).toHaveBeenCalledTimes(1)
        expect(locationsInsidePrisonApiClient.getUserLocations).toHaveBeenCalledTimes(1)

        expect(output).toEqual(expectedUserAccess)
      })

      it('gets new data if list of caseloads has changed', async () => {
        const cachedData: UserAccessCache = {
          userRoles: [Role.PathfinderStdPrison],
          caseLoads: [expectedCaseLoads[0], expectedCaseLoads[1], { function: 'GENERAL', id: '3', name: '3' }],
          activeCaseLoad: expectedUserAccess.activeCaseLoad,
          services: [],
          allocationJobResponsibilities: [],
        }

        cacheServiceMock.getData.mockResolvedValue(cachedData)

        const output = await userService.getPrisonUserAccess(prisonUserMock)

        expect(manageUsersApiClient.getUserCaseLoads).toHaveBeenCalledTimes(1)
        expect(locationsInsidePrisonApiClient.getUserLocations).toHaveBeenCalledTimes(1)

        expect(output).toEqual(expectedUserAccess)
      })

      it('gets new data if roles have changed', async () => {
        const cachedData: UserAccessCache = { ...expectedUserAccess, userRoles: [] }

        cacheServiceMock.getData.mockResolvedValue(cachedData)

        const output = await userService.getPrisonUserAccess(prisonUserMock)

        expect(manageUsersApiClient.getUserCaseLoads).toHaveBeenCalledTimes(1)
        expect(locationsInsidePrisonApiClient.getUserLocations).toHaveBeenCalledTimes(1)

        expect(output).toEqual(expectedUserAccess)
      })

      it('handles cache with no user roles data', async () => {
        const cachedData: UserAccessCache = {
          ...expectedUserAccess,
        }

        cacheServiceMock.getData.mockResolvedValue(cachedData)

        const output = await userService.getPrisonUserAccess(prisonUserMock)

        expect(manageUsersApiClient.getUserCaseLoads).toHaveBeenCalledTimes(1)
        expect(locationsInsidePrisonApiClient.getUserLocations).toHaveBeenCalledTimes(0)

        expect(output).toEqual(expectedUserAccess)
      })
    })
  })
})
