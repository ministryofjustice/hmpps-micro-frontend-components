import request from 'supertest'
import * as cheerio from 'cheerio'
import nock from 'nock'
import { NextFunction, Request } from 'express'
import { services } from '../services'
import config from '../config'
import createApp from '../app'

jest.mock('express-jwt', () => ({
  expressjwt: () => (req: Request, res: Response, next: NextFunction) => {
    if (req.headers['x-user-token'] !== 'token') {
      const error = new Error()
      error.name = 'UnauthorizedError'
      return next(error)
    }
    req.auth = { user_name: 'USER1', name: 'User One', auth_source: 'nomis', authorities: [] }
    return next()
  },
}))

let app: Express.Application
let prisonApi: nock.Scope
let authApi: nock.Scope

beforeEach(() => {
  prisonApi = nock(config.apis.prisonApi.url)
  authApi = nock(config.apis.hmppsAuth.url)

  app = createApp(services())
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /header', () => {
  describe('basic components', () => {
    beforeEach(() => {
      prisonApi.get('/api/users/me/caseLoads').reply(200, [])
      authApi.get('/api/user/me').reply(200, { name: 'Test User', activeCaseLoadId: 'LEI' })
    })

    it('should render digital prison services title', () => {
      return request(app)
        .get('/header')
        .set('x-user-token', 'token')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(res => {
          const $ = cheerio.load(JSON.parse(res.text).html)
          expect($('a[href="/"]').text()).toContain('Digital Prison Services')
        })
    })

    it('should render user management link', () => {
      return request(app)
        .get('/header')
        .set('x-user-token', 'token')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(res => {
          const $ = cheerio.load(JSON.parse(res.text).html)
          const manageDetailsLink = $('a[href="/account-details"]')
          expect(manageDetailsLink.text()).toContain('T. User')
          expect(manageDetailsLink.text()).toContain('Manage your details')
        })
    })

    it('should render sign out link', () => {
      return request(app)
        .get('/header')
        .set('x-user-token', 'token')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(res => {
          const $ = cheerio.load(JSON.parse(res.text).html)
          expect($('a[href="/sign-out"]').text()).toEqual('Sign out')
        })
    })
  })

  describe('case load switcher', () => {
    beforeEach(() => {
      authApi.get('/api/user/me').reply(200, { name: 'Test User', activeCaseLoadId: 'LEI' })
    })

    it('should display case load link if user has multiple caseloads', () => {
      prisonApi.get('/api/users/me/caseLoads').reply(200, [
        {
          caseLoadId: 'LEI',
          description: 'Leeds',
          type: '',
          caseloadFunction: '',
          currentlyActive: true,
        },
        {
          caseLoadId: 'DEE',
          description: 'Deerbolt',
          type: '',
          caseloadFunction: '',
          currentlyActive: false,
        },
      ])
      return request(app)
        .get('/header')
        .set('x-user-token', 'token')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(res => {
          const $ = cheerio.load(JSON.parse(res.text).html)
          expect($(`a[href="${config.apis.dpsHomePageUrl}/change-caseload"]`).text().trim()).toEqual('Leeds')
        })
    })

    it('should not display case load link if user has one caseload', () => {
      prisonApi.get('/api/users/me/caseLoads').reply(200, [
        {
          caseLoadId: 'LEI',
          description: 'Leeds',
          type: '',
          caseloadFunction: '',
          currentlyActive: true,
        },
      ])
      return request(app)
        .get('/header')
        .set('x-user-token', 'token')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(res => {
          const $ = cheerio.load(JSON.parse(res.text).html)
          expect($(`a[href="${config.apis.dpsHomePageUrl}/change-caseload"]`).length).toEqual(0)
        })
    })
  })

  describe('auth', () => {
    it('should send 401 if no token provided', () => {
      return request(app).get('/header').expect(401)
    })
  })
})
