import { Router } from 'express'
import { Services } from '../services'
import config from '../config'
import asyncMiddleware from '../middleware/asyncMiddleware'
import getUserPassport from '../middleware/getUserPassport'
import setUpCurrentUser from '../middleware/setUpCurrentUser'
import populateClientToken from '../middleware/populateClientToken'

export default function componentRoutes(services: Services): Router {
  const router = Router()

  router.use(getUserPassport(services))
  router.use(setUpCurrentUser(services))
  router.use(populateClientToken())

  router.get(
    '/header',
    asyncMiddleware(async (req, res, next) => {
      const userToken = req.headers['x-user-token'] as string
      const caseLoads = await services.userService.getUserCaseLoads(userToken)
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
