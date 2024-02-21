import { Router } from 'express'
import { Services } from '../services'
import asyncMiddleware from '../middleware/asyncMiddleware'
import authorisationMiddleware from '../middleware/authorisationMiddleware'
import { AVAILABLE_COMPONENTS } from '../@types/AvailableComponent'
import auth from '../authentication/auth'
import tokenVerifier from '../data/tokenVerification'
import componentsController from '../controllers/componentsController'
import populateCurrentUser from '../middleware/populateCurrentUser'

export default function developRoutes(services: Services): Router {
  const router = Router()
  const controller = componentsController(services)

  router.use(authorisationMiddleware())
  router.use(auth.authenticationMiddleware(tokenVerifier))

  router.get('/', (req, res, next) => {
    res.render('pages/index', { components: AVAILABLE_COMPONENTS })
  })

  router.get(
    '/header',
    populateCurrentUser(services.userService),
    asyncMiddleware(async (req, res, next) => {
      const viewModel = await controller.getHeaderViewModel(res.locals.user)
      return res.render('pages/componentPreview', viewModel)
    }),
  )

  router.get(
    '/footer',
    populateCurrentUser(services.userService),
    asyncMiddleware(async (req, res, next) => {
      const viewModel = await controller.getFooterViewModel(res.locals.user)
      return res.render('pages/componentPreview', viewModel)
    }),
  )

  return router
}
