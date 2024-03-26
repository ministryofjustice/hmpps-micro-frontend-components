import request from 'supertest'
import * as cheerio from 'cheerio'
import nock from 'nock'
import { NextFunction, Request } from 'express'
import { App } from 'supertest/types'
import config from '../config'
import createApp from '../app'
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

let app: App
let prisonApi: nock.Scope

beforeEach(() => {
  prisonApi = nock(config.apis.prisonApi.url)
  prisonApi.get('/api/users/me/caseLoads').reply(200, [])
  prisonApi.get('/api/users/me/locations').reply(200, [])
  app = createApp({ ...services(), contentfulService: contentfulServiceMock })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /components', () => {
  it('should return multiple components if requested', () => {
    return request(app)
      .get('/components?component=header&component=footer')
      .set('x-user-token', 'token')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(res => {
        const body = JSON.parse(res.text)

        const $header = cheerio.load(body.header.html)
        expect(
          $header(
            'a[class="connect-dps-common-header__link connect-dps-common-header__title__organisation-name"]',
          ).text(),
        ).toContain('Digital Prison Services')
        expect(body.header.css).toEqual(['localhost/assets/stylesheets/header.css'])
        expect(body.header.javascript).toEqual(['localhost/assets/js/header.js'])

        const $footer = cheerio.load(body.footer.html)
        const feedbackLink = $footer('a[href="https://eu.surveymonkey.com/r/HJTL6XS"]')
        expect(feedbackLink.text()).toContain('Feedback')
        expect(body.footer.css).toEqual(['localhost/assets/stylesheets/footer.css'])
        expect(body.footer.javascript).toEqual([])
      })
  })

  it('should return one component if requested', () => {
    return request(app)
      .get('/components?component=footer')
      .set('x-user-token', 'token')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(res => {
        const body = JSON.parse(res.text)
        expect(body.header).toBeUndefined()
        expect(body.footer).toBeDefined()
      })
  })

  it('should return empty object if no query params', () => {
    return request(app)
      .get('/components')
      .set('x-user-token', 'token')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(res => {
        const body = JSON.parse(res.text)
        expect(body).toEqual({})
      })
  })

  it('should not matter the order of params', () => {
    return request(app)
      .get('/components?component=footer&component=header')
      .set('x-user-token', 'token')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(res => {
        const body = JSON.parse(res.text)
        const $header = cheerio.load(body.header.html)
        const $footer = cheerio.load(body.footer.html)

        expect(
          $header(
            'a[class="connect-dps-common-header__link connect-dps-common-header__title__organisation-name"]',
          ).text(),
        ).toContain('Digital Prison Services')
        const feedbackLink = $footer('a[href="https://eu.surveymonkey.com/r/HJTL6XS"]')
        expect(feedbackLink.text()).toContain('Feedback')
      })
  })

  it('should filter out undefined components', () => {
    return request(app)
      .get('/components?component=footer&component=golf')
      .set('x-user-token', 'token')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(res => {
        const body = JSON.parse(res.text)
        expect(body.header).toBeUndefined()
        expect(body.golf).toBeUndefined()
        expect(body.footer.html).toBeDefined()
      })
  })

  describe('auth', () => {
    it('should send 401 if no token provided', () => {
      return request(app).get('/footer').expect(401)
    })
  })
})
