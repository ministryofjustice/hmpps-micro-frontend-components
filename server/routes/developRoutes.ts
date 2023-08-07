import { Router } from 'express'
import { Services } from '../services'
import config from '../config'
import asyncMiddleware from '../middleware/asyncMiddleware'
import setUpCurrentUser from '../middleware/setUpCurrentUser'
import populateSystemToken from '../middleware/populateSystemToken'
import authorisationMiddleware from '../middleware/authorisationMiddleware'
import { AVAILABLE_COMPONENTS } from '../@types/AvailableComponent'
import auth from '../authentication/auth'
import tokenVerifier from '../data/tokenVerification'

export default function developRoutes(services: Services): Router {
  const router = Router()

  router.use(authorisationMiddleware())
  router.use(auth.authenticationMiddleware(tokenVerifier))
  router.use(setUpCurrentUser(services))
  router.use(populateSystemToken())

  router.get('/', (req, res, next) => {
    res.render('pages/index', { components: AVAILABLE_COMPONENTS })
  })

  router.get(
    '/header',
    asyncMiddleware(async (req, res, next) => {
      const { systemToken } = res.locals
      const caseLoads = await services.userService.getUserCaseLoads(systemToken)

      return res.render('pages/componentPreview', {
        caseLoads,
        activeCaseLoad: caseLoads.find(caseLoad => caseLoad.currentlyActive),
        changeCaseLoadLink: `${config.apis.dpsHomePageUrl}/change-caseload`,
        component: 'header',
      })
    }),
  )

  router.get('/footer', (req, res, next) => {
    return res.render('pages/componentPreview', { component: 'footer' })
  })

  return router
}
