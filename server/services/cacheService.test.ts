import { RedisClient } from '../data/redisClient'
import CacheService from './cacheService'

const redisClient = {
  get: jest.fn(),
  set: jest.fn(),
  on: jest.fn(),
  connect: jest.fn(),
  isOpen: true,
} as unknown as jest.Mocked<RedisClient>

const service = new CacheService(redisClient, 600)

describe('CacheService', () => {
  describe('setData', () => {
    it('should set the data in redis', async () => {
      await service.setData('key', { key: 'value' })
      expect(redisClient.set).toHaveBeenCalledTimes(1)
      expect(redisClient.set).toHaveBeenCalledWith('key', '{"key":"value"}', { EX: 600 })
    })
  })

  describe('getData', () => {
    it('should set the data in redis', async () => {
      redisClient.get.mockResolvedValueOnce(JSON.stringify({ key: 'value' }))
      const result = await service.getData('key')

      expect(result).toEqual({ key: 'value' })
      expect(redisClient.get).toHaveBeenCalledTimes(1)
      expect(redisClient.get).toHaveBeenCalledWith('key')
    })
  })
})
