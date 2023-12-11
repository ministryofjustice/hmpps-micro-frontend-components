import { UserService } from '../services'
import componentsController from './componentsController'
import ContentfulService from '../services/contentfulService'
import config from '../config'
import { getTokenDataMock } from '../../tests/mocks/TokenDataMock'
import CacheService from '../services/cacheService'
import { UserData } from '../interfaces/UserData'
import { CaseLoad } from '../interfaces/caseLoad'

const defaultUserData: UserData = {
  caseLoads: [
    {
      caseLoadId: 'LEI',
      description: 'Leeds',
      type: '',
      caseloadFunction: '',
      currentlyActive: true,
    },
  ],
  activeCaseLoad: {
    caseLoadId: 'LEI',
    description: 'Leeds',
    type: '',
    caseloadFunction: '',
    currentlyActive: true,
  },
  services: [{ id: 'service', heading: 'Service', description: '', href: '/href' }],
}

const userServiceMock = {
  getUser: () => ({ name: 'User', activeCaseLoadId: 'LEI' }),
  getUserData: jest.fn().mockResolvedValue(defaultUserData),
} as undefined as jest.Mocked<UserService>

const cacheServiceMock = {
  getData: jest.fn(),
  setData: jest.fn(),
} as undefined as jest.Mocked<CacheService>

const contentfulServiceMock = {
  getManagedPages: () => [
    { href: 'url1', text: 'text1' },
    { href: 'url2', text: 'text2' },
  ],
} as undefined as ContentfulService

const controller = componentsController({
  userService: userServiceMock,
  contentfulService: contentfulServiceMock,
  cacheService: cacheServiceMock,
})
const defaultTokenData = getTokenDataMock()

afterEach(() => {
  jest.clearAllMocks()
})

const defaultHeaderViewModel = {
  activeCaseLoad: {
    caseLoadId: 'LEI',
    caseloadFunction: '',
    currentlyActive: true,
    description: 'Leeds',
    type: '',
  },
  caseLoads: [
    {
      caseLoadId: 'LEI',
      caseloadFunction: '',
      currentlyActive: true,
      description: 'Leeds',
      type: '',
    },
  ],
  changeCaseLoadLink: 'http://localhost:3001/change-caseload',
  component: 'header',
  ingressUrl: 'localhost',
  isPrisonUser: true,
  manageDetailsLink: 'http://localhost:9090/auth/account-details',
  dpsSearchLink: 'http://localhost:3001/prisoner-search',
  menuLink: 'http://localhost:3001#homepage-services',
  services: defaultUserData.services,
}

const defaultFooterViewModel = {
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
  services: defaultUserData.services,
}

const defaultMeta = {
  activeCaseLoad: {
    caseLoadId: 'LEI',
    caseloadFunction: '',
    currentlyActive: true,
    description: 'Leeds',
    type: '',
  },
  caseLoads: [
    {
      caseLoadId: 'LEI',
      caseloadFunction: '',
      currentlyActive: true,
      description: 'Leeds',
      type: '',
    },
  ],
  services: [
    {
      description: '',
      heading: 'Service',
      href: '/href',
      id: 'service',
    },
  ],
}

describe('getHeaderViewModel', () => {
  it('should return the HeaderViewModel', async () => {
    const output = await controller.getHeaderViewModel({
      ...defaultTokenData,
      authSource: 'nomis',
      token: 'token',
      roles: [],
    })
    expect(output).toEqual(defaultHeaderViewModel)
    expect(userServiceMock.getUserData).toBeCalledTimes(1)
  })

  it('should return empty caseload information if not a nomis user', async () => {
    const output = await controller.getHeaderViewModel({
      ...defaultTokenData,
      authSource: 'auth',
      token: 'token',
      roles: [],
    })
    expect(output).toEqual({
      caseLoads: [],
      changeCaseLoadLink: 'http://localhost:3001/change-caseload',
      component: 'header',
      ingressUrl: 'localhost',
      isPrisonUser: false,
      manageDetailsLink: 'http://localhost:9090/auth/account-details',
      dpsSearchLink: 'http://localhost:3001/prisoner-search',
      menuLink: 'http://localhost:3001#homepage-services',
      activeCaseLoad: null,
      services: [],
    })
  })

  describe('user data is passed in', () => {
    it('should use the data passed in and not call userService', async () => {
      config.contentfulFooterLinksEnabled = false
      const output = await controller.getHeaderViewModel(
        {
          ...defaultTokenData,
          authSource: 'nomis',
          token: 'token',
          roles: [],
        },
        defaultUserData,
      )
      expect(output).toEqual(defaultHeaderViewModel)
      expect(userServiceMock.getUserData).toBeCalledTimes(0)
    })
  })
})

