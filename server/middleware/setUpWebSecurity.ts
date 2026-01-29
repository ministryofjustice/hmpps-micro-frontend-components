import express, { Router, Request, Response, NextFunction } from 'express'
import helmet from 'helmet'
import crypto from 'crypto'
import config from '../config'
import { connect } from 'http2'

export default function setUpWebSecurity(): Router {
  const router = express.Router()

  // Secure code best practice - see:
  // 1. https://expressjs.com/en/advanced/best-practice-security.html,
  // 2. https://www.npmjs.com/package/helmet
  router.use((_req: Request, res: Response, next: NextFunction) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('hex')
    next()
  })

  const swaggerUiInlineStyleHashes = [
    "'sha256-/jDKvbQ8cdux+c5epDIqkjHbXDaIY8RucT1PmAe8FG4='",
    "'sha256-ezdv1bOGcoOD7FKudKN0Y2Mb763O6qVtM8LT2mtanIU='",
    "'sha256-BeXIQk2DxxoDrgnnoH683KOnlwQvO0HH1fT4VFQTi8g='",
    "'sha256-RL3ie0nH+Lzz2YNqQN83mnU0J1ot4QL7b99vMdIX99w='",
  ]

  const azureDomains = ['https://northeurope-0.in.applicationinsights.azure.com', '*.monitor.azure.com']

  router.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          // This nonce allows us to use scripts with the use of the `cspNonce` local, e.g (in a Nunjucks template):
          // <script nonce="{{ cspNonce }}">
          // or
          // <link href="http://example.com/" rel="stylesheet" nonce="{{ cspNonce }}">
          // This ensures only scripts we trust are loaded, and not anything injected into the
          // page by an attacker.
          connectSrc: [
            "'self'",
            ...azureDomains,
          ],
          scriptSrc: ["'self'", (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`],
          styleSrc: [
            "'self'",
            (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`,
            "'unsafe-inline'",
            ...swaggerUiInlineStyleHashes,
            "'unsafe-hashes'", // needed to allow swagger inline SVG style
          ],
          fontSrc: ["'self'"],
          formAction: [`'self' ${config.apis.hmppsAuth.externalUrl} ${config.serviceUrls.dps.url}`],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  )
  return router
}
