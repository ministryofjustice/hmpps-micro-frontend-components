import { NextFunction, Request, Response, Router } from 'express'
import jwksRsa from 'jwks-rsa'
import { expressjwt, GetVerificationKey } from 'express-jwt'
import jwt from 'jsonwebtoken'
import { Services } from '../services'
import config from '../config'
import asyncMiddleware from '../middleware/asyncMiddleware'
import populateCurrentUser from '../middleware/populateCurrentUser'
import componentsController, {
  ComponentsData,
  FooterViewModel,
  HeaderViewModel,
} from '../controllers/componentsController'
import { AvailableComponent } from '../@types/AvailableComponent'
import Component from '../@types/Component'

export default function componentRoutes(services: Services): Router {
  const router = Router()
  const controller = componentsController(services)

  router.use((req, res, next) => {
    if (process.env.NODE_ENV === 'inttest') {
      req.auth = jwt.decode(req.headers['x-user-token'] as string)
      next()
    } else {
      expressjwt({
        secret: jwksRsa.expressJwtSecret({
          cache: true,
          rateLimit: true,
          cacheMaxAge: 604800000, // a week
          jwksRequestsPerMinute: 2,
          jwksUri: `${config.apis.hmppsAuth.url}/.well-known/jwks.json`,
        }) as GetVerificationKey,
        issuer: `${config.apis.hmppsAuth.url}/issuer`,
        algorithms: ['RS256'],
        getToken: reqInternal => reqInternal.headers['x-user-token'] as string,
      })(req, res, next)
    }
  })

  async function getHeaderResponseBody(
    res: Response,
    latestFeatures: boolean,
    viewModelCached?: HeaderViewModel,
  ): Promise<Component> {
    const viewModel = viewModelCached ?? (await controller.getViewModels(['header'], res.locals.user)).header
    const javascript = latestFeatures ? [`${config.ingressUrl}/assets/js/header.js`] : []

    return new Promise(resolve => {
      res.render('components/header', { ...viewModel, latestFeatures }, (_, html) => {
        resolve({
          html,
          css: [`${config.ingressUrl}/assets/stylesheets/header.css`],
          javascript,
        })
      })
    })
  }

  async function getFooterResponseBody(
    res: Response,
    latestFeatures: boolean,
    viewModelCached?: FooterViewModel,
  ): Promise<Component> {
    const viewModel = viewModelCached ?? (await controller.getViewModels(['footer'], res.locals.user)).footer
    return new Promise(resolve => {
      res.render('components/footer', { ...viewModel, latestFeatures }, (_, html) => {
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
      const response = await getHeaderResponseBody(
        res,
        config.environmentReleased || req.headers['x-use-latest-features'] === 'true',
      )
      res.send(response)
    }),
  )

  router.get(
    '/footer',
    populateCurrentUser(services.userService),
    asyncMiddleware(async (req, res, next) => {
      const response = await getFooterResponseBody(
        res,
        config.environmentReleased || req.headers['x-use-latest-features'] === 'true',
      )
      res.send(response)
    }),
  )

  router.get(
    '/components',
    populateCurrentUser(services.userService),
    asyncMiddleware(async (req, res, next) => {
      const componentMethods: Record<
        AvailableComponent,
        (r: Response, latestFeatures: boolean, cachedViewModel: HeaderViewModel | FooterViewModel) => Promise<Component>
      > = {
        header: getHeaderResponseBody,
        footer: getFooterResponseBody,
      }

      const componentsRequested = [req.query.component]
        .flat()
        .filter(component => componentMethods[component as AvailableComponent]) as AvailableComponent[]

      if (!componentsRequested.length) return res.send({})
      const viewModels = await controller.getViewModels(componentsRequested, res.locals.user)

      const renders = await Promise.all(
        componentsRequested.map(component =>
          componentMethods[component as AvailableComponent](
            res,
            config.environmentReleased || req.headers['x-use-latest-features'] === 'true',
            viewModels[component],
          ),
        ),
      )

      const responseBody = componentsRequested.reduce<
        Partial<Record<AvailableComponent, Component>> & { meta: ComponentsData['meta'] }
      >(
        (output, componentName, index) => {
          return {
            ...output,
            [componentName]: renders[index],
          }
        },
        { meta: viewModels.meta },
      )

      return res.send(responseBody)
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