describe('getFooterViewModel', () => {
  it('should return the FooterViewModel with links from contentful if flag is true', async () => {
    config.contentfulFooterLinksEnabled = true
    const output = await controller.getFooterViewModel({
      ...defaultTokenData,
      authSource: 'nomis',
      token: 'token',
      roles: [],
    })
    expect(output).toEqual({
      managedPages: [
        { href: 'url1', text: 'text1' },
        { href: 'url2', text: 'text2' },
      ],
      isPrisonUser: true,
      component: 'footer',
      services: defaultUserData.services,
    })
  })

  it('should return the FooterViewModel with default links if flag is false', async () => {
    config.contentfulFooterLinksEnabled = false
    const output = await controller.getFooterViewModel({
      ...defaultTokenData,
      authSource: 'nomis',
      token: 'token',
      roles: [],
    })
    expect(output).toEqual(defaultFooterViewModel)
    expect(userServiceMock.getUserData).toBeCalledTimes(1)
  })

  describe('user data is passed in', () => {
    it('should use the data passed in and not call userService', async () => {
      config.contentfulFooterLinksEnabled = false
      const output = await controller.getFooterViewModel(
        {
          ...defaultTokenData,
          authSource: 'nomis',
          token: 'token',
          roles: [],
        },
        defaultUserData,
      )
      expect(output).toEqual(defaultFooterViewModel)
      expect(userServiceMock.getUserData).toBeCalledTimes(0)
    })
  })
})

describe('getViewModels', () => {
  it('should get user data if nothing in cache', async () => {
    const output = await controller.getViewModels(['header', 'footer'], {
      ...defaultTokenData,
      authSource: 'nomis',
      token: 'token',
      roles: [],
    })

    expect(userServiceMock.getUserData).toBeCalledTimes(1)
    expect(output).toEqual({
      header: defaultHeaderViewModel,
      footer: defaultFooterViewModel,
      meta: defaultMeta,
    })
  })

  it('should use cache data if available', async () => {
    cacheServiceMock.getData.mockResolvedValueOnce(defaultUserData)

    const output = await controller.getViewModels(['header', 'footer'], {
      ...defaultTokenData,
      authSource: 'nomis',
      token: 'token',
      roles: [],
    })

    expect(cacheServiceMock.setData).toBeCalledTimes(0)
    expect(userServiceMock.getUserData).toBeCalledTimes(0)
    expect(output).toEqual({
      header: defaultHeaderViewModel,
      footer: defaultFooterViewModel,
      meta: defaultMeta,
    })
  })

  it('should set cache if caseloads count === 1', async () => {
    const userServiceResponse = {
      ...defaultUserData,
      caseLoads: [
        { caseloadFunction: '', caseLoadId: 'LEI', currentlyActive: true, description: 'Leeds (HMP)', type: '' },
      ],
    }
    userServiceMock.getUserData.mockResolvedValueOnce(userServiceResponse)

    await controller.getViewModels(['header', 'footer'], {
      ...defaultTokenData,
      authSource: 'nomis',
      token: 'token',
      roles: [],
    })

    expect(cacheServiceMock.setData).toBeCalledTimes(1)
    expect(cacheServiceMock.setData).toBeCalledWith('TOKEN_USER_meta_data', JSON.stringify(userServiceResponse))
  })

  it('should not set cache if caseloads count > 1', async () => {
    const userServiceResponse = {
      ...defaultUserData,
      caseLoads: [
        { caseloadFunction: '', caseLoadId: 'LEI', currentlyActive: true, description: 'Leeds (HMP)', type: '' },
        { caseloadFunction: '', caseLoadId: 'MDI', currentlyActive: false, description: 'Moorland (HMP)', type: '' },
      ],
    }
    userServiceMock.getUserData.mockResolvedValueOnce(userServiceResponse)

    await controller.getViewModels(['header', 'footer'], {
      ...defaultTokenData,
      authSource: 'nomis',
      token: 'token',
      roles: [],
    })

    expect(cacheServiceMock.setData).toBeCalledTimes(0)
  })

  it('should not set cache if caseloads count < 1', async () => {
    const userServiceResponse = {
      caseLoads: [] as CaseLoad[],
      activeCaseLoad: null as CaseLoad,
      services: [] as UserData['services'],
    }
    userServiceMock.getUserData.mockResolvedValueOnce(userServiceResponse)

    await controller.getViewModels(['header', 'footer'], {
      ...defaultTokenData,
      authSource: 'nomis',
      token: 'token',
      roles: [],
    })

    expect(cacheServiceMock.setData).toBeCalledTimes(0)
  })

  it('should work for single components, header', async () => {
    const output = await controller.getViewModels(['header'], {
      ...defaultTokenData,
      authSource: 'nomis',
      token: 'token',
      roles: [],
    })

    expect(output).toEqual({
      header: defaultHeaderViewModel,
      meta: defaultMeta,
    })
  })

  it('should work for single components, footer', async () => {
    const output = await controller.getViewModels(['footer'], {
      ...defaultTokenData,
      authSource: 'nomis',
      token: 'token',
      roles: [],
    })

    expect(output).toEqual({
      footer: defaultFooterViewModel,
      meta: defaultMeta,
    })
  })
})
