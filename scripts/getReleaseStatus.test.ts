import fs from 'node:fs/promises'
import path from 'node:path'
import nock from 'nock'
import redis from 'redis'
import yaml from 'yaml'

import { getData, endpoints } from './getReleaseStatus'

const activitiesUrl = 'https://activities-test.hmpps.service.justice.gov.uk'
const adjudicationsUrl = 'https://manage-adjudications-api-dev.hmpps.service.justice.gov.uk'
const alertsUrl = 'https://alerts-api-dev.hmpps.service.justice.gov.uk'
const caseNotesApiUrl = 'https://dev.offender-case-notes.service.justice.gov.uk'
const cemoUrl = 'https://hmpps-electronic-monitoring-create-an-order-dev.hmpps.service.justice.gov.uk'
const csipApiUrl = 'https://csip-api-dev.hmpps.service.justice.gov.uk'
const manageApplicationsUrl = 'https://managing-prisoner-apps-staff-dev.hmpps.service.justice.gov.uk'
const officialVisitsApi = 'https://official-visits-api-dev.hmpps.service.justice.gov.uk'
const prepareSomeoneForReleaseUrl = 'https://resettlement-passport-ui-dev.hmpps.service.justice.gov.uk'
const reportingUrl = 'https://digital-prison-reporting-mi-ui-dev.hmpps.service.justice.gov.uk'
const residentialLocationUrl = 'https://locations-inside-prison-api-dev.hmpps.service.justice.gov.uk'
const whereaboutsApiUrl = 'https://whereabouts-api-dev.service.justice.gov.uk'
const allUrls = [
  activitiesUrl,
  adjudicationsUrl,
  alertsUrl,
  caseNotesApiUrl,
  cemoUrl,
  csipApiUrl,
  manageApplicationsUrl,
  officialVisitsApi,
  prepareSomeoneForReleaseUrl,
  reportingUrl,
  residentialLocationUrl,
  whereaboutsApiUrl,
  // NB: keep service list sorted
]
const allUrlsExcludingResidentialLocation = allUrls.filter(url => url !== residentialLocationUrl)

function setMockSuccess(
  urls: string[],
  body: object = { some: 'stuff', activeAgencies: ['agency1', 'agency2'] },
): void {
  urls.forEach(url => nock(url).get('/info').reply(200, body))
}

function setMockError(urls: string[], code = 404): void {
  if (code === 500) {
    urls.forEach(url => nock(url).get('/info').replyWithError('ERROR'))
  } else {
    urls.forEach(url => nock(url).get('/info').reply(code))
  }
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
  }
})

type RedisClient = ReturnType<typeof redis.createClient>
let mockRedisClientMock: jest.Mocked<RedisClient>

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => undefined)
  jest.spyOn(console, 'error').mockImplementation(() => undefined)

  mockRedisClientMock = redis.createClient() as unknown as jest.Mocked<RedisClient>
})

