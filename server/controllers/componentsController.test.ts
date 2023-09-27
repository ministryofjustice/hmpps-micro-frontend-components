import { UserService } from '../services'
import componentsController from './componentsController'
import ContentfulService from '../services/contentfulService'
import config from '../config'
import { getTokenDataMock } from '../../tests/mocks/TokenDataMock'

const userServiceMock = {
  getUser: () => ({ name: 'User', activeCaseLoadId: 'LEI' }),
  getUserCaseLoads: () => [
    {
      caseLoadId: 'LEI',
      description: 'Leeds',
      type: '',
      caseloadFunction: '',
      currentlyActive: true,
    },
  ],
} as undefined as UserService

const contentfulServiceMock = {
  getManagedPages: () => [
    { href: 'url1', text: 'text1' },
    { href: 'url2', text: 'text2' },
  ],
} as undefined as ContentfulService

const controller = componentsController({ userService: userServiceMock, contentfulService: contentfulServiceMock })
const defaultTokenData = getTokenDataMock()
describe('getHeaderViewModel', () => {
  it('should return the HeaderViewModel', async () => {
    const output = await controller.getHeaderViewModel({ ...defaultTokenData, authSource: 'nomis', token: 'token' })
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
    })
  })

  it('should return empty caseload information if not a nomis user', async () => {
    const output = await controller.getHeaderViewModel({ ...defaultTokenData, authSource: 'auth', token: 'token' })
    expect(output).toEqual({
      caseLoads: [],
      changeCaseLoadLink: 'http://localhost:3001/change-caseload',
      component: 'header',
      ingressUrl: 'localhost',
      isPrisonUser: false,
      manageDetailsLink: 'http://localhost:9090/auth/account-details',
    })
  })
})

describe('getFooterViewModel', () => {
  it('should return the FooterViewModel with links from contentful if flag is true', async () => {
    config.contentfulFooterLinksEnabled = true
    const output = await controller.getFooterViewModel({ ...defaultTokenData, authSource: 'nomis', token: 'token' })
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
    const output = await controller.getFooterViewModel({ ...defaultTokenData, authSource: 'nomis', token: 'token' })
    expect(output).toEqual({
      managedPages: [
        {
          href: `${config.dpsUrl}/accessibility-statement`,
          text: 'Accessibility statement',
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
      ],
      isPrisonUser: true,
      component: 'footer',
    })
  })
})
