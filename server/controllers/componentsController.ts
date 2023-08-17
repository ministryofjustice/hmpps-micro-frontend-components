import config from '../config'
import { Services } from '../services'
import { CaseLoad } from '../interfaces/caseLoad'

export interface HeaderViewModel {
  caseLoads: CaseLoad[]
  isPrisonUser: boolean
  activeCaseLoad: CaseLoad
  changeCaseLoadLink: string
  component: string
}

export interface User {
  token: string
  authSource: 'nomis' | 'auth'
}

export default (services: Services): { getHeaderViewModel: (user: User) => Promise<HeaderViewModel> } => ({
  async getHeaderViewModel(user) {
    const { token, authSource } = user

    const isPrisonUser = authSource === 'nomis'
    const caseLoads = isPrisonUser ? await services.userService.getUserCaseLoads(token) : []
    return {
      caseLoads,
      isPrisonUser,
      activeCaseLoad: caseLoads.find(caseLoad => caseLoad.currentlyActive),
      changeCaseLoadLink: `${config.apis.dpsHomePageUrl}/change-caseload`,
      manageDetailsLink: `${config.apis.hmppsAuth.url}/account-details`,
      component: 'header',
      ingressUrl: config.ingressUrl,
    }
  },
})
