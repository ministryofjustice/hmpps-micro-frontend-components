import config from '../config'
import type { AvailableComponent, SharedData, CaseLoad } from '../interfaces/externalContract'
import { type HmppsUser, isPrisonUser } from '../interfaces/hmppsUser'
import { ManagedPageLink } from '../interfaces/managedPage'
import ContentfulService from '../services/contentfulService'

export interface ViewModel {
  component: string
  isPrisonUser: boolean
  hasJavascript: boolean
}

export interface HeaderViewModel extends ViewModel {
  changeCaseLoadLink: string
  component: 'header'
  ingressUrl: string
  dpsSearchLink: string
  manageDetailsLink: string
  menuLink: string
}

export interface FooterViewModel extends ViewModel {
  component: 'footer'
  managedPages: ManagedPageLink[]
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

/** Empty meta information for non-prison users */
const defaultUserAccess = (): SharedData => ({
  caseLoads: [],
  activeCaseLoad: null,
  services: [],
  allocationJobResponsibilities: [],
  cspDirectives: {},
})

export default class {
  constructor(private readonly contentfulService: ContentfulService) {}

  async getHeaderViewModel(user: HmppsUser): Promise<HeaderViewModel> {
    return {
      isPrisonUser: isPrisonUser(user),
      ingressUrl: config.ingressUrl,
      changeCaseLoadLink: `${config.serviceUrls.newDps.url}/change-caseload`,
      dpsSearchLink: `${config.serviceUrls.oldDps.url}/prisoner-search`,
      manageDetailsLink: `${config.apis.hmppsAuth.url}/account-details`,
      menuLink: `${config.serviceUrls.newDps.url}#homepage-services`,
      component: 'header',
      hasJavascript: true,
    }
  }

  async getFooterViewModel(user: HmppsUser): Promise<FooterViewModel> {
    const managedPages = config.contentfulFooterLinksEnabled
      ? await this.contentfulService.getManagedPages()
      : defaultFooterLinks

    return {
      managedPages,
      isPrisonUser: isPrisonUser(user),
      component: 'footer',
      hasJavascript: false,
    }
  }

  async getViewModels(components: readonly AvailableComponent[], user: HmppsUser): Promise<ComponentsData> {
    const accessMethods = {
      header: this.getHeaderViewModel,
      footer: this.getFooterViewModel,
    }

    const viewModels = await Promise.all(components.map(component => accessMethods[component](user)))

    return components.reduce(
      (output, componentName, index) => {
        return {
          ...output,
          [componentName]: viewModels[index],
        }
      },
      {
        meta:
          user.authSource === 'nomis'
            ? {
                caseLoads: user.caseLoads.map<CaseLoad>(c => ({
                  caseLoadId: c.id,
                  description: c.name,
                  type: 'INST',
                  caseloadFunction: c.function,
                  currentlyActive: c.id === user.activeCaseLoad?.id,
                })),
                activeCaseLoad: (user.activeCaseLoad
                  ? {
                      caseLoadId: user.activeCaseLoad.id,
                      description: user.activeCaseLoad.name,
                      type: 'INST',
                      caseloadFunction: user.activeCaseLoad.function,
                      currentlyActive: true,
                    }
                  : null) satisfies CaseLoad | null,
                services: user.services,
                allocationJobResponsibilities: user.allocationJobResponsibilities,
                cspDirectives: {},
              }
            : defaultUserAccess(),
      },
    )
  }
}

export type ComponentsData = Partial<Record<AvailableComponent, HeaderViewModel | FooterViewModel>> & {
  meta: SharedData
}
