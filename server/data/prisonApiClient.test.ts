import nock from 'nock'
import config from '../config'
import PrisonApiClient from './prisonApiClient'

describe('PrisonAPIClient', () => {
  let api: nock.Scope

  beforeEach(() => {
    config.apis.prisonApi.url = 'http://localhost:8100'
    api = nock(config.apis.prisonApi.url)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getUserCaseLoads', () => {
    it('Returns response when successful', async () => {
      api.get(`/api/staff/123/caseloads`, '').reply(200, () => true)
      const response = await new PrisonApiClient(null).getUserCaseLoads(123)
      expect(response).toEqual(true)
    })
  })
})
