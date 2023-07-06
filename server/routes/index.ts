import { Router } from 'express'
import checkAvailableComponent, { AVAILABLE_COMPONENTS } from '../middleware/checkAvailableComponent'

export default function routes(): Router {
  const router = Router()

  router.get('/', (req, res, next) => {
    res.render('pages/index', { components: AVAILABLE_COMPONENTS })
  })

  router.get('/preview/:component', checkAvailableComponent, (req, res, next) => {
    const { component } = req.params
    res.render('pages/componentPreview', {
      component,
    })
  })

  router.get('/component/:component', checkAvailableComponent, (req, res, next) => {
    const { component } = req.params
    res.render(`components/${component}`)
  })

  return router
}
