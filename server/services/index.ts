import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { dataAccess } from '../data'
import UserService from './userService'
import ContentfulService from './contentfulService'
import config from '../config'
import { createRedisClient } from '../data/redisClient'

export const services = () => {
  const { hmppsAuthClientBuilder, prisonApiClientBuilder, applicationInfo } = dataAccess

  const userService = new UserService(hmppsAuthClientBuilder, prisonApiClientBuilder, createRedisClient())

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

  return {
    applicationInfo,
    userService,
    contentfulService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
