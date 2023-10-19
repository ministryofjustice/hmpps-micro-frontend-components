import UserService, { API_COOL_OFF_MINUTES, API_ERROR_LIMIT } from './userService'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { prisonApiClientMock } from '../../tests/mocks/prisonApiClientMock'
import { CaseLoad } from '../interfaces/caseLoad'
import PrisonApiClient from '../data/prisonApiClient'
import { getTokenDataMock } from '../../tests/mocks/TokenDataMock'
import authUserMock from '../../tests/mocks/AuthUserMock'
import TokenMock, { rolesForMockToken } from '../../tests/mocks/TokenMock'

jest.mock('../data/hmppsAuthClient')

const token = TokenMock
const staffId = 12345

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
      prisonApiClient.getStaffRoles = jest.fn(async () => [{ role: 'KW' }])

      userService = new UserService(
        () => hmppsAuthClient,
        () => prisonApiClient,
      )
    })

    it('Returns case loads', async () => {
      const { caseLoads } = await userService.getUserData(token, staffId, rolesForMockToken)
      expect(prisonApiClient.getUserCaseLoads).toBeCalledTimes(1)
      expect(caseLoads).toEqual(expectedCaseLoads)
    })

    it('Returns active caseload id', async () => {
      const { activeCaseLoad } = await userService.getUserData(token, staffId, rolesForMockToken)
      expect(prisonApiClient.getUserCaseLoads).toBeCalledTimes(1)
      expect(activeCaseLoad).toEqual(expectedCaseLoads[0])
    })

    it('Returns services', async () => {
      const { services } = await userService.getUserData(token, staffId, ['GLOBAL_SEARCH'])
      expect(prisonApiClient.getUserCaseLoads).toBeCalledTimes(1)
      expect(services.find(service => service.heading === 'Global search')).toBeTruthy()
    })

    it('Returns empty list if api fails', async () => {
      prisonApiClient.getUserCaseLoads = jest.fn(async () => {
        throw new Error('API FAIL')
      })
      const { caseLoads } = await userService.getUserData(token, staffId, rolesForMockToken)
      expect(prisonApiClient.getUserCaseLoads).toBeCalledTimes(1)
      expect(caseLoads).toEqual([])
    })

    it(`Sets circuit breaker if api fails ${API_ERROR_LIMIT} times`, async () => {
      prisonApiClient.getUserCaseLoads = jest.fn(async () => {
        throw new Error('API FAIL')
      })
      await Promise.all(
        [...Array(API_ERROR_LIMIT)].map(() => userService.getUserData(token, staffId, rolesForMockToken)),
      )

      const { caseLoads } = await userService.getUserData(token, staffId, rolesForMockToken)
      expect(prisonApiClient.getUserCaseLoads).toBeCalledTimes(API_ERROR_LIMIT)
      expect(caseLoads).toEqual([])
    })

    it(`Unsets circuit breaker after ${API_COOL_OFF_MINUTES} minutes`, async () => {
      jest.useFakeTimers()
      prisonApiClient.getUserCaseLoads = jest.fn(async () => {
        throw new Error('API FAIL')
      })
      await Promise.all(
        [...Array(API_ERROR_LIMIT)].map(() => userService.getUserData(token, staffId, rolesForMockToken)),
      )

      jest.advanceTimersByTime(API_COOL_OFF_MINUTES * 60000)

      await userService.getUserData(token, staffId, rolesForMockToken)
      expect(prisonApiClient.getUserCaseLoads).toBeCalledTimes(API_ERROR_LIMIT + 1)

      jest.useRealTimers()
    })
  })
})
