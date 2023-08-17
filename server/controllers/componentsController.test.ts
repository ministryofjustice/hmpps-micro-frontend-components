import { UserService } from '../services'
import componentsController from './componentsController'

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

const controller = componentsController({ userService: userServiceMock })

describe('getHeaderViewModel', () => {
  it('should return the HeaderViewModel', async () => {
    const output = await controller.getHeaderViewModel({ authSource: 'nomis', token: 'token' })
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
    const output = await controller.getHeaderViewModel({ authSource: 'auth', token: 'token' })
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
