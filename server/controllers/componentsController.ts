import { Response } from 'express'
import config from '../config'
import { Services } from '../services'
import { CaseLoad } from '../interfaces/caseLoad'

export interface HeaderViewMode {
  caseLoads: CaseLoad[]
  isPrisonUser: boolean
  activeCaseLoad: CaseLoad
  changeCaseLoadLink: string
  component: string
}

export default (services: Services): { getHeaderViewModel: (res: Response) => Promise<HeaderViewMode> } => ({
  async getHeaderViewModel(res) {
    const { token, authSource } = res.locals.user

    const isPrisonUser = authSource === 'nomis'
    const caseLoads = isPrisonUser ? await services.userService.getUserCaseLoads(token) : []
    return {
      caseLoads,
      isPrisonUser,
      activeCaseLoad: caseLoads.find(caseLoad => caseLoad.currentlyActive),
      changeCaseLoadLink: `${config.apis.dpsHomePageUrl}/change-caseload`,
      manageDetailsLink: `${config.apis.hmppsAuth.url}/account-details`,
      component: 'header',
    }
  },
})
