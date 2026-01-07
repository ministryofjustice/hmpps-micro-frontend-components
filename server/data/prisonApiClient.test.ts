import nock from 'nock'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import PrisonApiClient from './prisonApiClient'

describe('PrisonAPIClient', () => {
  let api: nock.Scope
  let hmppsAuthClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    config.apis.prisonApi.url = 'http://localhost:8100'
    api = nock(config.apis.prisonApi.url)
    hmppsAuthClient = {
      getToken: jest.fn().mockResolvedValue('system-token'),
    } as unknown as jest.Mocked<AuthenticationClient>
  })

  afterEach(() => {
    nock.cleanAll()
    jest.resetAllMocks()
  })

  describe('getUserCaseLoads', () => {
    it('Returns response when successful', async () => {
      api
        .get('/api/staff/123/caseloads')
        .matchHeader('authorization', 'Bearer system-token')
        .reply(200, () => true)

      const response = await new PrisonApiClient(hmppsAuthClient).getUserCaseLoads(123)
      expect(response).toEqual(true)
      expect(hmppsAuthClient.getToken).toHaveBeenCalled()
    })
  })
})
