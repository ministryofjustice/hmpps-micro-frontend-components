import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger, { warnLevelLogger } from '../../logger'

export type PrisonRegisterPrison = {
  prisonId: string
  active: boolean
}

export default class PrisonRegisterApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super(
      'Prison Register API',
      config.apis.prisonRegisterApi,
      config.production ? warnLevelLogger : logger,
      authenticationClient,
    )
  }

  async getAllPrisons(): Promise<PrisonRegisterPrison[]> {
    return this.get<PrisonRegisterPrison[]>({ path: '/prisons' }, asSystem())
  }
}
