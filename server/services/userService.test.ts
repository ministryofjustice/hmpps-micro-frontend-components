import UserService, { API_COOL_OFF_MINUTES, API_ERROR_LIMIT, DEFAULT_USER_ACCESS } from './userService'
import { prisonApiClientMock } from '../../tests/mocks/prisonApiClientMock'
import { CaseLoad } from '../interfaces/caseLoad'
import PrisonApiClient from '../data/prisonApiClient'
import CacheService from './cacheService'
import { prisonUserMock, servicesMock } from '../../tests/mocks/hmppsUserMock'
import { PrisonUserAccess } from '../interfaces/hmppsUser'
import { Location } from '../interfaces/location'
import AllocationsApiClient, { StaffAllocationPolicies } from '../data/AllocationsApiClient'

const expectedCaseLoads: CaseLoad[] = [
  { caseloadFunction: '', caseLoadId: '1', currentlyActive: true, description: '', type: '' },
  { caseloadFunction: '', caseLoadId: '2', currentlyActive: false, description: '', type: '' },
]

const expectedUserAccess: PrisonUserAccess = {
  caseLoads: expectedCaseLoads,
  activeCaseLoad: expectedCaseLoads[0],
  services: servicesMock,
  allocationJobResponsibilities: [],
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
    const prisonApiClient = prisonApiClientMock() as undefined as PrisonApiClient
    const allocationsApiClient = { getStaffAllocationPolicies: jest.fn() } as unknown as AllocationsApiClient
    beforeEach(() => {
      prisonApiClient.getUserCaseLoads = jest.fn(async () => expectedCaseLoads)
      prisonApiClient.getUserLocations = jest.fn(async () => [] as Location[])
      prisonApiClient.getIsKeyworker = jest.fn(async () => true)
      allocationsApiClient.getStaffAllocationPolicies = jest.fn(
        async (_prisonCode: string, _staffId: number): Promise<StaffAllocationPolicies> => ({
          policies: [],
        }),
      )

      userService = new UserService(
        () => prisonApiClient,
        () => allocationsApiClient,
        cacheServiceMock,
      )
    })

    describe('with no cached data', () => {
      beforeEach(() => {
        cacheServiceMock.getData.mockResolvedValue(null)
      })

      it('Returns prison user access data', async () => {
        const userAccess = await userService.getPrisonUserAccess(prisonUserMock)

        expect(prisonApiClient.getUserCaseLoads).toBeCalledTimes(1)
        expect(prisonApiClient.getUserLocations).toBeCalledTimes(1)
        expect(prisonApiClient.getIsKeyworker).toBeCalledTimes(1)

        expect(userAccess).toEqual(expectedUserAccess)
      })

      it('Sets cache', async () => {
        await userService.getPrisonUserAccess(prisonUserMock)
        expect(cacheServiceMock.setData).toHaveBeenCalledWith('PRISON_USER_meta_data', expectedUserAccess)
      })

      it('Does not set cache if user has no case loads', async () => {
        prisonApiClient.getUserCaseLoads = jest.fn(async () => [] as CaseLoad[])

        const userAccess = await userService.getPrisonUserAccess(prisonUserMock)

        expect(prisonApiClient.getUserCaseLoads).toHaveBeenCalledTimes(1)
        expect(prisonApiClient.getUserLocations).not.toHaveBeenCalled()
        expect(prisonApiClient.getIsKeyworker).not.toHaveBeenCalled()
        expect(cacheServiceMock.setData).not.toHaveBeenCalled()

        expect(userAccess).toEqual(DEFAULT_USER_ACCESS)
      })

      it('Returns default access if api fails', async () => {
        prisonApiClient.getUserCaseLoads = jest.fn(async () => {
          throw new Error('API FAIL')
        })
        const userAccess = await userService.getPrisonUserAccess(prisonUserMock)
        expect(prisonApiClient.getUserCaseLoads).toBeCalledTimes(1)
        expect(userAccess).toEqual(DEFAULT_USER_ACCESS)
      })

      it(`Sets circuit breaker if api fails ${API_ERROR_LIMIT} times`, async () => {
        jest.useFakeTimers()
        prisonApiClient.getUserCaseLoads = jest.fn(() => {
          throw new Error('API FAIL')
        })
        await Promise.all([...Array(API_ERROR_LIMIT)].map(() => userService.getPrisonUserAccess(prisonUserMock)))

        const userAccess = await userService.getPrisonUserAccess(prisonUserMock)
        expect(prisonApiClient.getUserCaseLoads).toBeCalledTimes(API_ERROR_LIMIT)
        expect(userAccess).toEqual(DEFAULT_USER_ACCESS)

        jest.runAllTimers()
      })

      it(`Unsets circuit breaker after ${API_COOL_OFF_MINUTES} minutes`, async () => {
        jest.useFakeTimers()
        prisonApiClient.getUserCaseLoads = jest.fn(async () => {
          throw new Error('API FAIL')
        })
        await Promise.all([...Array(API_ERROR_LIMIT)].map(() => userService.getPrisonUserAccess(prisonUserMock)))

        jest.advanceTimersByTime(API_COOL_OFF_MINUTES * 60000)

        await userService.getPrisonUserAccess(prisonUserMock)
        expect(prisonApiClient.getUserCaseLoads).toBeCalledTimes(API_ERROR_LIMIT + 1)

        jest.useRealTimers()
      })
    })

    describe('with cached data', () => {
      it('returns cached data if number of caseloads is 1', async () => {
        const cachedData: PrisonUserAccess = {
          caseLoads: [{ caseloadFunction: '', caseLoadId: '123', currentlyActive: true, description: '', type: '' }],
          activeCaseLoad: { caseloadFunction: '', caseLoadId: '123', currentlyActive: true, description: '', type: '' },
          services: [],
          allocationJobResponsibilities: [],
        }

        cacheServiceMock.getData.mockResolvedValue(cachedData)

        const output = await userService.getPrisonUserAccess(prisonUserMock)
        expect(prisonApiClient.getUserCaseLoads).not.toHaveBeenCalled()
        expect(prisonApiClient.getUserLocations).not.toHaveBeenCalled()
        expect(prisonApiClient.getIsKeyworker).not.toHaveBeenCalled()
        expect(output).toEqual(cachedData)
      })

      it('returns cached data if active case load and case load list is unchanged', async () => {
        cacheServiceMock.getData.mockResolvedValue(expectedUserAccess)

        const output = await userService.getPrisonUserAccess(prisonUserMock)
        expect(prisonApiClient.getUserCaseLoads).toBeCalledTimes(1)
        expect(prisonApiClient.getUserLocations).toBeCalledTimes(0)
        expect(prisonApiClient.getIsKeyworker).toBeCalledTimes(0)
        expect(output).toEqual(expectedUserAccess)
      })

      it('gets new data if active caseload has changed', async () => {
        const cachedData: PrisonUserAccess = {
          caseLoads: [
            { ...expectedCaseLoads[0], currentlyActive: false },
            { ...expectedCaseLoads[1], currentlyActive: true },
          ],
          activeCaseLoad: { ...expectedCaseLoads[1], currentlyActive: true },
          services: [],
          allocationJobResponsibilities: [],
        }

        cacheServiceMock.getData.mockResolvedValue(cachedData)

        const output = await userService.getPrisonUserAccess(prisonUserMock)

        expect(prisonApiClient.getUserCaseLoads).toBeCalledTimes(1)
        expect(prisonApiClient.getUserLocations).toBeCalledTimes(1)
        expect(prisonApiClient.getIsKeyworker).toBeCalledTimes(1)

        expect(output).toEqual(expectedUserAccess)
      })

      it('gets new data if list of caseloads has changed', async () => {
        const cachedData: PrisonUserAccess = {
          caseLoads: [
            expectedCaseLoads[0],
            expectedCaseLoads[1],
            { caseloadFunction: '', caseLoadId: '3', currentlyActive: false, description: '', type: '' },
          ],
          activeCaseLoad: expectedUserAccess.activeCaseLoad,
          services: [],
          allocationJobResponsibilities: [],
        }

        cacheServiceMock.getData.mockResolvedValue(cachedData)

        const output = await userService.getPrisonUserAccess(prisonUserMock)

        expect(prisonApiClient.getUserCaseLoads).toBeCalledTimes(1)
        expect(prisonApiClient.getUserLocations).toBeCalledTimes(1)
        expect(prisonApiClient.getIsKeyworker).toBeCalledTimes(1)

        expect(output).toEqual(expectedUserAccess)
      })
    })
  })
})
