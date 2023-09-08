import { NextFunction, Request, Response, Router } from 'express'
import jwksRsa from 'jwks-rsa'
import { expressjwt, GetVerificationKey } from 'express-jwt'
import { Services } from '../services'
import config from '../config'
import asyncMiddleware from '../middleware/asyncMiddleware'
import populateCurrentUser from '../middleware/populateCurrentUser'
import componentsController from '../controllers/componentsController'
import { AvailableComponent } from '../@types/AvailableComponent'
import Component from '../@types/Component'

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

  async function getHeaderResponseBody(res: Response): Promise<Component> {
    const viewModel = await controller.getHeaderViewModel(res.locals.user)

    return new Promise(resolve => {
      res.render('components/header', viewModel, (_, html) => {
        resolve({
          html,
          css: [`${config.ingressUrl}/assets/stylesheets/header.css`],
          javascript: [],
        })
      })
    })
  }

  async function getFooterResponseBody(res: Response): Promise<Component> {
    const viewModel = await controller.getFooterViewModel(res.locals.user)
    return new Promise(resolve => {
      res.render('components/footer', viewModel, (_, html) => {
        resolve({
          html,
          css: [`${config.ingressUrl}/assets/stylesheets/footer.css`],
          javascript: [],
        })
      })
    })
  }

  router.get(
    '/header',
    populateCurrentUser(services.userService),
    asyncMiddleware(async (req, res, next) => {
      const response = await getHeaderResponseBody(res)
      res.send(response)
    }),
  )

  router.get(
    '/footer',
    populateCurrentUser(services.userService),
    asyncMiddleware(async (req, res, next) => {
      const response = await getFooterResponseBody(res)
      res.send(response)
    }),
  )

  router.get(
    '/components',
    populateCurrentUser(services.userService),
    asyncMiddleware(async (req, res, next) => {
      const componentMethods: Record<AvailableComponent, (r: Response) => Promise<Component>> = {
        header: getHeaderResponseBody,
        footer: getFooterResponseBody,
      }

      const componentsRequested = [req.query.component]
        .flat()
        .filter(component => componentMethods[component as AvailableComponent]) as AvailableComponent[]

      const renders = await Promise.all(
        componentsRequested.map(component => componentMethods[component as AvailableComponent](res)),
      )

      const responseBody = componentsRequested.reduce<Partial<Record<AvailableComponent, Component>>>(
        (output, componentName, index) => {
          return {
            ...output,
            [componentName]: renders[index],
          }
        },
        {},
      )

      res.send(responseBody)
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
