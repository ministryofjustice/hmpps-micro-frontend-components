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

  router.use((req, res, next) => {
    if (process.env.NODE_ENV === 'inttest') {
      req.auth = jwt.decode(req.headers['x-user-token'] as string)
      return next()
    }

    return requestIsAuthenticated()(req, res, next)
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

  /**
   * @swagger
   * /header:
   *   get:
   *     summary: Retrieve the header component html with links to the required CSS and JS
   *     deprecated: true
   *     parameters:
   *     - in: header
   *       name: x-user-token
   *       schema:
   *         type: string
   *       required: true
   *       description: The user token to identify the user
   *     responses:
   *       200:
   *         description: Stringified html for the header component
   *         content:
   *           application/json:
   *             schema:
   *                $ref: '#/components/schemas/Component'
   */
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

  /**
   * @swagger
   * /footer:
   *   get:
   *     summary: Retrieve the footer component html with links to the required CSS and JS
   *     deprecated: true
   *     parameters:
   *     - in: header
   *       name: x-user-token
   *       schema:
   *         type: string
   *       required: true
   *       description: The user token to identify the user
   *     responses:
   *       200:
   *         description: Stringified html for the footer component
   *         content:
   *           application/json:
   *             schema:
   *                $ref: '#/components/schemas/Component'
   */
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

  /**
   * @swagger
   * /components:
   *   get:
   *     summary: Retrieve html, css links and js links for the requested components. Includes user data in the response.
   *     description: Can return any number of existing components (currently 'header' and 'footer'). The user data is also returned in the response within the meta field containing case load information and accessible services.
   *     parameters:
   *       - in: query
   *         name: component
   *         schema:
   *           type: array
   *           items:
   *             type: string
   *         description: The component(s) to retrieve. Available components are 'header' and 'footer'
   *         required: true
   *         explode: true
   *         examples:
   *           header:
   *             value: header
   *             summary: Request the header component
   *           footer:
   *             value: footer
   *             summary: Request the footer component
   *           headerAndFooter:
   *             value: ['header', 'footer']
   *             summary: Request both the header and footer components
   *       - in: header
   *         name: x-user-token
   *         schema:
   *           type: string
   *         required: true
   *         description: The user token to identify the user
   *     responses:
   *       200:
   *         description: Object containing the requested components and user data
   *         content:
   *           application/json:
   *             schema:
   *                $ref: '#/components/schemas/Components'
   */
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

/**
 * @swagger
 * components:
 *   schemas:
 *     CaseLoad:
 *       type: object
 *       properties:
 *         caseLoadId:
 *           type: string
 *         description:
 *           type: string
 *         type:
 *           type: string
 *         caseloadFunction:
 *           type: string
 *         currentlyActive:
 *           type: string
 *
 *     Service:
 *       type: object
 *       properties:
 *         id: string
 *         heading: string
 *         description: string
 *         href: string
 *
 *     Component:
 *       type: object
 *       properties:
 *         html: string
 *         css:
 *           type: array
 *           items:
 *             type: string
 *         javascript:
 *           type: array
 *           items:
 *             type: string
 *
 *     Components:
 *       type: object
 *       properties:
 *         [component name]:
 *           $ref: '#/components/schemas/Component'
 *           description: Component name (header, footer) as the key with the component html and links to JS and CSS for the component
 *           example:
 *             html: <div>...</div>
 *             css: ['https://example.com/styles.css']
 *             javascript: ['https://example.com/scripts.js']
 *         meta:
 *           type: object
 *           description: Data about the user caseloads and services they have access to
 *           properties:
 *            activeCaseLoad:
 *              $ref: '#/components/schemas/CaseLoad'
 *            caseLoads:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/CaseLoad'
 *            services:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/Service'
 *       example:
 *         header:
 *           html: <div>...</div>
 *           css: ['https://example.com/header-styles.css']
 *           javascript: ['https://example.com/header-scripts.js']
 *         footer:
 *           html: <div>...</div>
 *           css: ['https://example.com/footer-styles.css']
 *           javascript: ['https://example.com/footer-scripts.js']
 *         meta: {
 *           activeCaseLoad: {
 *              caseLoadId: "FNI",
 *              description: "Full Sutton (HMP)",
 *              type: "INST",
 *              caseloadFunction: "GENERAL",
 *              currentlyActive: true
 *           },
 *           caseLoads: [
 *              {
 *                 caseLoadId: "FNI",
 *                 description: "Full Sutton (HMP)",
 *                 type: "INST",
 *                 caseloadFunction: "GENERAL",
 *                 currentlyActive: true
 *              },
 *           ],
 *           services: [
 *             {
 *               id: 'create-and-vary-a-licence',
 *               heading: 'Create and vary a licence',
 *               description: 'Create and vary standard determinate licences and post sentence supervision orders.',
 *               href: https://create-and-vary-a-licence-dev.hmpps.service.justice.gov.uk,
 *             }
 *           ]
 *         }
 */
