import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import { dataAccess } from '../data'
import UserService from './userService'
import ContentfulService from './contentfulService'
import { ContentSecurityPolicyService } from './contentSecurityPolicyService'
import config from '../config'
import { createRedisClient } from '../data/redisClient'
import CacheService from './cacheService'

export const services = () => {
  const { allocationsApiClient, locationsInsidePrisonApiClient, manageUsersApiClient, prisonApiClient } = dataAccess()

  const apolloClient = new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: `${config.contentful.host}/content/v1/spaces/${config.contentful.spaceId}/environments/${config.contentful.environment}`,
      headers: {
        Authorization: `Bearer ${config.contentful.accessToken}`,
      },
    }),
    ssrMode: true,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
      },
    },
  })

  const contentfulService = new ContentfulService(apolloClient)
  const cacheService = new CacheService(createRedisClient(), config.redis.cacheTimeout)
  const userService = new UserService(
    allocationsApiClient,
    cacheService,
    locationsInsidePrisonApiClient,
    manageUsersApiClient,
    prisonApiClient,
  )
  const contentSecurityPoliciesService = new ContentSecurityPolicyService()

  return {
    userService,
    contentfulService,
    cacheService,
    contentSecurityPoliciesService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
