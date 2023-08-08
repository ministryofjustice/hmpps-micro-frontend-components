import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import nock from 'nock'
import config from '../config'
import createApp from '../app'
import { services } from '../services'

let app: Express.Application
let tokenVerificationApi: nock.Scope
let authApi: nock.Scope
beforeEach(() => {
  tokenVerificationApi = nock(config.apis.tokenVerification.url)
  authApi = nock(config.apis.hmppsAuth.url)

  app = createApp(services())
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /footer', () => {
  it('should render a link to the open government licence', () => {
    tokenVerificationApi.post('/token/verify').reply(200, { active: true, username: 'TEST_USER' })
    authApi.get('/api/user/me').reply(200, { name: 'Test User', activeCaseLoadId: 'LEI' })

    return request(app)
      .get('/footer')
      .set('x-user-token', 'token')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(res => {
        const $ = cheerio.load(JSON.parse(res.text).html)
        const oglLink = $('a[href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"]')
        expect(oglLink.text()).toContain('Open Government Licence v3.0')
      })
  })

  describe('auth', () => {
    it('should send 401 if no token provided', () => {
      return request(app).get('/footer').expect(401)
    })

    it('should send 401 if token not valid', () => {
      tokenVerificationApi.post('/token/verify').reply(200, { active: false })
      return request(app).get('/footer').expect(401)
    })
  })
})
