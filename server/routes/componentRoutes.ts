import { NextFunction, Request, Response, Router } from 'express'
import jwksRsa from 'jwks-rsa'
import { expressjwt, GetVerificationKey } from 'express-jwt'
import { Services } from '../services'
import config from '../config'
import asyncMiddleware from '../middleware/asyncMiddleware'
import populateCurrentUser from '../middleware/populateCurrentUser'
import componentsController from '../controllers/componentsController'

export default function componentRoutes(services: Services): Router {
  const router = Router()
  const controller = componentsController(services)

  const requestIsAuthenticated = () => {
    return expressjwt({
      secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${config.apis.hmppsAuth.url}/.well-known/jwks.json`,
      }) as GetVerificationKey,
      issuer: `${config.apis.hmppsAuth.url}/issuer`,
      algorithms: ['RS256'],
      getToken: req => req.headers['x-user-token'] as string,
    })
  }

  router.use(requestIsAuthenticated())

  router.get(
    '/header',
    populateCurrentUser(services.userService),
    asyncMiddleware(async (req, res, next) => {
      const viewModel = await controller.getHeaderViewModel(res.locals.user)

      res.render('components/header', viewModel, (_, html) => {
        res.header('Content-Type', 'application/json')
        res.send(JSON.stringify({ html, css: [`${config.ingressUrl}/assets/stylesheets/header.css`], javascript: [] }))
      })
    }),
  )

  router.get(
    '/footer',
    populateCurrentUser(services.userService),
    asyncMiddleware(async (req, res, next) => {
      const viewModel = await controller.getFooterViewModel(res.locals.user)

      res.render('components/footer', viewModel, (_, html) => {
        res.header('Content-Type', 'application/json')
        res.send(JSON.stringify({ html, css: [`${config.ingressUrl}/assets/stylesheets/footer.css`], javascript: [] }))
      })
    }),
  )

  router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err.name === 'UnauthorizedError') {
      res.status(401).send('Unauthorised')
    } else {
      next(err)
    }
  })

  return router
}
