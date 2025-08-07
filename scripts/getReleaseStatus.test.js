const nock = require('nock')
const { getData } = require('./getReleaseStatus')
const { mockRedisClientMock } = require('redis')

const residentialLocationUrl = 'https://locations-inside-prison-api-dev.hmpps.service.justice.gov.uk'
const reportingUrl = 'https://digital-prison-reporting-mi-ui-dev.hmpps.service.justice.gov.uk'
const alertsUrl = 'https://alerts-api-dev.hmpps.service.justice.gov.uk'
const activitiesUrl = 'https://activities-test.hmpps.service.justice.gov.uk'
const adjudicationsUrl = 'https://manage-adjudications-api-dev.hmpps.service.justice.gov.uk'
const learningAndWorkProgressUrl = 'https://learning-and-work-progress-dev.hmpps.service.justice.gov.uk'
const whereaboutsApiUrl = 'https://whereabouts-api-dev.service.justice.gov.uk'
const csipApiUrl = 'https://csip-api-dev.hmpps.service.justice.gov.uk'
const caseNotesApiUrl = 'https://dev.offender-case-notes.service.justice.gov.uk'
const prepareSomeoneForReleaseUrl = 'https://resettlement-passport-ui-dev.hmpps.service.justice.gov.uk'
const cemoUrl = 'https://hmpps-electronic-monitoring-create-an-order-dev.hmpps.service.justice.gov.uk'
const manageApplicationsUrl = 'https://managing-prisoner-apps-staff-dev.hmpps.service.justice.gov.uk'
const allUrls = [
  residentialLocationUrl,
  reportingUrl,
  alertsUrl,
  csipApiUrl,
  activitiesUrl,
  adjudicationsUrl,
  learningAndWorkProgressUrl,
  whereaboutsApiUrl,
  caseNotesApiUrl,
  prepareSomeoneForReleaseUrl,
  cemoUrl,
  manageApplicationsUrl,
]

function setMockSuccess(urls, body = { some: 'stuff', activeAgencies: ['agency1', 'agency2'] }) {
  const urlsToUse = urls || allUrls
  urlsToUse.forEach(url => nock(url).get('/info').reply(200, body))
}

function setMockError(urls, code = 404) {
  const urlsToUse = urls || allUrls
  code = 500
    ? urlsToUse.forEach(url => nock(url).get('/info').replyWithError('ERROR'))
    : urlsToUse.forEach(url => nock(url).get('/info').reply(code))
}

jest.mock('redis', () => {
  const mockRedisClientMock = {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    disconnect: jest.fn().mockResolvedValue('OK'),
    connect: jest.fn().mockResolvedValue('OK'),
    destroy: jest.fn(),
    isOpen: false,
    on: jest.fn().mockReturnThis(),
  }

  return {
    createClient: () => mockRedisClientMock,
    mockRedisClientMock, // Export the mockRedisClientMock for access in tests
  }
})

