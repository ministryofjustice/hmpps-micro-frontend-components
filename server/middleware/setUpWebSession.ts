import { v4 as uuidv4 } from 'uuid'
import express, { Router } from 'express'
import { hmppsSessionBuilder } from '@ministryofjustice/hmpps-central-session'
import { createRedisClient } from '../data/redisClient'
import config from '../config'
import logger from '../../logger'

export default function setUpWebSession(): Router {
  const client = createRedisClient()
  client.connect().catch((err: Error) => logger.error(`Error connecting to Redis`, err))

  const options = {
    cookie: { secure: config.https, maxAge: config.session.expiryMinutes * 60 * 1000 },
    sessionSecret: config.session.secret,
    sharedSessionApi: {
      baseUrl: config.apis.session.url,
      token: 'TODO',
    },
  }

  const sessionBuilder = hmppsSessionBuilder(client, options, logger)

  const router = express.Router()
  router.use((req, res, next) => {
    sessionBuilder(req.query.sessionServiceName?.toString() || 'undefined-session-name')(req, res, next)
  })

  // Update a value in the cookie so that the set-cookie will be sent.
  // Only changes every minute so that it's not sent with every request.
  router.use((req, res, next) => {
    req.session.nowInMinutes = Math.floor(Date.now() / 60e3)
    next()
  })

  router.use((req, res, next) => {
    const headerName = 'X-Request-Id'
    const oldValue = req.get(headerName)
    const id = oldValue === undefined ? uuidv4() : oldValue

    res.set(headerName, id)
    req.id = id

    next()
  })

  return router
}
