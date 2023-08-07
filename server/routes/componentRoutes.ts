import { Router } from 'express'
import { Services } from '../services'
import config from '../config'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { isTokenValid } from '../data/tokenVerification'
import setUpCurrentUser from '../middleware/setUpCurrentUser'

export default function componentRoutes(services: Services): Router {
  const router = Router()

  router.use(async (req, res, next) => {
    const userToken = req.headers['x-user-token'] as string
    if (userToken && (await isTokenValid(userToken))) {
      res.locals.user = { token: userToken }
      return next()
    }
    return res.status(401).send('Unauthorised')
  })
  router.use(setUpCurrentUser(services))

  router.get(
    '/header',
    asyncMiddleware(async (req, res, next) => {
      const { token } = res.locals.user

      const caseLoads = await services.userService.getUserCaseLoads(token)
      res.render(
        'components/header',
        {
          caseLoads,
          activeCaseLoad: caseLoads.find(caseLoad => caseLoad.currentlyActive),
          changeCaseLoadLink: `${config.apis.dpsHomePageUrl}/change-caseload`,
        },
        (_, html) => {
          res.header('Content-Type', 'application/json')
          res.send(JSON.stringify({ html }))
        },
      )
    }),
  )

  router.get('/footer', (req, res, next) => {
    res.render('components/footer', {}, (_, html) => {
      res.header('Content-Type', 'application/json')
      res.send(JSON.stringify({ html }))
    })
  })

  return router
}
