import { PrisonApiClient } from '../../server/data/interfaces/prisonApiClient'

// eslint-disable-next-line import/prefer-default-export
export const prisonApiClientMock = (): PrisonApiClient => ({
  getUserCaseLoads: jest.fn(),
})
