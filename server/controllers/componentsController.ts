import config from '../config'
import { ManagedPageLink } from '../interfaces/managedPage'
import { AvailableComponent } from '../@types/AvailableComponent'
import { HmppsUser, isPrisonUser, PrisonUserAccess } from '../interfaces/hmppsUser'
import { DEFAULT_USER_ACCESS } from '../services/userService'
import ContentfulService from '../services/contentfulService'

export interface HeaderViewModel {
  isPrisonUser: boolean
  changeCaseLoadLink: string
  component: string
  ingressUrl: string
  dpsSearchLink: string
  manageDetailsLink: string
  menuLink: string
}

export interface FooterViewModel {
  isPrisonUser: boolean
  managedPages: ManagedPageLink[]
  component: string
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

export default (
  contentfulService: ContentfulService,
): {
  getHeaderViewModel: (user: HmppsUser) => Promise<HeaderViewModel>
  getFooterViewModel: (user: HmppsUser) => Promise<FooterViewModel>
  getViewModels: (components: AvailableComponent[], user: HmppsUser) => Promise<ComponentsData>
} => ({
  async getHeaderViewModel(user: HmppsUser): Promise<HeaderViewModel> {
    return {
      isPrisonUser: isPrisonUser(user),
      changeCaseLoadLink: `${config.serviceUrls.dps.url}/change-caseload`,
      manageDetailsLink: `${config.apis.hmppsAuth.url}/account-details`,
      menuLink: `${config.serviceUrls.dps.url}#homepage-services`,
      component: 'header',
      ingressUrl: config.ingressUrl,
      dpsSearchLink: `${config.serviceUrls.dps.url}/prisoner-search`,
    }
  },

  async getFooterViewModel(user: HmppsUser): Promise<FooterViewModel> {
    const managedPages = config.contentfulFooterLinksEnabled
      ? await contentfulService.getManagedPages()
      : defaultFooterLinks

    return {
      managedPages,
      isPrisonUser: isPrisonUser(user),
      component: 'footer',
    }
  },

  async getViewModels(components: AvailableComponent[], user: HmppsUser) {
    const accessMethods = {
      header: this.getHeaderViewModel,
      footer: this.getFooterViewModel,
    }

    const viewModels = await Promise.all(
      components.map(component => accessMethods[component as AvailableComponent](user)),
    )

    return components.reduce<ComponentsData>(
      (output, componentName, index) => {
        return {
          ...output,
          [componentName]: viewModels[index],
        }
      },
      {
        meta:
          user.authSource === 'nomis'
            ? { caseLoads: user.caseLoads, activeCaseLoad: user.activeCaseLoad, services: user.services }
            : DEFAULT_USER_ACCESS,
      },
    )
  },
})

export type ComponentsData = Partial<Record<AvailableComponent, HeaderViewModel | FooterViewModel>> & {
  meta: PrisonUserAccess
}
