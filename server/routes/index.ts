import { Router } from 'express'
import { AVAILABLE_COMPONENTS, type AvailableComponent } from '../@types/AvailableComponent'
import { Services } from '../services'
import config from '../config'
import asyncMiddleware from '../middleware/asyncMiddleware'

export default function routes(services: Services): Router {
  const router = Router()

  router.get('/', (req, res, next) => {
    res.render('pages/index', { components: AVAILABLE_COMPONENTS })
  })

  function getRenderComponentArgs(
    component: AvailableComponent,
    viewData = {},
    isPreview = false,
  ): [string, typeof viewData & { component?: AvailableComponent }] {
    return isPreview ? ['pages/componentPreview', { ...viewData, component }] : [`components/${component}`, viewData]
  }

  router.get(
    '/header',
    asyncMiddleware(async (req, res, next) => {
      const { preview } = req.query
      const { clientToken } = res.locals

      const caseLoads = await services.userService.getUserCaseLoads(clientToken)

      return res.render(
        ...getRenderComponentArgs(
          'header',
          {
            caseLoads,
            activeCaseLoad: caseLoads.find(caseLoad => caseLoad.currentlyActive),
            changeCaseLoadLink: `${config.apis.dpsHomePageUrl}/change-caseload`,
          },
          preview === 'true',
        ),
      )
    }),
  )

  router.get('/footer', (req, res, next) => {
    const { preview } = req.query

    return res.render(...getRenderComponentArgs('footer', {}, preview === 'true'))
  })

  return router
}
