import UserService, { API_COOL_OFF_MINUTES, API_ERROR_LIMIT } from './userService'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { prisonApiClientMock } from '../../tests/mocks/prisonApiClientMock'
import { CaseLoad } from '../interfaces/caseLoad'
import PrisonApiClient from '../data/prisonApiClient'
import { getTokenDataMock } from '../../tests/mocks/TokenDataMock'
import authUserMock from '../../tests/mocks/AuthUserMock'
import TokenMock, { rolesForMockToken } from '../../tests/mocks/TokenMock'
import CacheService from './cacheService'
import { User } from '../@types/Users'
import { UserData } from '../interfaces/UserData'

jest.mock('../data/hmppsAuthClient')

const token = TokenMock
const defaultTokenData = getTokenDataMock()

const cacheServiceMock = {
  getData: jest.fn(),
  setData: jest.fn(),
} as undefined as jest.Mocked<CacheService>

afterEach(() => {
  jest.resetAllMocks()
})
describe('User service', () => {
  let hmppsAuthClient: jest.Mocked<HmppsAuthClient>
  let userService: UserService
  let expectedCaseLoads: CaseLoad[]

  describe('getUser', () => {
    beforeEach(() => {
      hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
      hmppsAuthClient.getUser.mockResolvedValue({ ...authUserMock, name: 'john smith' })

      const prisonApiClient = prisonApiClientMock() as undefined as PrisonApiClient
      expectedCaseLoads = [{ caseloadFunction: '', caseLoadId: '1', currentlyActive: true, description: '', type: '' }]
      prisonApiClient.getUserCaseLoads = jest.fn(async () => expectedCaseLoads)

      userService = new UserService(
        () => hmppsAuthClient,
        () => prisonApiClient,
        cacheServiceMock,
      )
    })

    describe('with no token data', () => {
      it('Retrieves and formats user name', async () => {
        const result = await userService.getUser(token)
        expect(hmppsAuthClient.getUser).toBeCalledTimes(1)
        expect(result.displayName).toEqual('John Smith')
      })

      it('Formats the roles from the token', async () => {
        const result = await userService.getUser(token)
        expect(hmppsAuthClient.getUser).toBeCalledTimes(1)
        expect(result.roles).toEqual(rolesForMockToken)
      })
    })

    describe('with token data', () => {
      it('Retrieves and formats user name', async () => {
        const result = await userService.getUser(token, getTokenDataMock())
        expect(hmppsAuthClient.getUser).toBeCalledTimes(0)
        expect(result).toEqual({ displayName: 'Token User', name: 'Token User', roles: ['PF_STD_PRISON'] })
      })
    })

    it('Propagates error', async () => {
      hmppsAuthClient.getUser.mockRejectedValue(new Error('some error'))

      await expect(userService.getUser(token)).rejects.toEqual(new Error('some error'))
    })
  })

  describe('getUserData', () => {
    const prisonApiClient = prisonApiClientMock() as undefined as PrisonApiClient
    beforeEach(() => {
      hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
      hmppsAuthClient.getUser.mockResolvedValue({ ...authUserMock, name: 'john smith' })

      expectedCaseLoads = [{ caseloadFunction: '', caseLoadId: '1', currentlyActive: true, description: '', type: '' }]
      prisonApiClient.getUserCaseLoads = jest.fn(async () => expectedCaseLoads)
      prisonApiClient.getUserLocations = jest.fn(async () => [])
      prisonApiClient.getIsKeyworker = jest.fn(async () => true)

      userService = new UserService(
        () => hmppsAuthClient,
        () => prisonApiClient,
        cacheServiceMock,
      )
    })

    describe('with no cached data', () => {
      it('Returns case loads', async () => {
        const { caseLoads } = await userService.getUserData({
          ...defaultTokenData,
          authSource: 'nomis',
          token: TokenMock,
          user_id: '12345',
          roles: rolesForMockToken,
        })
        expect(prisonApiClient.getUserCaseLoads).toBeCalledTimes(1)
        expect(caseLoads).toEqual(expectedCaseLoads)
      })

      it('Returns active caseload id', async () => {
        const { activeCaseLoad } = await userService.getUserData({
          ...defaultTokenData,
          authSource: 'nomis',
          token: TokenMock,
          user_id: '12345',
          roles: rolesForMockToken,
        })
        expect(prisonApiClient.getUserCaseLoads).toBeCalledTimes(1)
        expect(activeCaseLoad).toEqual(expectedCaseLoads[0])
      })

      it('Returns services', async () => {
        const { services } = await userService.getUserData({
          ...defaultTokenData,
          authSource: 'nomis',
          token: TokenMock,
          user_id: '12345',
          roles: ['GLOBAL_SEARCH'],
        })
        expect(prisonApiClient.getUserCaseLoads).toBeCalledTimes(1)
        expect(services.find(service => service.heading === 'Global search')).toBeTruthy()
      })

      it('Returns empty list if api fails', async () => {
        prisonApiClient.getUserCaseLoads = jest.fn(async () => {
          throw new Error('API FAIL')
        })
        const { caseLoads } = await userService.getUserData({
          ...defaultTokenData,
          authSource: 'nomis',
          token: TokenMock,
          user_id: '12345',
          roles: rolesForMockToken,
        })
        expect(prisonApiClient.getUserCaseLoads).toBeCalledTimes(1)
        expect(caseLoads).toEqual([])
      })

      it(`Sets circuit breaker if api fails ${API_ERROR_LIMIT} times`, async () => {
        jest.useFakeTimers()
        prisonApiClient.getUserCaseLoads = jest.fn(() => {
          throw new Error('API FAIL')
        })
        await Promise.all(
          [...Array(API_ERROR_LIMIT)].map(() =>
            userService.getUserData({
              ...defaultTokenData,
              authSource: 'nomis',
              token: TokenMock,
              user_id: '12345',
              roles: rolesForMockToken,
            }),
          ),
        )

        const { caseLoads } = await userService.getUserData({
          ...defaultTokenData,
          authSource: 'nomis',
          token: TokenMock,
          user_id: '12345',
          roles: rolesForMockToken,
        })
        expect(prisonApiClient.getUserCaseLoads).toBeCalledTimes(API_ERROR_LIMIT)
        expect(caseLoads).toEqual([])

        jest.runAllTimers()
      })

      it(`Unsets circuit breaker after ${API_COOL_OFF_MINUTES} minutes`, async () => {
        jest.useFakeTimers()
        prisonApiClient.getUserCaseLoads = jest.fn(async () => {
          throw new Error('API FAIL')
        })
        await Promise.all(
          [...Array(API_ERROR_LIMIT)].map(() =>
            userService.getUserData({
              ...defaultTokenData,
              authSource: 'nomis',
              token: TokenMock,
              user_id: '12345',
              roles: rolesForMockToken,
            }),
          ),
        )

        jest.advanceTimersByTime(API_COOL_OFF_MINUTES * 60000)

        await userService.getUserData({
          ...defaultTokenData,
          authSource: 'nomis',
          token: TokenMock,
          user_id: '12345',
          roles: rolesForMockToken,
        })
        expect(prisonApiClient.getUserCaseLoads).toBeCalledTimes(API_ERROR_LIMIT + 1)

        jest.useRealTimers()
      })
    })

    describe('with cached data', () => {
      const defaultUser: User = {
        ...defaultTokenData,
        authSource: 'nomis',
        token: TokenMock,
        user_id: '12345',
        roles: rolesForMockToken,
      }
      it('returns cached data if number of caseloads is 1', async () => {
        const cachedData: UserData = {
          caseLoads: [{ caseloadFunction: '', caseLoadId: '1', currentlyActive: true, description: '', type: '' }],
          activeCaseLoad: { caseloadFunction: '', caseLoadId: '1', currentlyActive: true, description: '', type: '' },
          services: [],
        }
        const output = await userService.getUserData(defaultUser, cachedData)
        expect(prisonApiClient.getUserCaseLoads).toBeCalledTimes(0)
        expect(prisonApiClient.getUserLocations).toBeCalledTimes(0)
        expect(prisonApiClient.getIsKeyworker).toBeCalledTimes(0)
        expect(output).toEqual(cachedData)
      })

      it('returns cached data if number of active caseload is unchanged', async () => {
        const cachedData: UserData = {
          caseLoads: [
            expectedCaseLoads[0],
            { caseloadFunction: '', caseLoadId: '2', currentlyActive: true, description: '', type: '' },
          ],
          activeCaseLoad: expectedCaseLoads[0],
          services: [],
        }
        const output = await userService.getUserData(defaultUser, cachedData)
        expect(prisonApiClient.getUserCaseLoads).toBeCalledTimes(1)
        expect(prisonApiClient.getUserLocations).toBeCalledTimes(0)
        expect(prisonApiClient.getIsKeyworker).toBeCalledTimes(0)
        expect(output).toEqual(cachedData)
      })

      it('gets new data if active caseload has changed', async () => {
        const cachedData: UserData = {
          caseLoads: [
            expectedCaseLoads[0],
            { caseloadFunction: '', caseLoadId: '2', currentlyActive: true, description: '', type: '' },
          ],
          activeCaseLoad: { caseloadFunction: '', caseLoadId: '2', currentlyActive: true, description: '', type: '' },
          services: [],
        }
        const output = await userService.getUserData(defaultUser, cachedData)
        expect(prisonApiClient.getUserCaseLoads).toBeCalledTimes(1)
        expect(prisonApiClient.getUserLocations).toBeCalledTimes(1)
        expect(prisonApiClient.getIsKeyworker).toBeCalledTimes(1)
        expect(output.caseLoads).toEqual(expectedCaseLoads)
        expect(output.activeCaseLoad).toEqual(expectedCaseLoads[0])
        expect(output.services.find(service => service.heading === 'Global search')).toBeTruthy()
      })
    })
  })
})
