import { dataAccess } from '../data'
import UserService from './userService'
import ComponentsService from './ComponentsService'

export const services = () => {
  const { applicationInfo, manageUsersApiClient, componentsClient } = dataAccess()

  const userService = new UserService(manageUsersApiClient)
  const feComponentsService = new ComponentsService(componentsClient)

  return {
    applicationInfo,
    userService,
    feComponentsService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
