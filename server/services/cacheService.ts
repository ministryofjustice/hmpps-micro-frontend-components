import logger from '../../logger'
import { RedisClient } from '../data/redisClient'

export default class CacheService {
  constructor(private readonly redisClient: RedisClient) {}

  private async ensureConnected() {
    if (!this.redisClient.isOpen) {
      await this.redisClient.connect()
    }
  }

  public async setData(key: string, data: string) {
    try {
      await this.ensureConnected()
      return await this.redisClient.set(key, data, { EX: 600 })
    } catch (error) {
      logger.error(error.stack, `Error calling redis`)
      return ''
    }
  }

  public async getData(key: string) {
    try {
      await this.ensureConnected()
      const redisData = await this.redisClient.get(key)
      if (!redisData) return null

      return JSON.parse(redisData)
    } catch (error) {
      logger.error(error.stack, `Error calling redis`)
      return null
    }
  }
}