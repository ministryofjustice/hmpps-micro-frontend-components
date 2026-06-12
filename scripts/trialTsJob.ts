import { inspect } from 'node:util'
import { createClient, type RedisClientType } from 'redis'
import superagent from 'superagent'

// eslint-disable-next-line import/prefer-default-export
export async function main() {
  process.stderr.write('TRIAL TS JOB START\n')
  process.stderr.write(`ENVIRONMENT=${process.env.ENVIRONMENT}\n`)
  process.stderr.write(`ENVIRONMENT_NAME=${process.env.ENVIRONMENT_NAME}\n`)
  process.stderr.write(`SENTRY_ENVIRONMENT=${process.env.SENTRY_ENVIRONMENT}\n`)

  const redisClient = getRedisClient()
  await ensureConnected(redisClient)

  const storedData = await getStoredData(redisClient)
  process.stdout.write(`loaded ${storedData.length} items from redis\n`)

  const response = await getApplicationInfo('DPS', 'https://dps-dev.prison.service.justice.gov.uk/info')
  process.stdout.write(inspect(response.body))
  process.stdout.write('\n')

  process.stderr.write('TRIAL TS JOB END\n')
}

function getRedisClient(): RedisClientType {
  process.stderr.write('Creating redis client\n')
  const host = process.env.REDIS_HOST || 'localhost'
  const protocol = process.env.REDIS_TLS_ENABLED === 'true' ? 'rediss' : 'redis'
  const port = parseInt(process.env.REDIS_PORT, 10) || 6379
  return createClient({
    url: `${protocol}://${host}:${port}`,
    password: process.env.REDIS_AUTH_TOKEN,
    socket: {
      reconnectStrategy: attempts => {
        // Exponential back off: 20ms, 40ms, 80ms..., capped to retry every 30 seconds
        const nextDelay = Math.min(2 ** attempts * 20, 30000)
        process.stderr.write(`Retry Redis connection attempt: ${attempts}, next attempt in: ${nextDelay}ms\n`)
        return nextDelay
      },
    },
  })
    .on('connect', () => {
      process.stderr.write('Redis client is connecting\n')
    })
    .on('ready', () => {
      process.stderr.write('Redis client is ready for use\n')
    })
    .on('end', () => {
      process.stderr.write('Redis client connection closed\n')
    })
    .on('error', err => {
      process.stderr.write(`Redis error: ${err}\n`)
    })
}

async function ensureConnected(redisClient: RedisClientType): Promise<void> {
  if (!redisClient.isOpen) {
    await redisClient.connect()
  }
}

async function getStoredData(redisClient: RedisClientType): Promise<object[]> {
  const responseString = await redisClient.get('applicationInfo')
  process.stderr.write(`Previous stored application info: ${responseString}\n`)
  return JSON.parse(responseString as string)
}

function getApplicationInfo(appLabel: string, url: string): superagent.Request {
  process.stderr.write(`Calling superagent GET ${url}\n`)
  return superagent
    .get(url)
    .set('Accept', 'application/json')
    .retry(2, (_err, res) => {
      process.stderr.write(`Received status ${res?.status} from application info request for ${appLabel}\n`)
    })
}
