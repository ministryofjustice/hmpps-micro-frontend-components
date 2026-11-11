import logger from '../../logger'
import { RedisClient } from './redisClient'

const ACTIVE_PRISON_IDS = 'activePrisonIds'

export default class PrisonRegisterStore {
  constructor(private readonly client: RedisClient) {
    client.on('error', error => {
      logger.error(error, 'Redis error')
    })
  }

  private async ensureConnected() {
    if (!this.client.isOpen) {
      await this.client.connect()
    }
  }

  async setActivePrisonIds(activePrisonIds: readonly string[], durationDays = 1): Promise<string> {
    await this.ensureConnected()
    return (
      await this.client.set(ACTIVE_PRISON_IDS, JSON.stringify(activePrisonIds), {
        expiration: {
          type: 'EX',
          value: durationDays * 24 * 60 * 60,
        },
      })
    )?.toString()
  }

  async getActivePrisonIds(): Promise<string[]> {
    await this.ensureConnected()
    const serializedActivePrisonIds = (await this.client.get(ACTIVE_PRISON_IDS))?.toString()
    return serializedActivePrisonIds ? (JSON.parse(serializedActivePrisonIds) as string[]) : []
  }
}
