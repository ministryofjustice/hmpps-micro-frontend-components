const superagent = require('superagent')
const redis = require('redis')

const endpoints = [
  {
    application: 'adjudications',
    infoUrl: {
      PRODUCTION: 'https://manage-adjudications-api.hmpps.service.justice.gov.uk/info',
      'PRE-PRODUCTION': 'https://manage-adjudications-api-preprod.hmpps.service.justice.gov.uk/info',
      DEV: 'https://manage-adjudications-api-dev.hmpps.service.justice.gov.uk/info',
    },
  },
  { application: 'activities', urlEnv: 'ACTIVITIES_URL' },
  { application: 'cas2', urlEnv: 'CAS2_URL' },
  { application: 'alerts', urlEnv: 'ALERTS_API_URL' },
  { application: 'csipApi', urlEnv: 'CSIP_API_URL' },
  { application: 'reporting', urlEnv: 'REPORTING_URL' },
  { application: 'residentialLocations', urlEnv: 'RESIDENTIAL_LOCATIONS_API_URL' },
  { application: 'learningAndWorkProgress', urlEnv: 'LEARNING_AND_WORK_PROGRESS_URL' },
  { application: 'whereabouts', urlEnv: 'WHEREABOUTS_API_URL' },
  { application: 'incidentReporting', urlEnv: 'INCIDENT_REPORTING_URL' },
  { application: 'caseNotesApi', urlEnv: 'CASE_NOTES_API_URL' },
  { application: 'prepareSomeoneForReleaseUi', urlEnv: 'PREPARE_SOMEONE_FOR_RELEASE_URL' },
  { application: 'cemo', urlEnv: 'CEMO_URL' },
  { application: 'manageApplications', urlEnv: 'MANAGE_APPLICATIONS_URL' },
  { application: 'allocateKeyWorkers', urlEnv: 'ALLOCATE_KEY_WORKERS_API_URL' },
  { application: 'allocatePersonalOfficers', urlEnv: 'ALLOCATE_PERSONAL_OFFICERS_API_URL' },
  { application: 'supportAdditionalNeeds', urlEnv: 'SUPPORT_ADDITIONAL_NEEDS_URL' },
]

function getApplicationInfo(appLabel, url) {
  return superagent
    .get(url)
    .set('Accept', 'application/json')
    .retry(2, (err, res) => {
      console.log(`Received status ${res?.status} from application info request for ${appLabel}`)
    })
}

async function getRedisClient() {
  console.log('Creating redis client')
  return redis
    .createClient({
      url: `rediss://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
      password: process.env.REDIS_AUTH_TOKEN,
      socket: {
        reconnectStrategy: attempts => {
          // Exponential back off: 20ms, 40ms, 80ms..., capped to retry every 30 seconds
          const nextDelay = Math.min(2 ** attempts * 20, 30000)
          console.log(`Retry Redis connection attempt: ${attempts}, next attempt in: ${nextDelay}ms`)
          return nextDelay
        },
      },
    })
    .on('connect', () => {
      console.log('Redis client is connecting')
    })
    .on('ready', () => {
      console.log('Redis client is ready for use')
    })
    .on('end', () => {
      console.log('Redis client connection closed')
    })
    .on('error', err => {
      console.log(`Redis Error`, err)
    })
}

async function ensureConnected(redisClient) {
  if (!redisClient.isOpen) {
    await redisClient.connect()
  }
}

async function cacheResponses(body, redisClient) {
  const resp = await redisClient.set('applicationInfo', JSON.stringify(body))

  console.log(`Successfully cached application info`, body)
  return resp
}

async function getStoredData(redisClient) {
  const responseString = await redisClient.get('applicationInfo')
  console.log(`Previous stored application info: ${responseString}`)
  return JSON.parse(responseString)
}

function getUrlForApp(appData) {
  if (appData.urlEnv) {
    return process.env[appData.urlEnv] ? `${process.env[appData.urlEnv]}/info` : undefined
  }
  return appData.infoUrl[process.env.ENVIRONMENT_NAME]
}

const getData = async () => {
  const redisClient = await getRedisClient()
  await ensureConnected(redisClient)

  const storedData = await getStoredData(redisClient)
  const disabledApps = process.env.INFO_DISABLED_APPS?.split(',') ?? []

  const responses = await Promise.allSettled(
    endpoints
      .map(app => {
        if (disabledApps.includes(app.application)) {
          console.log(`Application info check disabled for ${app.application}`)
          return undefined
        }

        const url = getUrlForApp(app)

        if (!url) {
          console.log(`No url found for app: ${app.application}`)
          return undefined
        }

        return getApplicationInfo(app.application, url)
      })
      .filter(Boolean),
  )

  const newData = responses
    .map(response => {
      if (response.status !== 'fulfilled') {
        console.log(`Failed to get application info`, response.reason)
        return undefined
      }
      const { body, request } = response.value

      const applicationName = endpoints.find(
        app =>
          request?.url === (app.urlEnv ? `${process.env[app.urlEnv]}/info` : app.infoUrl[process.env.ENVIRONMENT_NAME]),
      )?.application
      if (!applicationName) return undefined

      if (!Array.isArray(body.activeAgencies)) {
        console.log(`Invalid activeAgencies value for ${applicationName}`, body.activeAgencies)
        return undefined
      }

      return {
        app: applicationName,
        activeAgencies: body.activeAgencies,
      }
    })
    .filter(Boolean)

  console.log(`Retrieved application info: ${JSON.stringify(newData)}`)

  // use new data if we have it for app, use stored data if we don't have it.
  // append any new apps not in stored data
  // if we have no stored data use new data for all
  const body = storedData
    ? storedData
        .map(stored => {
          const newApp = newData.find(newApp => newApp.app === stored.app)
          if (!newApp) return stored
          return newApp
        })
        .concat(newData.filter(newApp => !storedData.find(stored => stored.app === newApp.app)))
    : newData

  await cacheResponses(body, redisClient)
  await redisClient.destroy()
  process.exit()
}

module.exports = { getData }
