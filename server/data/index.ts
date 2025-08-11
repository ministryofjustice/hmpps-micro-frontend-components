/* eslint-disable import/first */
/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
import { AuthenticationClient, InMemoryTokenStore, RedisTokenStore } from '@ministryofjustice/hmpps-auth-clients'
import applicationInfoProvider from '../applicationInfo'
import { initialiseAppInsights, buildAppInsightsClient } from '../utils/azureAppInsights'

const applicationInfo = applicationInfoProvider()
initialiseAppInsights()
buildAppInsightsClient(applicationInfo)

import { systemTokenBuilder } from './hmppsAuthClient'
import { createRedisClient } from './redisClient'
import TokenStore from './tokenStore'
import config from '../config'
import PrisonApiClient from './prisonApiClient'
import AllocationsApiClient from './AllocationsApiClient'
import logger from '../../logger'

const hmppsAuthClient = new AuthenticationClient(
  config.apis.hmppsAuth,
  logger,
  config.redis.enabled ? new RedisTokenStore(createRedisClient()) : new InMemoryTokenStore(),
)

export const dataAccess = {
  prisonApiClient: new PrisonApiClient('Prison API', config.apis.prisonApi, logger, hmppsAuthClient),
  allocationsApiClient: new AllocationsApiClient(
    'Allocations API',
    config.apis.allocationsApi,
    logger,
    hmppsAuthClient,
  ),
  getSystemToken: systemTokenBuilder(new TokenStore(createRedisClient())),
  applicationInfo,
}
