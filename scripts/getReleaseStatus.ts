/* eslint-disable no-console */

import * as Sentry from '@sentry/node'
import superagent from 'superagent'
import redis from 'redis'
import { type ServiceActiveAgencies, ServiceName } from '../server/@types/activeAgencies'

let reportError: (message: string, context: Record<string, string>) => void = () => {}
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT,
    release: process.env.GIT_REF,
    sendDefaultPii: false,
  })
  Sentry.setTag('DPS.service', 'hmpps-micro-frontend-components-services')

  reportError = (message, context) => {
    Sentry.captureMessage(message, {
      level: 'error',
      contexts: {
        DPS: context,
      },
    })
  }
}

type Environment = 'dev' | 'preprod' | 'prod'
export type Endpoint = { application: ServiceName } & ({ urlEnv: string } | { infoUrl: Record<Environment, string> })

/**
 * List of services whose /info endpoint is periodically loaded and cached
 * to get the agencies/prisons in which they are enabled.
 *
 * Add definitions here:
 * - provide `urlEnv` to look up info url from environment variable
 * - or provide an environment-to-url map in `infoUrl`
 *
 * When using environment variables, also:
 * - Add urls to
 *   - `/helm_deploy/values-dev.yaml`
 *   - `/helm_deploy/values-preprod.yaml`
 *   - `/helm_deploy/values-prod.yaml`
 * - Add mapping to `/helm_deploy/hmpps-micro-frontend-components/templates/services-cronjob.yaml`
 */
export const endpoints: Endpoint[] = [
  {
    application: ServiceName.ADJUDICATION,
    infoUrl: {
      prod: 'https://manage-adjudications-api.hmpps.service.justice.gov.uk/info',
      preprod: 'https://manage-adjudications-api-preprod.hmpps.service.justice.gov.uk/info',
      dev: 'https://manage-adjudications-api-dev.hmpps.service.justice.gov.uk/info',
    },
  },
  { application: ServiceName.ACTIVITIES, urlEnv: 'ACTIVITIES_URL' },
  { application: ServiceName.CAS2, urlEnv: 'CAS2_URL' },
  { application: ServiceName.ALERTS, urlEnv: 'ALERTS_API_URL' },
  { application: ServiceName.CSIP, urlEnv: 'CSIP_API_URL' },
  { application: ServiceName.REPORTING, urlEnv: 'REPORTING_URL' },
  { application: ServiceName.RESIDENTIAL_LOCATIONS, urlEnv: 'RESIDENTIAL_LOCATIONS_API_URL' },
  { application: ServiceName.LEARNING_AND_WORK_PROGRESS, urlEnv: 'LEARNING_AND_WORK_PROGRESS_URL' },
  { application: ServiceName.WHEREABOUTS, urlEnv: 'WHEREABOUTS_API_URL' },
  { application: ServiceName.INCIDENT_REPORTING, urlEnv: 'INCIDENT_REPORTING_URL' },
  { application: ServiceName.CASE_NOTES, urlEnv: 'CASE_NOTES_API_URL' },
  { application: ServiceName.PREPARE_SOMEONE_FOR_RELEASE, urlEnv: 'PREPARE_SOMEONE_FOR_RELEASE_URL' },
  { application: ServiceName.CEMO, urlEnv: 'CEMO_URL' },
  { application: ServiceName.MANAGE_APPLICATIONS, urlEnv: 'MANAGE_APPLICATIONS_URL' },
  { application: ServiceName.ALLOCATE_KEY_WORKERS, urlEnv: 'ALLOCATE_KEY_WORKERS_API_URL' },
  { application: ServiceName.ALLOCATE_PERSONAL_OFFICERS, urlEnv: 'ALLOCATE_PERSONAL_OFFICERS_API_URL' },
  { application: ServiceName.EXTERNAL_MOVEMENTS, urlEnv: 'EXTERNAL_MOVEMENTS_API_URL' },
  { application: ServiceName.OFFICIAL_VISITS_API, urlEnv: 'OFFICIAL_VISITS_API_URL' },
  { application: ServiceName.COURT_APPEARANCE_SCHEDULER, urlEnv: 'COURT_APPEARANCE_SCHEDULER_API_URL' },
]

function getApplicationInfo(appLabel: string, url: string): superagent.Request {
  return superagent
    .get(url)
    .set('Accept', 'application/json')
    .retry(2, (_err, res) => {
      console.log(`Received status ${res?.status} from application info request for ${appLabel}`)
    })
}

type RedisClient = ReturnType<typeof redis.createClient>

function getRedisClient(): RedisClient {
  console.log('Creating redis client')
  const host = process.env.REDIS_HOST || 'localhost'
  const protocol = process.env.REDIS_TLS_ENABLED === 'true' ? 'rediss' : 'redis'
  const port = parseInt(process.env.REDIS_PORT, 10) || 6379
  return redis
    .createClient({
      url: `${protocol}://${host}:${port}`,
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
      console.error('Redis Error', err)
    })
}

async function ensureConnected(redisClient: RedisClient): Promise<void> {
  if (!redisClient.isOpen) {
    await redisClient.connect()
  }
}

async function cacheResponses(body: ServiceActiveAgencies[], redisClient: RedisClient): Promise<void> {
  await redisClient.set('applicationInfo', JSON.stringify(body))
  console.log('Successfully cached application info', body)
}

async function getStoredData(redisClient: RedisClient): Promise<ServiceActiveAgencies[]> {
  const responseString = await redisClient.get('applicationInfo')
  console.log(`Previous stored application info: ${responseString}`)
  return JSON.parse(responseString as string)
}

function getUrlForApp(appData: Endpoint): string | undefined {
  if ('urlEnv' in appData) {
    return process.env[appData.urlEnv] ? `${process.env[appData.urlEnv]}/info` : undefined
  }
  return appData.infoUrl[process.env.ENVIRONMENT as Environment]
}

export async function getData(): Promise<void> {
  const redisClient = getRedisClient()
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
          console.error(`No url found for app: ${app.application}`)
          reportError('No url found for app', { application: app.application })
          return undefined
        }

        return getApplicationInfo(app.application, url)
      })
      .filter(Boolean),
  )

  const newData: ServiceActiveAgencies[] = responses
    .map(response => {
      if (response.status !== 'fulfilled') {
        console.error('Failed to get application info', response.reason)
        reportError('Failed to get application info', {
          error: typeof response.reason === 'string' ? response.reason : JSON.stringify(response.reason),
        })
        return undefined
      }
      const { body, request } = response.value

      const applicationName = endpoints.find(
        app =>
          request?.url ===
          ('urlEnv' in app ? `${process.env[app.urlEnv]}/info` : app.infoUrl[process.env.ENVIRONMENT as Environment]),
      )?.application
      if (!applicationName) {
        console.error(`Cannot match response to application (${request?.url})`)
        reportError('Cannot match response to application', {
          request: request?.url,
        })
        return undefined
      }

      if (!Array.isArray(body.activeAgencies)) {
        console.error(`Invalid activeAgencies value for ${applicationName}`, body.activeAgencies)
        reportError('Invalid activeAgencies value', {
          activeAgencies: JSON.stringify(body.activeAgencies),
        })
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
        .map(storedApp => {
          const updatedApp = newData.find(newApp => newApp.app === storedApp.app)
          return updatedApp ?? storedApp
        })
        .concat(newData.filter(newApp => !storedData.find(stored => stored.app === newApp.app)))
    : newData

  await cacheResponses(body, redisClient)
  redisClient.destroy()
}

export default { getData }
