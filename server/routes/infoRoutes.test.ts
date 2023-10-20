import type { Express } from 'express'
import request from 'supertest'
import createApp from '../app'
import { services } from '../services'

let app: Express.Application

beforeEach(() => {
  app = createApp(services())
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /info', () => {
  it('should render index page', () => {
    return request(app)
      .get('/info')
      .expect('Content-Type', /application\/json/)
      .expect(res => {
        expect(res.text).toContain('productId')
      })
  })
})
