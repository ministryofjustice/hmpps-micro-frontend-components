const nock = require("nock")
const { getData } = require("./getReleaseStatus")
const { mockRedisClientMock } = require("redis")
jest.mock("redis", () => {
  const mockRedisClientMock = {
    set: jest.fn().mockResolvedValue("OK"),
    get: jest.fn().mockResolvedValue(null),
    disconnect: jest.fn().mockResolvedValue("OK"),
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

xdescribe("Get release status script", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    nock.cleanAll()
  })

  it("should get application info for all apps", async () => {
    const { mockRedisClientMock } = require("redis")
    const apiResponse = { some: "stuff", activeAgencies: ["agency1", "agency2"] }
    nock("https://manage-adjudications-api-dev.hmpps.service.justice.gov.uk").get("/info").reply(200, apiResponse)
    nock("https://activities-test.hmpps.service.justice.gov.uk").get("/info").reply(200, apiResponse)

    const result = await getData()

    expect(mockRedisClientMock.set).toHaveBeenCalledWith(
      "applicationInfo",
      JSON.stringify([
        { app: "adjudications", activeAgencies: ["agency1", "agency2"] },
        { app: "activities", activeAgencies: ["agency1", "agency2"] },
      ]),
    )
    expect(result).toEqual("OK")
  })

  it("should store the data it gets if others fail", async () => {
    const { mockRedisClientMock } = require("redis")
    const apiResponse = { some: "stuff", activeAgencies: ["agency1", "agency2"] }
    nock("https://manage-adjudications-api-dev.hmpps.service.justice.gov.uk").get("/info").reply(404)
    nock("https://activities-test.hmpps.service.justice.gov.uk").get("/info").reply(200, apiResponse)

    await getData()

    expect(mockRedisClientMock.set).toHaveBeenCalledWith(
      "applicationInfo",
      JSON.stringify([{ app: "activities", activeAgencies: ["agency1", "agency2"] }]),
    )
  })

  it("should not fail if it cant find the data in response", async () => {
    const { mockRedisClientMock } = require("redis")
    nock("https://manage-adjudications-api-dev.hmpps.service.justice.gov.uk").get("/info").reply(200, { some: "stuff" })
    nock("https://activities-test.hmpps.service.justice.gov.uk")
      .get("/info")
      .reply(200, { some: "stuff", activeAgencies: ["agency1", "agency2"] })

    const result = await getData()
    expect(mockRedisClientMock.set).toHaveBeenCalledWith(
      "applicationInfo",
      JSON.stringify([
        { app: "adjudications", activeAgencies: undefined },
        { app: "activities", activeAgencies: ["agency1", "agency2"] },
      ]),
    )
  })

  describe("when redis is available", () => {
    it("should use the stored data if it exists and no new data", async () => {
      const { mockRedisClientMock } = require("redis")
      nock("https://manage-adjudications-api-dev.hmpps.service.justice.gov.uk").get("/info").replyWithError("ERROR")
      nock("https://activities-test.hmpps.service.justice.gov.uk").get("/info").replyWithError("ERROR")
      const storedData = [{ app: "adjudications", activeAgencies: ["agency1", "agency2"] }]
      mockRedisClientMock.get.mockResolvedValue(JSON.stringify(storedData))

      await getData()

      expect(mockRedisClientMock.set).toHaveBeenCalledWith("applicationInfo", JSON.stringify(storedData))
    })

    it("should use the stored data for app if it exists and no new data", async () => {
      const { mockRedisClientMock } = require("redis")
      const storedData = [
        { app: "adjudications", activeAgencies: ["agency1", "agency2"] },
        { app: "activities", activeAgencies: ["agency1", "agency2"] },
      ]

      nock("https://manage-adjudications-api-dev.hmpps.service.justice.gov.uk").get("/info").replyWithError("ERROR")
      nock("https://activities-test.hmpps.service.justice.gov.uk")
        .get("/info")
        .reply(200, { some: "stuff", activeAgencies: ["agency1", "agency2"] })
      mockRedisClientMock.get.mockResolvedValue(JSON.stringify(storedData))

      await getData()

      expect(mockRedisClientMock.set).toHaveBeenCalledWith(
        "applicationInfo",
        JSON.stringify([
          { app: "adjudications", activeAgencies: ["agency1", "agency2"] },
          { app: "activities", activeAgencies: ["agency1", "agency2"] },
        ]),
      )
    })

    it("should use new app data if it does not exist on stored data", async () => {
      const { mockRedisClientMock } = require("redis")
      const storedData = [{ app: "adjudications", activeAgencies: ["agency1", "agency2"] }]

      nock("https://manage-adjudications-api-dev.hmpps.service.justice.gov.uk").get("/info").replyWithError("ERROR")
      nock("https://activities-test.hmpps.service.justice.gov.uk")
        .get("/info")
        .reply(200, { some: "stuff", activeAgencies: ["agency1", "agency2"] })
      mockRedisClientMock.get.mockResolvedValue(JSON.stringify(storedData))

      await getData()

      expect(mockRedisClientMock.set).toHaveBeenCalledWith(
        "applicationInfo",
        JSON.stringify([...storedData, { app: "activities", activeAgencies: ["agency1", "agency2"] }]),
      )
    })

    it("should replace the stored data for app with new data", async () => {
      const { mockRedisClientMock } = require("redis")
      const storedData = [{ app: "adjudications", activeAgencies: ["agency1", "agency2"] }]

      nock("https://manage-adjudications-api-dev.hmpps.service.justice.gov.uk")
        .get("/info")
        .reply(200, { activeAgencies: ["agency3", "agency4"] })
      nock("https://activities-test.hmpps.service.justice.gov.uk")
        .get("/info")
        .reply(200, { some: "stuff", activeAgencies: ["agency1", "agency2"] })
      mockRedisClientMock.get.mockResolvedValue(JSON.stringify(storedData))

      await getData()

      expect(mockRedisClientMock.set).toHaveBeenCalledWith(
        "applicationInfo",
        JSON.stringify([
          { app: "adjudications", activeAgencies: ["agency3", "agency4"] },
          { app: "activities", activeAgencies: ["agency1", "agency2"] },
        ]),
      )
    })
  })
})
