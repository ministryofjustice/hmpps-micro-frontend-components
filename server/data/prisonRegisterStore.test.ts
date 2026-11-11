import PrisonRegisterStore from './prisonRegisterStore'
import { RedisClient } from './redisClient'

const redisClient = {
  on: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  connect: jest.fn(),
}

const activePrisonIds = ['ASI', 'MDI']

describe('prisonRegisterStore', () => {
  let prisonRegisterStore: PrisonRegisterStore

  beforeEach(() => {
    prisonRegisterStore = new PrisonRegisterStore(redisClient as unknown as RedisClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('sets active prison IDs with a one day expiry', async () => {
    redisClient.set.mockResolvedValue('OK')

    await prisonRegisterStore.setActivePrisonIds(activePrisonIds)

    expect(redisClient.set).toHaveBeenCalledWith('activePrisonIds', JSON.stringify(activePrisonIds), {
      expiration: {
        type: 'EX',
        value: 86400,
      },
    })
  })

  it('gets active prison IDs from redis', async () => {
    redisClient.get.mockResolvedValue(JSON.stringify(activePrisonIds))

    const returnedPrisonIds = await prisonRegisterStore.getActivePrisonIds()

    expect(returnedPrisonIds).toStrictEqual(activePrisonIds)
    expect(redisClient.get).toHaveBeenCalledWith('activePrisonIds')
  })

  it('returns an empty array when there are no cached prison IDs', async () => {
    redisClient.get.mockResolvedValue(null)

    const returnedPrisonIds = await prisonRegisterStore.getActivePrisonIds()

    expect(returnedPrisonIds).toStrictEqual([])
    expect(redisClient.get).toHaveBeenCalledWith('activePrisonIds')
  })

  it('should not get active prison IDs given redis client throws an error', async () => {
    redisClient.get.mockRejectedValue('some error')

    await expect(prisonRegisterStore.getActivePrisonIds()).rejects.toBe('some error')
    expect(redisClient.get).toHaveBeenCalledWith('activePrisonIds')
  })
})