describe('Get release status script', () => {
  beforeEach(() => {
    jest.spyOn(process, 'exit').mockImplementation(() => {})
    jest.clearAllMocks()
    nock.cleanAll()
  })

  it('should get application info for all apps', async () => {
    const { mockRedisClientMock } = require('redis')
    setMockSuccess(allUrls)

    await getData()

    expect(mockRedisClientMock.set).toHaveBeenCalledWith(
      'applicationInfo',
      JSON.stringify([
        { app: 'adjudications', activeAgencies: ['agency1', 'agency2'] },
        { app: 'activities', activeAgencies: ['agency1', 'agency2'] },
        { app: 'alerts', activeAgencies: ['agency1', 'agency2'] },
        { app: 'csipApi', activeAgencies: ['agency1', 'agency2'] },
        { app: 'reporting', activeAgencies: ['agency1', 'agency2'] },
        { app: 'residentialLocations', activeAgencies: ['agency1', 'agency2'] },
        { app: 'learningAndWorkProgress', activeAgencies: ['agency1', 'agency2'] },
        { app: 'whereabouts', activeAgencies: ['agency1', 'agency2'] },
        { app: 'caseNotesApi', activeAgencies: ['agency1', 'agency2'] },
        { app: 'prepareSomeoneForReleaseUi', activeAgencies: ['agency1', 'agency2'] },
        { app: 'cemo', activeAgencies: ['agency1', 'agency2'] },
        { app: 'manageApplications', activeAgencies: ['agency1', 'agency2'] },
      ]),
    )
  })

  it('should store the data it gets if others fail', async () => {
    const { mockRedisClientMock } = require('redis')
    const [residentialLocationUrl, ...restUrls] = allUrls
    setMockSuccess([residentialLocationUrl])
    setMockError(restUrls, 404)

    await getData()

    expect(mockRedisClientMock.set).toHaveBeenCalledWith(
      'applicationInfo',
      JSON.stringify([{ app: 'residentialLocations', activeAgencies: ['agency1', 'agency2'] }]),
    )
  })

  it('should not fail if it cant find the data in response', async () => {
    const { mockRedisClientMock } = require('redis')
    const [residentialLocationUrl, ...restUrls] = allUrls
    setMockSuccess([residentialLocationUrl], { some: 'stuff' })
    setMockSuccess(restUrls)

    await getData()
    expect(mockRedisClientMock.set).toHaveBeenCalledWith(
      'applicationInfo',
      JSON.stringify([
        { app: 'adjudications', activeAgencies: ['agency1', 'agency2'] },
        { app: 'activities', activeAgencies: ['agency1', 'agency2'] },
        { app: 'alerts', activeAgencies: ['agency1', 'agency2'] },
        { app: 'csipApi', activeAgencies: ['agency1', 'agency2'] },
        { app: 'reporting', activeAgencies: ['agency1', 'agency2'] },
        { app: 'learningAndWorkProgress', activeAgencies: ['agency1', 'agency2'] },
        { app: 'whereabouts', activeAgencies: ['agency1', 'agency2'] },
        { app: 'caseNotesApi', activeAgencies: ['agency1', 'agency2'] },
        { app: 'prepareSomeoneForReleaseUi', activeAgencies: ['agency1', 'agency2'] },
        { app: 'cemo', activeAgencies: ['agency1', 'agency2'] },
        { app: 'manageApplications', activeAgencies: ['agency1', 'agency2'] },
      ]),
    )
  })

  describe('when redis is available', () => {
    it('should use the stored data if it exists and no new data', async () => {
      const { mockRedisClientMock } = require('redis')
      setMockError(allUrls, 500)

      const storedData = [{ app: 'adjudications', activeAgencies: ['agency1', 'agency2'] }]
      mockRedisClientMock.get.mockResolvedValue(JSON.stringify(storedData))

      await getData()

      expect(mockRedisClientMock.set).toHaveBeenCalledWith('applicationInfo', JSON.stringify(storedData))
    })

    it('should use the stored data for app if it exists and no new data', async () => {
      const { mockRedisClientMock } = require('redis')
      const storedData = [
        { app: 'adjudications', activeAgencies: ['agency1', 'agency2'] },
        { app: 'activities', activeAgencies: ['agency1', 'agency2'] },
        { app: 'alerts', activeAgencies: ['agency1', 'agency2'] },
        { app: 'csipApi', activeAgencies: ['agency1', 'agency2'] },
        { app: 'reporting', activeAgencies: ['agency1', 'agency2'] },
        { app: 'residentialLocations', activeAgencies: ['agency1', 'agency2'] },
        { app: 'whereabouts', activeAgencies: ['agency1', 'agency2'] },
        { app: 'caseNotesApi', activeAgencies: ['agency1', 'agency2'] },
        { app: 'prepareSomeoneForReleaseUi', activeAgencies: ['agency1', 'agency2'] },
        { app: 'cemo', activeAgencies: ['agency1', 'agency2'] },
        { app: 'manageApplications', activeAgencies: ['agency1', 'agency2'] },
      ]

      const [residentialLocationUrl, ...restUrls] = allUrls
      setMockSuccess([residentialLocationUrl], { some: 'stuff', activeAgencies: ['agency1', 'agency2', 'agency3'] })
      setMockError(restUrls, 404)

      mockRedisClientMock.get.mockResolvedValue(JSON.stringify(storedData))

      await getData()

      expect(mockRedisClientMock.set).toHaveBeenCalledWith(
        'applicationInfo',
        JSON.stringify([
          { app: 'adjudications', activeAgencies: ['agency1', 'agency2'] },
          { app: 'activities', activeAgencies: ['agency1', 'agency2'] },
          { app: 'alerts', activeAgencies: ['agency1', 'agency2'] },
          { app: 'csipApi', activeAgencies: ['agency1', 'agency2'] },
          { app: 'reporting', activeAgencies: ['agency1', 'agency2'] },
          { app: 'residentialLocations', activeAgencies: ['agency1', 'agency2', 'agency3'] },
          { app: 'whereabouts', activeAgencies: ['agency1', 'agency2'] },
          { app: 'caseNotesApi', activeAgencies: ['agency1', 'agency2'] },
          { app: 'prepareSomeoneForReleaseUi', activeAgencies: ['agency1', 'agency2'] },
          { app: 'cemo', activeAgencies: ['agency1', 'agency2'] },
          { app: 'manageApplications', activeAgencies: ['agency1', 'agency2'] },
        ]),
      )
    })

    it('should use new app data if it does not exist on stored data', async () => {
      const { mockRedisClientMock } = require('redis')
      const storedData = [{ app: 'residentialLocations', activeAgencies: ['agency1', 'agency2'] }]

      const [residentialLocationUrl, ...restUrls] = allUrls
      setMockError([residentialLocationUrl], 500)
      setMockSuccess(restUrls)

      mockRedisClientMock.get.mockResolvedValue(JSON.stringify(storedData))

      await getData()

      expect(mockRedisClientMock.set).toHaveBeenCalledWith(
        'applicationInfo',
        JSON.stringify([
          { app: 'residentialLocations', activeAgencies: ['agency1', 'agency2'] },
          { app: 'adjudications', activeAgencies: ['agency1', 'agency2'] },
          { app: 'activities', activeAgencies: ['agency1', 'agency2'] },
          { app: 'alerts', activeAgencies: ['agency1', 'agency2'] },
          { app: 'csipApi', activeAgencies: ['agency1', 'agency2'] },
          { app: 'reporting', activeAgencies: ['agency1', 'agency2'] },
          { app: 'learningAndWorkProgress', activeAgencies: ['agency1', 'agency2'] },
          { app: 'whereabouts', activeAgencies: ['agency1', 'agency2'] },
          { app: 'caseNotesApi', activeAgencies: ['agency1', 'agency2'] },
          { app: 'prepareSomeoneForReleaseUi', activeAgencies: ['agency1', 'agency2'] },
          { app: 'cemo', activeAgencies: ['agency1', 'agency2'] },
          { app: 'manageApplications', activeAgencies: ['agency1', 'agency2'] },
        ]),
      )
    })
  })
})
