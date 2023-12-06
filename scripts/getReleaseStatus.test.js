const nock = require('nock')
const { getData } = require('./getReleaseStatus')
const { mockRedisClientMock } = require('redis')
jest.mock('redis', () => {
  const mockRedisClientMock = {
    set: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn().mockResolvedValue('OK'),
  }

  const createClientMock = jest.fn().mockReturnValue({
    on: jest.fn().mockReturnValue({
      connect: jest.fn().mockReturnValue(mockRedisClientMock),
    }),
  })

  return {
    createClient: createClientMock,
    mockRedisClientMock, // Export the mockRedisClientMock for access in tests
  }
})

describe('Get release status script', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    nock.cleanAll()
  })

  it('should get application info', async () => {
    const { mockRedisClientMock } = require('redis')
    const apiResponse = { some: 'stuff', activeAgencies: ['agency1', 'agency2'] }
    nock('https://manage-adjudications-api-dev.hmpps.service.justice.gov.uk').get('/info').reply(200, apiResponse)

    const result = await getData()

    expect(mockRedisClientMock.set).toHaveBeenCalledWith(
      'applicationInfo',
      JSON.stringify([{ app: 'adjudications', activeAgencies: ['agency1', 'agency2'] }]),
    )
    expect(result).toEqual('OK')
  })

  it('should throw if api errors', async () => {
    const { mockRedisClientMock } = require('redis')
    nock('https://manage-adjudications-api-dev.hmpps.service.justice.gov.uk').get('/info').reply(404)

    await expect(getData()).rejects.toThrow('Not Found')

    expect(mockRedisClientMock.set).toHaveBeenCalledTimes(0)
  })

  it('should not fail if it cant find the data in response', async () => {
    const { mockRedisClientMock } = require('redis')
    const apiResponse = { some: 'stuff' }
    nock('https://manage-adjudications-api-dev.hmpps.service.justice.gov.uk').get('/info').reply(200, apiResponse)

    const result = await getData()
    expect(mockRedisClientMock.set).toHaveBeenCalledWith(
      'applicationInfo',
      JSON.stringify([{ app: 'adjudications', activeAgencies: undefined }]),
    )
  })
})
