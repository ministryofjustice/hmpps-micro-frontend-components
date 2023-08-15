import { NextFunction, Request, Router, Response } from 'express'
import jwksRsa from 'jwks-rsa'
import { expressjwt, GetVerificationKey } from 'express-jwt'
import { Services } from '../services'
import config from '../config'
import asyncMiddleware from '../middleware/asyncMiddleware'
import setUpCurrentUser from '../middleware/setUpCurrentUser'

export default function componentRoutes(services: Services): Router {
  const router = Router()

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
          ingressUrl: config.ingressUrl,
        },
        (_, html) => {
          res.header('Content-Type', 'application/json')
          res.send(
            JSON.stringify({ html, css: [`${config.ingressUrl}/assets/stylesheets/header.css`], javascript: [] }),
          )
        },
      )
    }),
  )

  router.get('/footer', (req, res, next) => {
    res.render('components/footer', {}, (_, html) => {
      res.header('Content-Type', 'application/json')
      res.send(JSON.stringify({ html, css: [], javascript: [] }))
    })
  })

  router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err.name === 'UnauthorizedError') {
      res.status(401).send('Unauthorised')
    } else {
      next(err)
    }
  })

  return router
}
