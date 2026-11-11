import nock from 'nock'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import PrisonRegisterApiClient from './prisonRegisterApiClient'

describe('PrisonRegisterApiClient', () => {
  let api: nock.Scope
  let hmppsAuthClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    config.apis.prisonRegisterApi.url = 'http://localhost:8100'
    api = nock(config.apis.prisonRegisterApi.url)
    hmppsAuthClient = {
      getToken: jest.fn().mockResolvedValue('system-token'),
    } as unknown as jest.Mocked<AuthenticationClient>
  })

  afterEach(() => {
    nock.cleanAll()
    jest.resetAllMocks()
  })

  it('gets all prisons using the user token', async () => {
    const prisons = [{ prisonId: 'MDI', active: true }]
    api.get('/prisons').matchHeader('authorization', 'Bearer user-token').reply(200, prisons)

    const response = await new PrisonRegisterApiClient(hmppsAuthClient).getAllPrisons('user-token')

    expect(response).toEqual(prisons)
    expect(hmppsAuthClient.getToken).not.toHaveBeenCalled()
  })
})
