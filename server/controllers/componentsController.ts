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

export const isPrisonUser = (user: User): boolean => {
  return user.authSource === 'nomis'
}

export default (services: Services): { getHeaderViewModel: (user: User) => Promise<HeaderViewModel> } => ({
  async getHeaderViewModel(user) {
    const { token } = user

    const caseLoads = isPrisonUser(user) ? await services.userService.getUserCaseLoads(token) : []
    return {
      caseLoads,
      isPrisonUser: isPrisonUser(user),
      activeCaseLoad: caseLoads.find(caseLoad => caseLoad.currentlyActive),
      changeCaseLoadLink: `${config.apis.dpsHomePageUrl}/change-caseload`,
      manageDetailsLink: `${config.apis.hmppsAuth.url}/account-details`,
      component: 'header',
      ingressUrl: config.ingressUrl,
    }
  },
})
