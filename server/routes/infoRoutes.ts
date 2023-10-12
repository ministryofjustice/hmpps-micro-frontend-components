import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import config from '../config'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function infoRoutes(): Router {
  const router = Router()
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', (req, res) =>
    res.send({
      productId: config.productId,
    }),
  )

  return router
}
