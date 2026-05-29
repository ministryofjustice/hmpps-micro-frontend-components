/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
import { AuthenticationClient, InMemoryTokenStore, RedisTokenStore } from '@ministryofjustice/hmpps-auth-clients'
import { systemTokenBuilder } from './hmppsAuthClient'
import { createRedisClient } from './redisClient'
import TokenStore from './tokenStore'
import config from '../config'
import AllocationsApiClient from './AllocationsApiClient'
import logger from '../../logger'
import LocationsInsidePrisonApiClient from './locationsInsidePrisonApiClient'
import ManageUsersApiClient from './manageUsersApiClient'
import PrisonApiClient from './prisonApiClient'
import applicationInfoSupplier from '../applicationInfo'

const applicationInfo = applicationInfoSupplier()

export const dataAccess = () => {
  const hmppsAuthClient = new AuthenticationClient(
    config.apis.hmppsAuth,
    logger,
    config.redis.enabled ? new RedisTokenStore(createRedisClient()) : new InMemoryTokenStore(),
  )

  return {
    allocationsApiClient: new AllocationsApiClient(hmppsAuthClient),
    manageUsersApiClient: new ManageUsersApiClient(hmppsAuthClient),
    locationsInsidePrisonApiClient: new LocationsInsidePrisonApiClient(hmppsAuthClient),
    prisonApiClient: new PrisonApiClient(hmppsAuthClient),
    getSystemToken: systemTokenBuilder(new TokenStore(createRedisClient())),
    applicationInfo,
  }
}

export type DataAccess = typeof dataAccess
