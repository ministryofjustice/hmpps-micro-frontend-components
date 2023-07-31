import express from 'express'

import createError from 'http-errors'

import path from 'path'
import nunjucksSetup from './utils/nunjucksSetup'
import errorHandler from './errorHandler'
import { metricsMiddleware } from './monitoring/metricsApp'

import setUpCsrf from './middleware/setUpCsrf'
import setUpCurrentUser from './middleware/setUpCurrentUser'
import setUpHealthChecks from './middleware/setUpHealthChecks'
import setUpStaticResources from './middleware/setUpStaticResources'
import setUpWebRequestParsing from './middleware/setupRequestParsing'
import setUpWebSecurity from './middleware/setUpWebSecurity'

import routes from './routes'
import type { Services } from './services'
import populateClientToken from './middleware/populateClientToken'
import getToken from './middleware/getToken'

export default function createApp(services: Services): express.Application {
  const app = express()

  app.set('json spaces', 2)
  app.set('trust proxy', true)
  app.set('port', process.env.PORT || 3000)

  app.use(metricsMiddleware)
  app.use(setUpHealthChecks())
  app.use(setUpWebSecurity())
  // app.use(setUpWebSession())
  app.use(getToken())
  app.use(setUpWebRequestParsing())
  app.use(setUpStaticResources())
  nunjucksSetup(app, path)
  // app.use(setUpAuthentication())
  // app.use(authorisationMiddleware())
  app.use(setUpCsrf())
  app.use(populateClientToken())
  app.use(setUpCurrentUser(services))

  app.use(routes(services))

  app.use((req, res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(process.env.NODE_ENV === 'production'))

  return app
}
