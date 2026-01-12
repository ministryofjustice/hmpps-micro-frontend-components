import jwt from 'jsonwebtoken'
import request from 'supertest'
import * as cheerio from 'cheerio'
import nock from 'nock'
import { NextFunction, Request } from 'express'
import { App } from 'supertest/types'
import { createRedisClient } from '../data/redisClient'
import { services } from '../services'
import config from '../config'
import createApp from '../app'
import { getTokenDataMock } from '../../tests/mocks/TokenDataMock'

jest.mock('../applicationInfo', () => () => ({
  applicationName: 'test',
  buildNumber: '1',
  gitRef: 'long ref',
  gitShortHash: 'short ref',
  branchName: 'main',
}))

const prisonUserToken = jwt.sign(getTokenDataMock(), 'secret')
const externalUserToken = jwt.sign(getTokenDataMock({ auth_source: 'external' }), 'secret')

jest.mock('express-jwt', () => ({
  expressjwt: () => (req: Request, res: Response, next: NextFunction) => {
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

let app: App
let prisonApi: nock.Scope
let allocationsApi: nock.Scope
let locationsApi: nock.Scope

const redisClient = createRedisClient()
async function ensureConnected() {
  if (!redisClient.isOpen) {
    await redisClient.connect()
  }
}

beforeEach(async () => {
  prisonApi = nock(config.apis.prisonApi.url)
  allocationsApi = nock(config.apis.allocationsApi.url)
  locationsApi = nock(config.apis.locationsInsidePrisonApi.url)

  nock(config.apis.hmppsAuth.url).post('/oauth/token').reply(200, {
    access_token: 'system-token',
    token_type: 'Bearer',
    expires_in: 5000,
  })

  await ensureConnected()
  redisClient.del('TOKEN_USER_meta_data')

  app = createApp(services())
})

afterEach(() => {
  nock.cleanAll()
  jest.resetAllMocks()
})

describe('GET /header', () => {
  describe('basic components', () => {
    beforeEach(() => {
      prisonApi.get('/api/staff/11111/caseloads').reply(200, [
        {
          caseLoadId: 'LEI',
          description: 'Leeds',
          type: '',
          caseloadFunction: 'GENERAL',
          currentlyActive: true,
        },
      ])
      prisonApi.get('/api/staff/11111/LEI/roles/KW').reply(200, 'true')
      locationsApi.get('/locations/prison/LEI/residential-first-level').reply(200, [])
      allocationsApi.get('/prisons/LEI/staff/11111/job-classifications').reply(200, { policies: [] })
    })

    it('should render digital prison services title', () => {
      return request(app)
        .get('/header')
        .set('x-user-token', prisonUserToken)
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(res => {
          const $ = cheerio.load(JSON.parse(res.text).html)
          expect(
            $('a[class="connect-dps-common-header__link connect-dps-common-header__title__organisation-name"]').text(),
          ).toContain('Digital Prison Services')
        })
    })

    it('should render user management link using data from token', () => {
      return request(app)
        .get('/header')
        .set('x-user-token', prisonUserToken)
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(res => {
          const $ = cheerio.load(JSON.parse(res.text).html)
          const manageDetailsLink = $(`a[href="${config.apis.hmppsAuth.url}/account-details"]`)
          expect(manageDetailsLink.text()).toContain('T. User')
        })
    })

    it('should render sign out link', () => {
      return request(app)
        .get('/header')
        .set('x-user-token', prisonUserToken)
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
      prisonApi.get('/api/staff/11111/LEI/roles/KW').reply(200, 'true')
      locationsApi.get('/locations/prison/LEI/residential-first-level').reply(200, [])
    })

    it('should display case load link if user has multiple caseloads', () => {
      prisonApi.get('/api/staff/11111/caseloads').reply(200, [
        {
          caseLoadId: 'LEI',
          description: 'Leeds',
          type: '',
          caseloadFunction: 'GENERAL',
          currentlyActive: true,
        },
        {
          caseLoadId: 'DEE',
          description: 'Deerbolt',
          type: '',
          caseloadFunction: 'GENERAL',
          currentlyActive: false,
        },
      ])
      return request(app)
        .get('/header')
        .set('x-user-token', prisonUserToken)
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(res => {
          const $ = cheerio.load(JSON.parse(res.text).html)
          expect($(`a[href="${config.serviceUrls.dps.url}/change-caseload"]`).text().trim()).toEqual('Leeds')
        })
    })

    it('should not display case load link if user has one caseload', () => {
      prisonApi.get('/api/staff/11111/caseloads').reply(200, [
        {
          caseLoadId: 'LEI',
          description: 'Leeds',
          type: '',
          caseloadFunction: 'GENERAL',
          currentlyActive: true,
        },
      ])
      return request(app)
        .get('/header')
        .set('x-user-token', prisonUserToken)
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(res => {
          const $ = cheerio.load(JSON.parse(res.text).html)
          expect($(`a[href="${config.serviceUrls.dps.url}/change-caseload"]`).length).toEqual(0)
        })
    })

    describe('caching', () => {
      it('should use cached caseloads the second time if 1 active caseload', async () => {
        prisonApi.get('/api/staff/11111/caseloads').reply(200, [
          {
            caseLoadId: 'LEI',
            description: 'Leeds',
            type: '',
            caseloadFunction: 'GENERAL',
            currentlyActive: true,
          },
        ])
        prisonApi.get('/api/staff/11111/caseloads').reply(200, [
          {
            caseLoadId: 'LEI',
            description: 'Leeds',
            type: '',
            caseloadFunction: 'GENERAL',
            currentlyActive: true,
          },
          {
            caseLoadId: 'DEE',
            description: 'Deerbolt',
            type: '',
            caseloadFunction: 'GENERAL',
            currentlyActive: false,
          },
        ])
        // make first call with 1 active caseload
        await request(app)
          .get('/header')
          .set('x-user-token', prisonUserToken)
          .expect(200)
          .expect('Content-Type', /json/)

        return request(app)
          .get('/header')
          .set('x-user-token', prisonUserToken)
          .expect(200)
          .expect('Content-Type', /json/)
          .expect(res => {
            const $ = cheerio.load(JSON.parse(res.text).html)
            // using 1 active caseload from first request
            expect($(`a[href="${config.serviceUrls.dps.url}/change-caseload"]`).length).toEqual(0)
          })
      })
    })
  })

  describe('non-prison user', () => {
    beforeEach(() => {
      prisonApi.get('/api/staff/11111/caseloads').reply(200, [
        {
          caseLoadId: 'LEI',
          description: 'Leeds',
          type: '',
          caseloadFunction: 'GENERAL',
          currentlyActive: true,
        },
      ])
      prisonApi.get('/api/staff/11111/LEI/roles').reply(200, 'true')
      locationsApi.get('/locations/prison/LEI/residential-first-level').reply(200, [])
    })

    it('should render external title', () => {
      return request(app)
        .get('/header')
        .set('x-user-token', externalUserToken)
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(res => {
          const $ = cheerio.load(JSON.parse(res.text).html)
          expect(
            $(
              `a[class="connect-dps-external-header__link connect-dps-external-header__title__service-name"][href="${config.apis.hmppsAuth.url}"]`,
            ).text(),
          ).toContain('Digital Services')

          expect($('a[href="/sign-out"]').text()).toEqual('Sign out')

          const manageDetailsLink = $(`a[href="${config.apis.hmppsAuth.url}/account-details"]`)
          expect(manageDetailsLink.length).toEqual(1)
          expect(manageDetailsLink.text()).toContain('T. User')
          expect(manageDetailsLink.text()).toContain('Manage your details')

          const caseloadSwitcher = $(`a[href="${config.serviceUrls.dps.url}/change-caseload"]`)
          expect(caseloadSwitcher.length).toEqual(0)
        })
    })

    it('should render manage details block', () => {
      return request(app)
        .get('/header')
        .set('x-user-token', externalUserToken)
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(res => {
          const $ = cheerio.load(JSON.parse(res.text).html)
          const manageDetailsLink = $(`a[href="${config.apis.hmppsAuth.url}/account-details"]`)
          expect(manageDetailsLink.length).toEqual(1)
          expect(manageDetailsLink.text()).toContain('T. User')
          expect(manageDetailsLink.text()).toContain('Manage your details')
        })
    })

    it('should render sign out', () => {
      return request(app)
        .get('/header')
        .set('x-user-token', externalUserToken)
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(res => {
          const $ = cheerio.load(JSON.parse(res.text).html)
          expect($('a[href="/sign-out"]').text()).toEqual('Sign out')
        })
    })

    it('should not render caseload switcher', () => {
      return request(app)
        .get('/header')
        .set('x-user-token', externalUserToken)
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(res => {
          const $ = cheerio.load(JSON.parse(res.text).html)

          const caseloadSwitcher = $(`a[href="${config.serviceUrls.dps.url}/change-caseload"]`)
          expect(caseloadSwitcher.length).toEqual(0)
        })
    })
  })

  describe('auth', () => {
    it('should send 401 if no token provided', () => {
      return request(app).get('/header').expect(401)
    })
  })
})
