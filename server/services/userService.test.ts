import UserService from './userService'
import HmppsAuthClient, { User } from '../data/hmppsAuthClient'
import { prisonApiClientMock } from '../../tests/mocks/prisonApiClientMock'
import { CaseLoad } from '../interfaces/caseLoad'
import PrisonApiClient from '../data/prisonApiClient'
import { getTokenDataMock } from '../../tests/mocks/TokenDataMock'

jest.mock('../data/hmppsAuthClient')

const token = 'some token'

describe('User service', () => {
  let hmppsAuthClient: jest.Mocked<HmppsAuthClient>
  let userService: UserService
  let expectedCaseLoads: CaseLoad[]

  describe('getUser', () => {
    beforeEach(() => {
      hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
      hmppsAuthClient.getUser.mockResolvedValue({ name: 'john smith' } as User)

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
    it('Retrieves case loads', async () => {
      const result = await userService.getUserCaseLoads(token)
      expect(result).toEqual(expectedCaseLoads)
    })
  })
})