describe('Get release status script', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    nock.cleanAll()
    process.env.INFO_DISABLED_APPS = undefined
  })

  it('should get application info for all apps', async () => {
    setMockSuccess(allUrls)

    await getData()

    expect(mockRedisClientMock.set).toHaveBeenCalledWith(
      'applicationInfo',
      JSON.stringify([
        { app: 'activities', activeAgencies: ['agency1', 'agency2'] },
        { app: 'adjudications', activeAgencies: ['agency1', 'agency2'] },
        { app: 'alerts', activeAgencies: ['agency1', 'agency2'] },
        { app: 'caseNotesApi', activeAgencies: ['agency1', 'agency2'] },
        { app: 'cemo', activeAgencies: ['agency1', 'agency2'] },
        { app: 'csipApi', activeAgencies: ['agency1', 'agency2'] },
        { app: 'manageApplications', activeAgencies: ['agency1', 'agency2'] },
        { app: 'officialVisitsApi', activeAgencies: ['agency1', 'agency2'] },
        { app: 'prepareSomeoneForReleaseUi', activeAgencies: ['agency1', 'agency2'] },
        { app: 'reporting', activeAgencies: ['agency1', 'agency2'] },
        { app: 'residentialLocations', activeAgencies: ['agency1', 'agency2'] },
        { app: 'whereabouts', activeAgencies: ['agency1', 'agency2'] },
      ]),
    )
  })

  it('should store the data it gets if others fail', async () => {
    setMockSuccess([residentialLocationUrl])
    setMockError(allUrlsExcludingResidentialLocation, 404)

    await getData()

    expect(mockRedisClientMock.set).toHaveBeenCalledWith(
      'applicationInfo',
      JSON.stringify([{ app: 'residentialLocations', activeAgencies: ['agency1', 'agency2'] }]),
    )
  })

  it('should not fail if it can’t find the data in response', async () => {
    setMockSuccess([residentialLocationUrl], { some: 'stuff' })
    setMockSuccess(allUrlsExcludingResidentialLocation)

    await getData()
    expect(mockRedisClientMock.set).toHaveBeenCalledWith(
      'applicationInfo',
      JSON.stringify([
        { app: 'activities', activeAgencies: ['agency1', 'agency2'] },
        { app: 'adjudications', activeAgencies: ['agency1', 'agency2'] },
        { app: 'alerts', activeAgencies: ['agency1', 'agency2'] },
        { app: 'caseNotesApi', activeAgencies: ['agency1', 'agency2'] },
        { app: 'cemo', activeAgencies: ['agency1', 'agency2'] },
        { app: 'csipApi', activeAgencies: ['agency1', 'agency2'] },
        { app: 'manageApplications', activeAgencies: ['agency1', 'agency2'] },
        { app: 'officialVisitsApi', activeAgencies: ['agency1', 'agency2'] },
        { app: 'prepareSomeoneForReleaseUi', activeAgencies: ['agency1', 'agency2'] },
        { app: 'reporting', activeAgencies: ['agency1', 'agency2'] },
        { app: 'whereabouts', activeAgencies: ['agency1', 'agency2'] },
      ]),
    )
  })

  it('should not check apps which have had the info check disabled', async () => {
    setMockSuccess(allUrls)
    process.env.INFO_DISABLED_APPS = 'alerts,whereabouts'

    await getData()

    expect(mockRedisClientMock.set).toHaveBeenCalledWith(
      'applicationInfo',
      JSON.stringify([
        { app: 'activities', activeAgencies: ['agency1', 'agency2'] },
        { app: 'adjudications', activeAgencies: ['agency1', 'agency2'] },
        { app: 'caseNotesApi', activeAgencies: ['agency1', 'agency2'] },
        { app: 'cemo', activeAgencies: ['agency1', 'agency2'] },
        { app: 'csipApi', activeAgencies: ['agency1', 'agency2'] },
        { app: 'manageApplications', activeAgencies: ['agency1', 'agency2'] },
        { app: 'officialVisitsApi', activeAgencies: ['agency1', 'agency2'] },
        { app: 'prepareSomeoneForReleaseUi', activeAgencies: ['agency1', 'agency2'] },
        { app: 'reporting', activeAgencies: ['agency1', 'agency2'] },
        { app: 'residentialLocations', activeAgencies: ['agency1', 'agency2'] },
      ]),
    )
  })

  describe('when redis is available', () => {
    it('should use the stored data if it exists and no new data', async () => {
      setMockError(allUrls, 500)

      const storedData = [{ app: 'adjudications', activeAgencies: ['agency1', 'agency2'] }]
      mockRedisClientMock.get.mockResolvedValue(JSON.stringify(storedData))

      await getData()

      expect(mockRedisClientMock.set).toHaveBeenCalledWith('applicationInfo', JSON.stringify(storedData))
    })

    it('should use the stored data for app if it exists and no new data', async () => {
      const storedData = [
        { app: 'activities', activeAgencies: ['agency1', 'agency2'] },
        { app: 'adjudications', activeAgencies: ['agency1', 'agency2'] },
        { app: 'alerts', activeAgencies: ['agency1', 'agency2'] },
        { app: 'caseNotesApi', activeAgencies: ['agency1', 'agency2'] },
        { app: 'cemo', activeAgencies: ['agency1', 'agency2'] },
        { app: 'csipApi', activeAgencies: ['agency1', 'agency2'] },
        { app: 'manageApplications', activeAgencies: ['agency1', 'agency2'] },
        { app: 'officialVisitsApi', activeAgencies: ['agency1', 'agency2'] },
        { app: 'prepareSomeoneForReleaseUi', activeAgencies: ['agency1', 'agency2'] },
        { app: 'reporting', activeAgencies: ['agency1', 'agency2'] },
        { app: 'residentialLocations', activeAgencies: ['agency1', 'agency2'] },
        { app: 'whereabouts', activeAgencies: ['agency1', 'agency2'] },
      ]

      setMockSuccess([residentialLocationUrl], { some: 'stuff', activeAgencies: ['agency1', 'agency2', 'agency3'] })
      setMockError(allUrlsExcludingResidentialLocation, 404)

      mockRedisClientMock.get.mockResolvedValue(JSON.stringify(storedData))

      await getData()

      expect(mockRedisClientMock.set).toHaveBeenCalledWith(
        'applicationInfo',
        JSON.stringify([
          { app: 'activities', activeAgencies: ['agency1', 'agency2'] },
          { app: 'adjudications', activeAgencies: ['agency1', 'agency2'] },
          { app: 'alerts', activeAgencies: ['agency1', 'agency2'] },
          { app: 'caseNotesApi', activeAgencies: ['agency1', 'agency2'] },
          { app: 'cemo', activeAgencies: ['agency1', 'agency2'] },
          { app: 'csipApi', activeAgencies: ['agency1', 'agency2'] },
          { app: 'manageApplications', activeAgencies: ['agency1', 'agency2'] },
          { app: 'officialVisitsApi', activeAgencies: ['agency1', 'agency2'] },
          { app: 'prepareSomeoneForReleaseUi', activeAgencies: ['agency1', 'agency2'] },
          { app: 'reporting', activeAgencies: ['agency1', 'agency2'] },
          { app: 'residentialLocations', activeAgencies: ['agency1', 'agency2', 'agency3'] },
          { app: 'whereabouts', activeAgencies: ['agency1', 'agency2'] },
        ]),
      )
    })

    it('should use the stored data for app with the info check disabled', async () => {
      process.env.INFO_DISABLED_APPS = 'alerts,whereabouts'
      const storedData = [
        { app: 'activities', activeAgencies: ['agency1', 'agency2'] },
        { app: 'adjudications', activeAgencies: ['agency1', 'agency2'] },
        { app: 'alerts', activeAgencies: ['agency1', 'agency2'] },
        { app: 'caseNotesApi', activeAgencies: ['agency1', 'agency2'] },
        { app: 'cemo', activeAgencies: ['agency1', 'agency2'] },
        { app: 'csipApi', activeAgencies: ['agency1', 'agency2'] },
        { app: 'manageApplications', activeAgencies: ['agency1', 'agency2'] },
        { app: 'officialVisitsApi', activeAgencies: ['agency1', 'agency2'] },
        { app: 'prepareSomeoneForReleaseUi', activeAgencies: ['agency1', 'agency2'] },
        { app: 'reporting', activeAgencies: ['agency1', 'agency2'] },
        { app: 'residentialLocations', activeAgencies: ['agency1', 'agency2'] },
        { app: 'whereabouts', activeAgencies: ['agency1', 'agency2'] },
      ]

      setMockSuccess([residentialLocationUrl], { some: 'stuff', activeAgencies: ['agency1', 'agency2', 'agency3'] })
      setMockError(allUrlsExcludingResidentialLocation, 404)

      mockRedisClientMock.get.mockResolvedValue(JSON.stringify(storedData))

      await getData()

      expect(mockRedisClientMock.set).toHaveBeenCalledWith(
        'applicationInfo',
        JSON.stringify([
          { app: 'activities', activeAgencies: ['agency1', 'agency2'] },
          { app: 'adjudications', activeAgencies: ['agency1', 'agency2'] },
          { app: 'alerts', activeAgencies: ['agency1', 'agency2'] },
          { app: 'caseNotesApi', activeAgencies: ['agency1', 'agency2'] },
          { app: 'cemo', activeAgencies: ['agency1', 'agency2'] },
          { app: 'csipApi', activeAgencies: ['agency1', 'agency2'] },
          { app: 'manageApplications', activeAgencies: ['agency1', 'agency2'] },
          { app: 'officialVisitsApi', activeAgencies: ['agency1', 'agency2'] },
          { app: 'prepareSomeoneForReleaseUi', activeAgencies: ['agency1', 'agency2'] },
          { app: 'reporting', activeAgencies: ['agency1', 'agency2'] },
          { app: 'residentialLocations', activeAgencies: ['agency1', 'agency2', 'agency3'] },
          { app: 'whereabouts', activeAgencies: ['agency1', 'agency2'] },
        ]),
      )
    })

    it('should use new app data if it does not exist on stored data', async () => {
      const storedData = [{ app: 'residentialLocations', activeAgencies: ['agency1', 'agency2'] }]

      setMockError([residentialLocationUrl], 500)
      setMockSuccess(allUrlsExcludingResidentialLocation)

      mockRedisClientMock.get.mockResolvedValue(JSON.stringify(storedData))

      await getData()

      expect(mockRedisClientMock.set).toHaveBeenCalledWith(
        'applicationInfo',
        JSON.stringify([
          { app: 'residentialLocations', activeAgencies: ['agency1', 'agency2'] },
          { app: 'activities', activeAgencies: ['agency1', 'agency2'] },
          { app: 'adjudications', activeAgencies: ['agency1', 'agency2'] },
          { app: 'alerts', activeAgencies: ['agency1', 'agency2'] },
          { app: 'caseNotesApi', activeAgencies: ['agency1', 'agency2'] },
          { app: 'cemo', activeAgencies: ['agency1', 'agency2'] },
          { app: 'csipApi', activeAgencies: ['agency1', 'agency2'] },
          { app: 'manageApplications', activeAgencies: ['agency1', 'agency2'] },
          { app: 'officialVisitsApi', activeAgencies: ['agency1', 'agency2'] },
          { app: 'prepareSomeoneForReleaseUi', activeAgencies: ['agency1', 'agency2'] },
          { app: 'reporting', activeAgencies: ['agency1', 'agency2'] },
          { app: 'whereabouts', activeAgencies: ['agency1', 'agency2'] },
        ]),
      )
    })
  })

  it('should be set up correctly in helm chart', async () => {
    const helmChartPath = path.join(
      __dirname,
      '../helm_deploy/hmpps-micro-frontend-components/templates/services-cronjob.yaml',
    )
    const helmChart = await fs.readFile(helmChartPath, { encoding: 'utf8' }).then(data => {
      // replace quotes in go templates so the file parses as plain yaml
      const filteredData = data.replaceAll(/{{(?<goTpl>[^}]*)}}/g, goTpl => goTpl.replaceAll('"', "'"))
      return yaml.parse(filteredData)
    })
    const { env } = helmChart.spec.jobTemplate.spec.template.spec.containers[0]
    const helmEnvVars = new Set(env.map((item: { name: string }) => item.name))

    const scriptEnvVars = new Set(endpoints.filter(endpoint => 'urlEnv' in endpoint).map(endpoint => endpoint.urlEnv))

    const missingEnvVars = scriptEnvVars.difference(helmEnvVars)
    expect(missingEnvVars).toEqual(new Set())
  })
})
