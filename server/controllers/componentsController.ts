import config from '../config'
import { Services } from '../services'
import { CaseLoad } from '../interfaces/caseLoad'
import { ManagedPageLink } from '../interfaces/managedPage'
import { isApiUser, User } from '../@types/Users'
import { Service } from '../interfaces/Service'

export interface HeaderViewModel {
  caseLoads: CaseLoad[]
  isPrisonUser: boolean
  activeCaseLoad: CaseLoad
  changeCaseLoadLink: string
  component: string
  ingressUrl: string
  dpsSearchLink: string
  services: Service[]
  manageDetailsLink: string
}

export interface FooterViewModel {
  isPrisonUser: boolean
  managedPages: ManagedPageLink[]
  component: string
  services: Service[]
}

export const isPrisonUser = (user: User): boolean => {
  return user.authSource === 'nomis'
}

const defaultFooterLinks: ManagedPageLink[] = [
  {
    href: `${config.serviceUrls.dps.url}/accessibility-statement`,
    text: 'Accessibility',
  },
  {
    href: `${config.serviceUrls.dps.url}/terms-and-conditions`,
    text: 'Terms and conditions',
  },
  {
    href: `${config.serviceUrls.dps.url}/privacy-policy`,
    text: 'Privacy policy',
  },
  {
    href: `${config.serviceUrls.dps.url}/cookies-policy`,
    text: 'Cookies policy',
  },
]

export default ({
  userService,
  contentfulService,
  cacheService,
}: Services): {
  getHeaderViewModel: (user: User) => Promise<HeaderViewModel>
  getFooterViewModel: (user: User) => Promise<FooterViewModel>
} => ({
  async getHeaderViewModel(user): Promise<HeaderViewModel> {
    const { token } = user
    const apiUser = isApiUser(user)
    const username = apiUser ? user.user_name : user.username
    const staffId = apiUser ? Number(user.user_id) : user.staffId
    const prisonUser = isPrisonUser(user)

    const cachedResponse = await cacheService.getData(`${username}_header`)
    if (cachedResponse) {
      return cachedResponse
    }

    const { caseLoads, activeCaseLoad, services } = prisonUser
      ? await userService.getUserData(token, staffId, user.roles)
      : { caseLoads: [], activeCaseLoad: null, services: [] }

    const payload = {
      caseLoads,
      isPrisonUser: isPrisonUser(user),
      activeCaseLoad,
      changeCaseLoadLink: `${config.serviceUrls.dps.url}/change-caseload`,
      manageDetailsLink: `${config.apis.hmppsAuth.url}/account-details`,
      component: 'header',
      ingressUrl: config.ingressUrl,
      dpsSearchLink: `${config.serviceUrls.dps.url}/prisoner-search`,
      services,
    }

    if (caseLoads.length <= 1) {
      await cacheService.setData(`${username}_header`, JSON.stringify(payload))
    }
    return payload
  },

  async getFooterViewModel(user: User): Promise<FooterViewModel> {
    const apiUser = isApiUser(user)
    const username = apiUser ? user.user_name : user.username
    const cachedResponse = await cacheService.getData(`${username}_footer`)
    if (cachedResponse) {
      return cachedResponse
    }

    const { token } = user
    const staffId = apiUser ? Number(user.user_id) : user.staffId
    const prisonUser = isPrisonUser(user)

    const managedPages = config.contentfulFooterLinksEnabled
      ? await contentfulService.getManagedPages()
      : defaultFooterLinks

    const { services, caseLoads }: { services: Service[]; caseLoads: CaseLoad[] } = prisonUser
      ? await userService.getUserData(token, staffId, user.roles)
      : { services: [], caseLoads: [] }

    const payload = {
      managedPages,
      isPrisonUser: prisonUser,
      component: 'footer',
      services,
    }

    if (caseLoads.length <= 1) {
      await cacheService.setData(`${username}_footer`, JSON.stringify(payload))
    }

    return payload
  },
})
