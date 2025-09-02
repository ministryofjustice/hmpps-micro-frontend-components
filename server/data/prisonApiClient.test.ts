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

  describe('getIsKeyworker', () => {
    it('Gracefully handles 404s for central admin accounts', async () => {
      api.get(`/api/staff/1234/CADM_I/roles/KW`, '').reply(404)
      const response = await new PrisonApiClient(null).getIsKeyworker('token', 'CADM_I', 1234)
      expect(response).toEqual(false)
    })

    it('Gracefully handles 403s for central admin accounts', async () => {
      api.get(`/api/staff/1234/CADM_I/roles/KW`, '').reply(403)
      const response = await new PrisonApiClient(null).getIsKeyworker('token', 'CADM_I', 1234)
      expect(response).toEqual(false)
    })

    it('Returns response when successful', async () => {
      api.get(`/api/staff/1234/LEI/roles/KW`, '').reply(200, () => true)
      const response = await new PrisonApiClient(null).getIsKeyworker('token', 'LEI', 1234)
      expect(response).toEqual(true)
    })
  })
})
