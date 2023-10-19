import { UserService } from '../services'
import componentsController, { HeaderViewModel } from './componentsController'
import ContentfulService from '../services/contentfulService'
import config from '../config'
import { getTokenDataMock } from '../../tests/mocks/TokenDataMock'
import CacheService from '../services/cacheService'
import { UserData } from '../interfaces/UserData'

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
describe('getHeaderViewModel', () => {
  it('should return the HeaderViewModel', async () => {
    const output = await controller.getHeaderViewModel({
      ...defaultTokenData,
      authSource: 'nomis',
      token: 'token',
      roles: [],
    })
    expect(output).toEqual({
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
      services: defaultUserData.services,
    })
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
      activeCaseLoad: null,
      services: [],
    })
  })

  describe('caching', () => {
    it('should return cached data if available', async () => {
      const redisResponse: HeaderViewModel = {
        caseLoads: [],
        changeCaseLoadLink: 'http://localhost:3001/change-caseload',
        component: 'header',
        ingressUrl: 'localhost',
        isPrisonUser: false,
        manageDetailsLink: 'http://localhost:9090/auth/account-details',
        dpsSearchLink: 'http://localhost:3001/prisoner-search',
        activeCaseLoad: null,
        services: [],
      }
      cacheServiceMock.getData.mockResolvedValueOnce(redisResponse)

      const output = await controller.getHeaderViewModel({
        ...defaultTokenData,
        authSource: 'nomis',
        token: 'token',
        roles: [],
      })

      expect(output).toEqual(redisResponse)
      expect(userServiceMock.getUserData).toBeCalledTimes(0)
    })

    it('should not set a cache value if caseloads count > 1', async () => {
      userServiceMock.getUserData.mockResolvedValueOnce({
        ...defaultUserData,
        caseLoads: [
          { caseloadFunction: '', caseLoadId: 'LEI', currentlyActive: true, description: 'Leeds (HMP)', type: '' },
          { caseloadFunction: '', caseLoadId: 'MDI', currentlyActive: false, description: 'Moorland (HMP)', type: '' },
        ],
      })
      await controller.getHeaderViewModel({
        ...defaultTokenData,
        authSource: 'nomis',
        token: 'token',
        roles: [],
      })

      expect(cacheServiceMock.setData).toBeCalledTimes(0)
    })

    it('should not set a cache value if caseloads count not greater than 1', async () => {
      await controller.getHeaderViewModel({
        ...defaultTokenData,
        authSource: 'nomis',
        token: 'token',
        roles: [],
      })

      expect(cacheServiceMock.setData).toBeCalledTimes(1)
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
    expect(output).toEqual({
      managedPages: [
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
      ],
      isPrisonUser: true,
      component: 'footer',
      services: defaultUserData.services,
    })
  })

  describe('caching', () => {
    it('should return cached data if available', async () => {
      const redisResponse: HeaderViewModel = {
        caseLoads: [],
        changeCaseLoadLink: 'http://localhost:3001/change-caseload',
        component: 'header',
        ingressUrl: 'localhost',
        isPrisonUser: false,
        manageDetailsLink: 'http://localhost:9090/auth/account-details',
        dpsSearchLink: 'http://localhost:3001/prisoner-search',
        activeCaseLoad: null,
        services: [],
      }
      cacheServiceMock.getData.mockResolvedValueOnce(redisResponse)

      const output = await controller.getFooterViewModel({
        ...defaultTokenData,
        authSource: 'nomis',
        token: 'token',
        roles: [],
      })

      expect(output).toEqual(redisResponse)
      expect(userServiceMock.getUserData).toBeCalledTimes(0)
    })

    it('should not set a cache value if caseloads count > 1', async () => {
      userServiceMock.getUserData.mockResolvedValueOnce({
        ...defaultUserData,
        caseLoads: [
          { caseloadFunction: '', caseLoadId: 'LEI', currentlyActive: true, description: 'Leeds (HMP)', type: '' },
          { caseloadFunction: '', caseLoadId: 'MDI', currentlyActive: false, description: 'Moorland (HMP)', type: '' },
        ],
      })
      await controller.getFooterViewModel({
        ...defaultTokenData,
        authSource: 'nomis',
        token: 'token',
        roles: [],
      })

      expect(cacheServiceMock.setData).toBeCalledTimes(0)
    })

    it('should not set a cache value if caseloads count not greater than 1', async () => {
      await controller.getFooterViewModel({
        ...defaultTokenData,
        authSource: 'nomis',
        token: 'token',
        roles: [],
      })

      expect(cacheServiceMock.setData).toBeCalledTimes(1)
    })
  })
})
