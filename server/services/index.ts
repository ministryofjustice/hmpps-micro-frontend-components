import { dataAccess } from '../data'
import UserService from './userService'

export const services = () => {
  const { hmppsAuthClientBuilder, prisonApiClientBuilder } = dataAccess

  const userService = new UserService(hmppsAuthClientBuilder, prisonApiClientBuilder)

  return {
    userService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
