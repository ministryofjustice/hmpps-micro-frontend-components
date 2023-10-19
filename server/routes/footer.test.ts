import request from 'supertest'
import * as cheerio from 'cheerio'
import nock from 'nock'
import { NextFunction, Request } from 'express'
import config from '../config'
import createApp from '../app'
import { services } from '../services'
import ContentfulService from '../services/contentfulService'
import { getTokenDataMock } from '../../tests/mocks/TokenDataMock'
import { createRedisClient } from '../data/redisClient'

jest.mock('express-jwt', () => ({
  expressjwt: () => (req: Request, res: Response, next: NextFunction) => {
    if (req.headers['x-user-token'] !== 'token') {
      const error = new Error()
      error.name = 'UnauthorizedError'
      return next(error)
    }
    req.auth = getTokenDataMock()
    return next()
  },
}))

const contentfulServiceMock = {
  getManagedPages: () => [
    { href: 'url1', text: 'text1' },
    { href: 'url2', text: 'text2' },
  ],
} as undefined as ContentfulService

let app: Express.Application
let authApi: nock.Scope
let prisonApi: nock.Scope

const redisClient = createRedisClient()

async function ensureConnected() {
  if (!redisClient.isOpen) {
    await redisClient.connect()
  }
}
beforeEach(async () => {
  authApi = nock(config.apis.hmppsAuth.url)
  prisonApi = nock(config.apis.prisonApi.url)

  await ensureConnected()
  redisClient.del('TOKEN_USER_footer')

  app = createApp({ ...services(), contentfulService: contentfulServiceMock })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /footer', () => {
  it('should render a link to the feedback survey', () => {
    authApi.get('/api/user/me').reply(200, { name: 'Test User', activeCaseLoadId: 'LEI' })

    return request(app)
      .get('/footer')
      .set('x-user-token', 'token')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(res => {
        const $ = cheerio.load(JSON.parse(res.text).html)
        const feedbackLink = $('a[href="https://eu.surveymonkey.com/r/FRZYGVQ"]')
        expect(feedbackLink.text()).toContain('Feedback')
      })
  })

  describe('services links', () => {
    beforeEach(() => {
      prisonApi.get('/api/users/me/caseLoads').reply(200, [
        {
          caseLoadId: 'LEI',
          description: 'Leeds',
          type: '',
          caseloadFunction: '',
          currentlyActive: true,
        },
      ])
      prisonApi.get('/api/staff/11111/LEI/roles').reply(200, [{ role: 'KW' }])
      prisonApi.get('/api/users/me/locations').reply(200, [])
    })

    it('should display a list of services', () => {
      authApi.get('/api/user/me').reply(200, { name: 'Test User', activeCaseLoadId: 'LEI' })

      return request(app)
        .get('/footer')
        .set('x-user-token', 'token')
        .set('x-use-latest-features', 'true')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(res => {
          const $ = cheerio.load(JSON.parse(res.text).html)
          const serviceLinks = $('.connect-dps-common-footer__services-menu').find('a')
          expect(serviceLinks.length).toEqual(5)
        })
    })
  })

  describe('auth', () => {
    it('should send 401 if no token provided', () => {
      return request(app).get('/footer').expect(401)
    })
  })
})
