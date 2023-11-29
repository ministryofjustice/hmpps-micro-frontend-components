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
]

function getApplicationInfo(url) {
  return superagent.get(url).set('Accept', 'application/json').retry(2).timeout(3000)
}

async function cacheResponses(body) {
  const client = await redis
    .createClient({
      url: `rediss://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
      password: process.env.REDIS_AUTH_TOKEN,
    })
    .on('error', err => console.log(`Redis Error ${err}`))
    .connect()

  const resp = await client.set('applicationInfo', JSON.stringify(body))
  await client.disconnect()

  return resp
}

const getData = async () => {
  const responses = await Promise.all(
    endpoints.map(app => getApplicationInfo(app.infoUrl[process.env.ENVIRONMENT_NAME])),
  )
  const body = responses.map(response => ({
    app: endpoints.find(app => response.request.url === app.infoUrl).application,
    activeAgencies: response.body.activeAgencies,
  }))

  return cacheResponses(body)
}

getData()
