import { Router } from 'express'
import { Services } from '../services'
import authorisationMiddleware from '../middleware/authorisationMiddleware'
import { AVAILABLE_COMPONENTS } from '../@types/AvailableComponent'
import auth from '../authentication/auth'
import tokenVerifier from '../data/tokenVerification'
import ComponentsController from '../controllers/componentsController'
import populateCurrentUser from '../middleware/populateCurrentUser'

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
    const [header, footer] = await Promise.all([
      controller.getHeaderViewModel(res.locals.user).then(
        viewModel =>
          new Promise<string>((resolve, reject) => {
            res.render('components/header.njk', viewModel, (error, html) => (error ? reject(error) : resolve(html)))
          }),
      ),
      controller.getFooterViewModel(res.locals.user).then(
        viewModel =>
          new Promise<string>((resolve, reject) => {
            res.render('components/footer.njk', viewModel, (error, html) => (error ? reject(error) : resolve(html)))
          }),
      ),
    ])
    return res.render('pages/previewAll', { header, footer })
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
