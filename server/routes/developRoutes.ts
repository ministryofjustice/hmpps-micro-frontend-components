import { Router } from 'express'
import { Services } from '../services'
import authorisationMiddleware from '../middleware/authorisationMiddleware'
import auth from '../authentication/auth'
import { AVAILABLE_COMPONENTS } from '../data/availableComponent'
import tokenVerifier from '../data/tokenVerification'
import type { AvailableComponent } from '../interfaces/externalContract'
import ComponentsController from '../controllers/componentsController'
import populateCurrentUser from '../middleware/populateCurrentUser'
import { ComponentRenderer } from '../services/componentRenderer'

export default function developRoutes(services: Services): Router {
  const router = Router()
  const controller = new ComponentsController(services.contentfulService)

  router.use(authorisationMiddleware())
  router.use(auth.authenticationMiddleware(tokenVerifier))

  router.get('/', (_req, res) => {
    res.render('pages/index', { components: AVAILABLE_COMPONENTS })
  })

  router.use(populateCurrentUser(services.userService))

  router.get('/all', async (_req, res) => {
    const renderer = new ComponentRenderer(res)
    const viewModels = await controller.getViewModels(AVAILABLE_COMPONENTS, res.locals.user)
    const renderedComponents: Record<AvailableComponent, string> = Object.fromEntries(
      await Promise.all(
        AVAILABLE_COMPONENTS.map(componentName =>
          renderer
            .renderComponent(viewModels[componentName])
            .then(renderedComponent => [componentName, renderedComponent.html]),
        ),
      ),
    )

    return res.render('pages/previewAll', renderedComponents)
  })

  router.get('/header', async (_req, res) => {
    const viewModel = await controller.getHeaderViewModel(res.locals.user)
    return res.render('pages/componentPreview', viewModel)
  })

  router.get('/footer', async (_req, res) => {
    const viewModel = await controller.getFooterViewModel(res.locals.user)
    return res.render('pages/componentPreview', viewModel)
  })

  return router
}
