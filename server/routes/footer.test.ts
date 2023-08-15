import request from 'supertest'
import * as cheerio from 'cheerio'
import nock from 'nock'
import { NextFunction, Request } from 'express'
import config from '../config'
import createApp from '../app'
import { services } from '../services'

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
let authApi: nock.Scope
beforeEach(() => {
  authApi = nock(config.apis.hmppsAuth.url)

  app = createApp(services())
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /footer', () => {
  it('should render a link to the open government licence', () => {
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
  })
})
