import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { dataAccess } from '../data'
import UserService from './userService'
import ContentfulService from './contentfulService'
import config from '../config'
import { createRedisClient } from '../data/redisClient'
import ServicesService from './servicesService'
import CacheService from './cacheService'

export const services = () => {
  const { hmppsAuthClientBuilder, prisonApiClientBuilder } = dataAccess

  const userService = new UserService(hmppsAuthClientBuilder, prisonApiClientBuilder)

  const apolloClient = new ApolloClient({
    cache: new InMemoryCache(),
    uri: `${config.contentful.host}/content/v1/spaces/${config.contentful.spaceId}/environments/master`,
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
  const servicesService = new ServicesService()
  const cacheService = new CacheService(createRedisClient())

  return {
    userService,
    contentfulService,
    servicesService,
    cacheService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
