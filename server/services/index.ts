import { dataAccess } from '../data'
import UserService from './userService'

export const services = () => {
  const { hmppsAuthClientBuilder, prisonApiClientBuilder, centralSessionClientBuilder } = dataAccess

  const userService = new UserService(hmppsAuthClientBuilder, prisonApiClientBuilder, centralSessionClientBuilder)

  return {
    userService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
