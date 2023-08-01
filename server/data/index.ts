/* eslint-disable import/first */
/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
import { initialiseAppInsights, buildAppInsightsClient } from '../utils/azureAppInsights'

initialiseAppInsights()
buildAppInsightsClient()

import HmppsAuthClient, { systemTokenBuilder } from './hmppsAuthClient'
import { createRedisClient } from './redisClient'
import TokenStore from './tokenStore'
import config, { ApiConfig } from '../config'
import RestClient, { RestClientBuilder as CreateRestClientBuilder } from './restClient'
import PrisonApiClient from './prisonApiClient'
import CentralSessionClient from './centralSessionClient'

type RestClientBuilder<T> = (token: string) => T

export default function restClientBuilder<T>(
  name: string,
  options: ApiConfig,
  constructor: new (client: RestClient) => T,
): RestClientBuilder<T> {
  const restClient = CreateRestClientBuilder(name, options)
  return token => new constructor(restClient(token))
}

export const dataAccess = {
  hmppsAuthClientBuilder: restClientBuilder<HmppsAuthClient>(
    'HMPPS AuthClient',
    config.apis.hmppsAuth,
    HmppsAuthClient,
  ),
  prisonApiClientBuilder: restClientBuilder<PrisonApiClient>('Prison API', config.apis.prisonApi, PrisonApiClient),
  centralSessionClientBuilder: restClientBuilder<CentralSessionClient>(
    'Central Session API',
    config.apis.session,
    CentralSessionClient,
  ),
  systemToken: systemTokenBuilder(new TokenStore(createRedisClient())),
}

export type DataAccess = typeof dataAccess

export { HmppsAuthClient, RestClientBuilder }
