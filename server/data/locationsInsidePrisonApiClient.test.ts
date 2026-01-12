import nock from 'nock'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import LocationsInsidePrisonApiClient from './locationsInsidePrisonApiClient'
import { CaseLoad } from '../interfaces/caseLoad'

describe('LocationsInsidePrisonApiClient', () => {
  let api: nock.Scope
  let hmppsAuthClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    config.apis.locationsInsidePrisonApi.url = 'http://localhost:8100'
    api = nock(config.apis.locationsInsidePrisonApi.url)
    hmppsAuthClient = {
      getToken: jest.fn().mockResolvedValue('system-token'),
    } as unknown as jest.Mocked<AuthenticationClient>
  })

  afterEach(() => {
    nock.cleanAll()
    jest.resetAllMocks()
  })

  describe('getUserLocations', () => {
    it('Returns empty array when caseload function is ADMIN', async () => {
      const caseLoad = { caseLoadId: 'MDI', caseloadFunction: 'ADMIN' } as CaseLoad
      const response = await new LocationsInsidePrisonApiClient(hmppsAuthClient).getUserLocations(caseLoad)
      expect(response).toEqual([])
      expect(hmppsAuthClient.getToken).not.toHaveBeenCalled()
    })

    it('Returns response when successful', async () => {
      const caseLoad = { caseLoadId: 'MDI', caseloadFunction: 'GENERAL' } as CaseLoad

      api
        .get('/locations/prison/MDI/residential-first-level')
        .matchHeader('authorization', 'Bearer system-token')
        .reply(200, () => true)

      const response = await new LocationsInsidePrisonApiClient(hmppsAuthClient).getUserLocations(caseLoad)

      expect(response).toEqual(true)
      expect(hmppsAuthClient.getToken).toHaveBeenCalled()
    })
  })
})
