import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import nock from 'nock'
import { appWithAllRoutes } from './testutils/appSetup'
import { services } from '../services'
import config from '../config'

let app: Express
let prisonApi: nock.Scope
beforeEach(() => {
  prisonApi = nock(config.apis.prisonApi.url)
  app = appWithAllRoutes({ services: services() })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /header', () => {
  it('should render digital prison services title', () => {
    prisonApi.get('/api/users/me/caseLoads?allCaseloads=true').reply(200, [])
    return request(app)
      .get('/header')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('a[href="/"]').text()).toContain('Digital Prison Services')
      })
  })

  it('should render user management link', () => {
    prisonApi.get('/api/users/me/caseLoads?allCaseloads=true').reply(200, [])
    return request(app)
      .get('/header')
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
    prisonApi.get('/api/users/me/caseLoads?allCaseloads=true').reply(200, [])
    return request(app)
      .get('/header')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('a[href="/sign-out"]').text()).toEqual('Sign out')
      })
  })

  describe('case load switcher', () => {
    it('should display case load link if user has multiple caseloads', () => {
      prisonApi.get('/api/users/me/caseLoads?allCaseloads=true').reply(200, [
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
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($(`a[href="${config.apis.dpsHomePageUrl}/change-caseload"]`).text().trim()).toEqual('Leeds')
        })
    })

    it('should not display case load link if user has one caseload', () => {
      prisonApi.get('/api/users/me/caseLoads?allCaseloads=true').reply(200, [
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
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($(`a[href="${config.apis.dpsHomePageUrl}/change-caseload"]`).length).toEqual(0)
        })
    })
  })
})
