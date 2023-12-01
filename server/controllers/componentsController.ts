import config from '../config'
import { type Services } from '../services'
import { CaseLoad } from '../interfaces/caseLoad'
import { ManagedPageLink } from '../interfaces/managedPage'
import { isApiUser, User } from '../@types/Users'
import { Service } from '../interfaces/Service'
import { AvailableComponent } from '../@types/AvailableComponent'
import { UserData } from '../interfaces/UserData'

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
  menuLink: string
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
    href: `${config.serviceUrls.newDps.url}/accessibility-statement`,
    text: 'Accessibility',
  },
  {
    href: `${config.serviceUrls.newDps.url}/terms-and-conditions`,
    text: 'Terms and conditions',
  },
  {
    href: `${config.serviceUrls.newDps.url}/privacy-policy`,
    text: 'Privacy policy',
  },
  {
    href: `${config.serviceUrls.newDps.url}/cookies-policy`,
    text: 'Cookies policy',
  },
]

export default ({
  userService,
  contentfulService,
  cacheService,
}: Services): {
  getHeaderViewModel: (user: User, userData?: UserData) => Promise<HeaderViewModel>
  getFooterViewModel: (user: User, userData?: UserData) => Promise<FooterViewModel>
  getViewModels: (components: AvailableComponent[], user: User) => Promise<ComponentsData>
} => ({
  async getHeaderViewModel(user, preAccessedUserData?: UserData): Promise<HeaderViewModel> {
    const { caseLoads, activeCaseLoad, services } = isPrisonUser(user)
      ? preAccessedUserData ?? (await userService.getUserData(user))
      : { caseLoads: [], activeCaseLoad: null, services: [] }

    return {
      caseLoads,
      isPrisonUser: isPrisonUser(user),
      activeCaseLoad,
      changeCaseLoadLink: `${config.serviceUrls.dps.url}/change-caseload`,
      manageDetailsLink: `${config.apis.hmppsAuth.url}/account-details`,
      menuLink: `${config.serviceUrls.dps.url}#homepage-services`,
      component: 'header',
      ingressUrl: config.ingressUrl,
      dpsSearchLink: `${config.serviceUrls.dps.url}/prisoner-search`,
      services,
    }
  },

  async getFooterViewModel(user: User, preAccessedUserData?: UserData): Promise<FooterViewModel> {
    const managedPages = config.contentfulFooterLinksEnabled
      ? await contentfulService.getManagedPages()
      : defaultFooterLinks

    const userData = preAccessedUserData ?? (await userService.getUserData(user))

    return {
      managedPages,
      isPrisonUser: isPrisonUser(user),
      component: 'footer',
      services: userData.services,
    }
  },

  async getViewModels(components: AvailableComponent[], user: User) {
    const accessMethods = {
      header: this.getHeaderViewModel,
      footer: this.getFooterViewModel,
    }
    const apiUser = isApiUser(user)
    const username = apiUser ? user.user_name : user.username

    const cachedResponse = await cacheService.getData<UserData>(`${username}_meta_data`)

    const userData = cachedResponse ?? (await userService.getUserData(user))
    if (!cachedResponse && userData.caseLoads.length <= 1) {
      await cacheService.setData(`${username}_meta_data`, JSON.stringify(userData))
    }

    const viewModels = await Promise.all(
      components.map(component => accessMethods[component as AvailableComponent](user, userData)),
    )

    return components.reduce<ComponentsData>(
      (output, componentName, index) => {
        return {
          ...output,
          [componentName]: viewModels[index],
        }
      },
      { meta: userData },
    )
  },
})

export type ComponentsData = Partial<Record<AvailableComponent, HeaderViewModel | FooterViewModel>> & {
  meta: UserData
}
