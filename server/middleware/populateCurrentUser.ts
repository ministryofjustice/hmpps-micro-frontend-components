import { RequestHandler } from 'express'
import logger from '../../logger'
import UserService from '../services/userService'

export default function populateCurrentUser(userService: UserService): RequestHandler {
  return async (req, res, next) => {
    // expressjwt middleware puts user object on req.auth
    if (!res.locals.user && req.auth) {
      res.locals.user = req.auth
    }

    try {
      if (res.locals.user) {
        const token = res.locals.user.token ?? (req.headers['x-user-token'] as string)
        const user = await userService.getUser(token)
        if (user) {
          res.locals.user = { ...user, ...res.locals.user, token }
        } else {
          logger.info('No user available')
        }
      }
      next()
    } catch (error) {
      logger.error(error, `Failed to retrieve user for: ${res.locals.user && res.locals.user.username}`)
      next(error)
    }
  }
}
