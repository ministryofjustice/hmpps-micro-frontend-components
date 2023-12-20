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
]

function getApplicationInfo(url) {
  return superagent.get(url).set('Accept', 'application/json').retry(2)
}

function getRedisClient() {
  return redis
    .createClient({
      url: `rediss://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
      password: process.env.REDIS_AUTH_TOKEN,
    })
    .on('error', err => {
      console.log(`Redis Error`)
      throw new Error(err)
    })
    .connect()
}

async function cacheResponses(body) {
  const client = await getRedisClient()
  const resp = await client.set('applicationInfo', JSON.stringify(body))
  await client.disconnect()

  console.log(`Successfully cached application info`, body)
  return resp
}

async function getStoredData() {
  const client = await getRedisClient()
  const responseString = await client.get('applicationInfo')
  await client.disconnect()

  return JSON.parse(responseString)
}

const getData = async () => {
  const storedData = await getStoredData()

  const responses = await Promise.allSettled(
    endpoints.map(app =>
      getApplicationInfo(app.urlEnv ? `${process.env[app.urlEnv]}/info` : app.infoUrl[process.env.ENVIRONMENT_NAME]),
    ),
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

      return {
        app: applicationName,
        activeAgencies: body.activeAgencies,
      }
    })
    .filter(Boolean)

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

  return cacheResponses(body)
}

module.exports = { getData }
