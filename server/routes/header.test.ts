import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /component/header', () => {
  it('should render digital prison services title', () => {
    return request(app)
      .get('/component/header')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('a[href="/"]').text()).toContain('Digital Prison Services')
      })
  })

  it('should render user management link', () => {
    return request(app)
      .get('/component/header')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const manageDetailsLink = $('a[href="/account-details"]')
        expect(manageDetailsLink.text()).toContain('F. Last')
        expect(manageDetailsLink.text()).toContain('Manage your details')
      })
  })

  it('should render sign out link', () => {
    return request(app)
      .get('/component/header')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('a[href="/sign-out"]').text()).toEqual('Sign out')
      })
  })
})
