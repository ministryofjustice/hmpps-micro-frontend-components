import request from 'supertest'
import * as cheerio from 'cheerio'
import nock from 'nock'
import { NextFunction, Request } from 'express'
import { App } from 'supertest/types'
import jwt from 'jsonwebtoken'
import config from '../config'
import createApp from '../app'
import type { Components } from '../interfaces/externalContract'
import { createRedisClient } from '../data/redisClient'
import { services } from '../services'
import ContentfulService from '../services/contentfulService'
import { getTokenDataMock } from '../../tests/mocks/TokenDataMock'

jest.mock('../applicationInfo', () => () => ({
  applicationName: 'test',
  buildNumber: '1',
  gitRef: 'long ref',
  gitShortHash: 'short ref',
  branchName: 'main',
}))

const redisClient = createRedisClient()
beforeAll(async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect()
  }
})

const prisonUserToken = jwt.sign(getTokenDataMock(), 'secret')
const externalUserToken = jwt.sign(getTokenDataMock({ auth_source: 'external' }), 'secret')

jest.mock('express-jwt', () => ({
  expressjwt: () => (req: Request, _res: Response, next: NextFunction) => {
    const token = req.headers['x-user-token']
    if (token !== prisonUserToken && token !== externalUserToken) {
      const error = new Error()
      error.name = 'UnauthorizedError'
      return next(error)
    }
    req.auth = getTokenDataMock({ auth_source: token === prisonUserToken ? 'nomis' : 'external' })
    return next()
  },
}))

const contentfulServiceMock = {
  getManagedPages: () => [
    { href: 'url1', text: 'text1' },
    { href: 'url2', text: 'text2' },
  ],
} as unknown as ContentfulService

let app: App

let hmppsAuth: nock.Scope
let allocationsApi: nock.Scope
let locationsApi: nock.Scope
let manageUsersApi: nock.Scope

beforeEach(async () => {
  await redisClient.del('TOKEN_USER_meta_data')

  allocationsApi = nock(config.apis.allocationsApi.url)
  allocationsApi.get('/prisons/LEI/staff/11111/job-classifications').reply(200, { policies: [] })
  locationsApi = nock(config.apis.locationsInsidePrisonApi.url)
  locationsApi.get('/locations/prison/LEI/residential-first-level').reply(200, [])
  manageUsersApi = nock(config.apis.manageUsersApi.url)
  manageUsersApi.get('/prisonusers/TOKEN_USER/caseloads').reply(200, {
    username: 'TOKEN_USER',
    active: true,
    accountType: '',
    activeCaseload: { id: 'LEI', name: 'Leeds', function: 'GENERAL' },
    caseloads: [{ id: 'LEI', name: 'Leeds', function: 'GENERAL' }],
  })
  hmppsAuth = nock(config.apis.hmppsAuth.url)
  hmppsAuth.post('/oauth/token').reply(200, {
    access_token: 'system-token',
    token_type: 'Bearer',
    expires_in: 5000,
  })

  app = createApp({ ...services(), contentfulService: contentfulServiceMock })
})

afterEach(() => {
  jest.resetAllMocks()
  nock.cleanAll()
})

