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

describe('GET /component/footer', () => {
  it('should render a link to the open government licence', () => {
    return request(app)
      .get('/component/footer')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const oglLink = $('a[href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"]')
        expect(oglLink.text()).toContain('Open Government Licence v3.0')
      })
  })
})
