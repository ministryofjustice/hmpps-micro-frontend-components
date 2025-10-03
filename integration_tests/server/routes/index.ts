import { Router } from 'express'

import type { Services } from '../services'

export default function routes(_service: Services): Router {
  const router = Router()

  router.get('/', (_req, res) => {
    res.render('pages/index')
  })

  return router
}