describe('GET /components', () => {
  it('should return multiple components if requested', () => {
    return request(app)
      .get('/components?component=header&component=footer')
      .set('x-user-token', prisonUserToken)
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(res => {
        const body: Components = JSON.parse(res.text)

        const $header = cheerio.load(body.header.html)
        expect($header('.cdps-header__item--crest').text()).toContain('Digital Prison Services')
        expect(body.header.css).toEqual(['http://localhost:3000/assets/css/header.css'])
        expect(body.header.javascript).toEqual(['http://localhost:3000/assets/js/header.js'])

        const $footer = cheerio.load(body.footer.html)
        const feedbackLink = $footer('a[href="https://www.smartsurvey.co.uk/s/43EWY0/"]')
        expect(feedbackLink.text()).toContain('Feedback')
        expect(body.footer.css).toEqual(['http://localhost:3000/assets/css/footer.css'])
        expect(body.footer.javascript).toEqual([])
      })
  })

  it('should return one component if requested', () => {
    return request(app)
      .get('/components?component=footer')
      .set('x-user-token', prisonUserToken)
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(res => {
        const body: Components<'footer'> = JSON.parse(res.text)
        expect(body).not.toHaveProperty('header')
        expect(body).toHaveProperty('footer')
      })
  })

  it('should return empty object if no query params', () => {
    return request(app)
      .get('/components')
      .set('x-user-token', prisonUserToken)
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(res => {
        const body: object = JSON.parse(res.text)
        expect(body).toEqual({})
      })
  })

  it('should not matter the order of params', () => {
    return request(app)
      .get('/components?component=footer&component=header')
      .set('x-user-token', prisonUserToken)
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(res => {
        const body: Components = JSON.parse(res.text)
        const $header = cheerio.load(body.header.html)
        const $footer = cheerio.load(body.footer.html)

        expect($header('.cdps-header__item--crest').text()).toContain('Digital Prison Services')
        const feedbackLink = $footer('a[href="https://www.smartsurvey.co.uk/s/43EWY0/"]')
        expect(feedbackLink.text()).toContain('Feedback')
      })
  })

  it('should filter out undefined components', () => {
    return request(app)
      .get('/components?component=footer&component=golf')
      .set('x-user-token', prisonUserToken)
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(res => {
        const body: Components = JSON.parse(res.text)
        expect(body).not.toHaveProperty('header')
        expect(body).not.toHaveProperty('golf')
        expect(body.footer.html).toBeDefined()
      })
  })

  it('should use cached caseloads for second call', async () => {
    manageUsersApi.get('/prisonusers/TOKEN_USER/caseloads').reply(200, {
      username: 'TOKEN_USER',
      active: true,
      accountType: '',
      activeCaseload: { id: 'LEI', name: 'Leeds', function: 'GENERAL' },
      caseloads: [
        { id: 'LEI', name: 'Leeds', function: 'GENERAL' },
        { id: 'DEI', name: 'Deerbolt', function: 'GENERAL' },
      ],
    })

    // make first call with 1 caseload
    await request(app)
      .get('/components?component=header')
      .set('x-user-token', prisonUserToken)
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(res => {
        const body: Components<'header'> = JSON.parse(res.text)
        // 1 caseload so should not show switch
        expect(body.header.html).not.toContain('/change-caseload')
      })

    // make second call but would return 2 caseloads if not cached
    return request(app)
      .get('/components?component=header')
      .set('x-user-token', prisonUserToken)
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(res => {
        const body: Components<'header'> = JSON.parse(res.text)
        // 1 caseload so should not still show switch
        expect(body.header.html).not.toContain('/change-caseload')
      })
  })

  describe('should include meta information / shared data', () => {
    it('for external users', () => {
      return request(app)
        .get('/components?component=footer')
        .set('x-user-token', externalUserToken)
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(res => {
          const body: Components = JSON.parse(res.text)
          expect(body).toHaveProperty('meta')
          expect(body.meta.activeCaseLoad).toBeNull()
          expect(body.meta.cspDirectives).toHaveProperty('img-src')
          expect(body.meta.cspDirectives).not.toHaveProperty('form-action')
        })
    })

    it('for prison users', () => {
      return request(app)
        .get('/components?component=footer')
        .set('x-user-token', prisonUserToken)
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(res => {
          const body: Components = JSON.parse(res.text)
          expect(body).toHaveProperty('meta')
          expect(body.meta.activeCaseLoad.caseLoadId).toEqual('LEI')
          expect(body.meta.cspDirectives).toHaveProperty('form-action')
        })
    })
  })

  describe('auth', () => {
    it('should send 401 if no token provided', () => {
      return request(app).get('/components?component=footer').expect(401)
    })
  })
})
