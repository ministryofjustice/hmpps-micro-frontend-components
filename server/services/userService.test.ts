import UserService, { API_COOL_OFF_MINUTES, API_ERROR_LIMIT } from './userService'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { prisonApiClientMock } from '../../tests/mocks/prisonApiClientMock'
import { CaseLoad } from '../interfaces/caseLoad'
import PrisonApiClient from '../data/prisonApiClient'
import { getTokenDataMock } from '../../tests/mocks/TokenDataMock'
import authUserMock from '../../tests/mocks/AuthUserMock'
import { RedisClient } from '../data/redisClient'

jest.mock('../data/hmppsAuthClient')

const token = 'some token'
const redisClient = {
  get: jest.fn(),
  set: jest.fn(),
  on: jest.fn(),
  connect: jest.fn(),
  isOpen: true,
} as unknown as jest.Mocked<RedisClient>

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
        redisClient as unknown as RedisClient,
      )
    })

    describe('with no token data', () => {
      it('Retrieves and formats user name', async () => {
        const result = await userService.getUser(token)
        expect(hmppsAuthClient.getUser).toBeCalledTimes(1)
        expect(result.displayName).toEqual('John Smith')
      })
    })

    describe('with token data', () => {
      it('Retrieves and formats user name', async () => {
        const result = await userService.getUser(token, getTokenDataMock())
        expect(hmppsAuthClient.getUser).toBeCalledTimes(0)
        expect(result).toEqual({ displayName: 'Token User', name: 'Token User', roles: ['ROLE_PF_STD_PRISON'] })
      })
    })

    it('Propagates error', async () => {
      hmppsAuthClient.getUser.mockRejectedValue(new Error('some error'))

      await expect(userService.getUser(token)).rejects.toEqual(new Error('some error'))
    })
  })

  describe('getUserCaseLoads', () => {
    const prisonApiClient = prisonApiClientMock() as undefined as PrisonApiClient
    beforeEach(() => {
      hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
      hmppsAuthClient.getUser.mockResolvedValue({ ...authUserMock, name: 'john smith' })

      expectedCaseLoads = [{ caseloadFunction: '', caseLoadId: '1', currentlyActive: true, description: '', type: '' }]
      prisonApiClient.getUserCaseLoads = jest.fn(async () => expectedCaseLoads)

      userService = new UserService(
        () => hmppsAuthClient,
        () => prisonApiClient,
        redisClient as unknown as RedisClient,
      )
    })

    it('Retrieves case loads', async () => {
      const result = await userService.getUserCaseLoads(token, 'username')
      expect(prisonApiClient.getUserCaseLoads).toBeCalledTimes(1)
      expect(result).toEqual(expectedCaseLoads)
    })

    it('Returns cached case loads if they are available', async () => {
      const cachedVal = [
        { caseloadFunction: '', caseLoadId: 'CACHED', currentlyActive: true, description: '', type: '' },
      ]
      redisClient.get.mockResolvedValueOnce(JSON.stringify({ caseLoads: cachedVal }))
      const result = await userService.getUserCaseLoads(token, 'username')
      expect(prisonApiClient.getUserCaseLoads).toBeCalledTimes(0)
      expect(result).toEqual(cachedVal)
    })

    it('Gets from api if cache fails', async () => {
      redisClient.get.mockRejectedValueOnce('FAIL')
      const result = await userService.getUserCaseLoads(token, 'username')
      expect(prisonApiClient.getUserCaseLoads).toBeCalledTimes(1)
      expect(result).toEqual(expectedCaseLoads)
    })

    it('Returns empty list if redis and api fails', async () => {
      redisClient.get.mockRejectedValueOnce('FAIL')
      prisonApiClient.getUserCaseLoads = jest.fn(async () => {
        throw new Error('API FAIL')
      })
      const result = await userService.getUserCaseLoads(token, 'username')
      expect(prisonApiClient.getUserCaseLoads).toBeCalledTimes(1)
      expect(result).toEqual([])
    })

    it(`Sets circuit breaker if api fails ${API_ERROR_LIMIT} times`, async () => {
      prisonApiClient.getUserCaseLoads = jest.fn(async () => {
        throw new Error('API FAIL')
      })
      await Promise.all([...Array(API_ERROR_LIMIT)].map(() => userService.getUserCaseLoads(token, 'username')))

      const result = await userService.getUserCaseLoads(token, 'username')
      expect(prisonApiClient.getUserCaseLoads).toBeCalledTimes(API_ERROR_LIMIT)
      expect(result).toEqual([])
    })

    it(`Unsets circuit breaker after ${API_COOL_OFF_MINUTES} minutes`, async () => {
      jest.useFakeTimers()
      prisonApiClient.getUserCaseLoads = jest.fn(async () => {
        throw new Error('API FAIL')
      })
      await Promise.all([...Array(API_ERROR_LIMIT)].map(i => userService.getUserCaseLoads(token, 'username')))

      jest.advanceTimersByTime(API_COOL_OFF_MINUTES * 60000)

      await userService.getUserCaseLoads(token, 'username')
      expect(prisonApiClient.getUserCaseLoads).toBeCalledTimes(API_ERROR_LIMIT + 1)

      jest.useRealTimers()
    })

    it('Stores response in cache if user has 1 caseload', async () => {
      const result = await userService.getUserCaseLoads(token, 'username')
      expect(redisClient.set).toBeCalledTimes(1)
      expect(redisClient.set).toBeCalledWith('username', JSON.stringify({ caseLoads: result }), { EX: 300 })
      expect(result).toEqual(expectedCaseLoads)
    })

    it('Does not store response in cache if user has > 1 caseload', async () => {
      expectedCaseLoads = [
        { caseloadFunction: '', caseLoadId: '1', currentlyActive: true, description: '', type: '' },
        { caseloadFunction: '', caseLoadId: '2', currentlyActive: true, description: '', type: '' },
      ]
      prisonApiClient.getUserCaseLoads = jest.fn(async () => expectedCaseLoads)

      userService = new UserService(
        () => hmppsAuthClient,
        () => prisonApiClient,
        redisClient as unknown as RedisClient,
      )

      const result = await userService.getUserCaseLoads(token, 'username')
      expect(redisClient.set).toBeCalledTimes(0)
      expect(result).toEqual(expectedCaseLoads)
    })
  })
})
