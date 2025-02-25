import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { dataAccess } from '../data'
import UserService from './userService'
import ContentfulService from './contentfulService'
import config from '../config'
import { createRedisClient } from '../data/redisClient'
import CacheService from './cacheService'

export const services = () => {
  const { prisonApiClientBuilder } = dataAccess

  const apolloClient = new ApolloClient({
    cache: new InMemoryCache(),
    uri: `${config.contentful.host}/content/v1/spaces/${config.contentful.spaceId}/environments/${config.contentful.environment}`,
    headers: {
      Authorization: `Bearer ${config.contentful.accessToken}`,
    },
    ssrMode: true,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
      },
    },
  })

  const contentfulService = new ContentfulService(apolloClient)
  const cacheService = new CacheService(createRedisClient(), config.redis.cacheTimeout)
  const userService = new UserService(prisonApiClientBuilder, cacheService)

  return {
    userService,
    contentfulService,
    cacheService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
