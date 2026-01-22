import componentsController, { FooterViewModel, HeaderViewModel, PrisonUserAccessMeta } from './componentsController'
import ContentfulService from '../services/contentfulService'
import config from '../config'
import { activeCaseLoadMock, hmppsUserMock, prisonUserMock, servicesMock } from '../../tests/mocks/hmppsUserMock'
import { DEFAULT_USER_ACCESS } from '../services/userService'

const contentfulServiceMock = {
  getManagedPages: () => [
    { href: 'url1', text: 'text1' },
    { href: 'url2', text: 'text2' },
  ],
} as undefined as ContentfulService

const controller = componentsController(contentfulServiceMock)

const expectedHeaderViewModel: HeaderViewModel = {
  component: 'header',
  ingressUrl: 'localhost',
  isPrisonUser: true,
  changeCaseLoadLink: 'http://localhost:3001/change-caseload',
  manageDetailsLink: 'http://localhost:9090/auth/account-details',
  dpsSearchLink: 'http://localhost:3001/prisoner-search',
  menuLink: 'http://localhost:3001#homepage-services',
}

const expectedFooterViewModel: FooterViewModel = {
  managedPages: [
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
  ],
  isPrisonUser: true,
  component: 'footer',
}

const expectedMeta: PrisonUserAccessMeta = {
  activeCaseLoad: activeCaseLoadMock,
  caseLoads: [activeCaseLoadMock],
  services: servicesMock,
  allocationJobResponsibilities: [],
}

describe('componentsController', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getHeaderViewModel', () => {
    it('should return the HeaderViewModel for a prison user', async () => {
      const output = await controller.getHeaderViewModel(prisonUserMock)
      expect(output).toEqual({ ...expectedHeaderViewModel, isPrisonUser: true })
    })

    it('should return the HeaderViewModel for a non-prison user', async () => {
      const output = await controller.getHeaderViewModel(hmppsUserMock)
      expect(output).toEqual({ ...expectedHeaderViewModel, isPrisonUser: false })
    })
  })

  describe('getFooterViewModel', () => {
    it('should return the FooterViewModel with links from contentful if flag is true', async () => {
      config.contentfulFooterLinksEnabled = true
      const output = await controller.getFooterViewModel(prisonUserMock)
      expect(output).toEqual({
        managedPages: [
          { href: 'url1', text: 'text1' },
          { href: 'url2', text: 'text2' },
        ],
        isPrisonUser: true,
        component: 'footer',
      })
    })

    it('should return the FooterViewModel with default links if flag is false', async () => {
      config.contentfulFooterLinksEnabled = false
      const output = await controller.getFooterViewModel(prisonUserMock)
      expect(output).toEqual(expectedFooterViewModel)
    })

    it('should return the FooterViewModel for non-prison users', async () => {
      config.contentfulFooterLinksEnabled = false
      const output = await controller.getFooterViewModel(hmppsUserMock)
      expect(output).toEqual({ ...expectedFooterViewModel, isPrisonUser: false })
    })
  })

  describe('getViewModels', () => {
    it('should get view models for prison users', async () => {
      const output = await controller.getViewModels(['header', 'footer'], prisonUserMock)

      expect(output).toEqual({
        header: expectedHeaderViewModel,
        footer: expectedFooterViewModel,
        meta: expectedMeta,
      })
    })

    it('should get view models for non-prison users', async () => {
      const output = await controller.getViewModels(['header', 'footer'], hmppsUserMock)

      expect(output).toEqual({
        header: { ...expectedHeaderViewModel, isPrisonUser: false },
        footer: { ...expectedFooterViewModel, isPrisonUser: false },
        meta: DEFAULT_USER_ACCESS,
      })
    })

    it('should work for single components, header', async () => {
      const output = await controller.getViewModels(['header'], prisonUserMock)

      expect(output).toEqual({
        header: expectedHeaderViewModel,
        meta: expectedMeta,
      })
    })

    it('should work for single components, footer', async () => {
      const output = await controller.getViewModels(['footer'], prisonUserMock)

      expect(output).toEqual({
        footer: expectedFooterViewModel,
        meta: expectedMeta,
      })
    })
  })
})
