import request from 'supertest'
import * as cheerio from 'cheerio'
import nock from 'nock'
import { NextFunction, Request } from 'express'
import config from '../config'
import createApp from '../app'
import { services } from '../services'
import ContentfulService from '../services/contentfulService'
import { getTokenDataMock } from '../../tests/mocks/TokenDataMock'

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

beforeEach(() => {
  authApi = nock(config.apis.hmppsAuth.url)

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
        const feedbackLink = $('a[href="https://eu.surveymonkey.com/r/FRZYGVQ?source=[source_value]"]')
        expect(feedbackLink.text()).toContain('Feedback')
      })
  })

  describe('auth', () => {
    it('should send 401 if no token provided', () => {
      return request(app).get('/footer').expect(401)
    })
  })
})
