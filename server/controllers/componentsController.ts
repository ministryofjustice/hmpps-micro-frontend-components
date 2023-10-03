import config from '../config'
import { Services } from '../services'
import { CaseLoad } from '../interfaces/caseLoad'
import { ManagedPageLink } from '../interfaces/managedPage'
import { isApiUser, User } from '../@types/Users'

export interface HeaderViewModel {
  caseLoads: CaseLoad[]
  isPrisonUser: boolean
  activeCaseLoad: CaseLoad
  changeCaseLoadLink: string
  component: string
}

export interface FooterViewModel {
  isPrisonUser: boolean
  managedPages: ManagedPageLink[]
  component: string
}

export const isPrisonUser = (user: User): boolean => {
  return user.authSource === 'nomis'
}

const defaultFooterLinks: ManagedPageLink[] = [
  {
    href: `${config.dpsUrl}/accessibility-statement`,
    text: 'Accessibility',
  },
  {
    href: `${config.dpsUrl}/terms-and-conditions`,
    text: 'Terms and conditions',
  },
  {
    href: `${config.dpsUrl}/privacy-policy`,
    text: 'Privacy policy',
  },
  {
    href: `${config.dpsUrl}/cookies-policy`,
    text: 'Cookies policy',
  },
]

export default (
  services: Services,
): {
  getHeaderViewModel: (user: User) => Promise<HeaderViewModel>
  getFooterViewModel: (user: User) => Promise<FooterViewModel>
} => ({
  async getHeaderViewModel(user) {
    const { token } = user
    const username = isApiUser(user) ? user.user_name : user.username

    const caseLoads = isPrisonUser(user) ? await services.userService.getUserCaseLoads(token, username) : []
    return {
      caseLoads,
      isPrisonUser: isPrisonUser(user),
      activeCaseLoad: caseLoads.find(caseLoad => caseLoad.currentlyActive),
      changeCaseLoadLink: `${config.apis.digitalPrisonServiceUrl}/change-caseload`,
      manageDetailsLink: `${config.apis.hmppsAuth.url}/account-details`,
      component: 'header',
      ingressUrl: config.ingressUrl,
    }
  },
  async getFooterViewModel(user: User) {
    let managedPages: ManagedPageLink[] = defaultFooterLinks

    if (config.contentfulFooterLinksEnabled) {
      managedPages = await services.contentfulService.getManagedPages()
    }

    return {
      managedPages,
      isPrisonUser: isPrisonUser(user),
      component: 'footer',
    }
  },
})
