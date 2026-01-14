import { RequestHandler } from 'express'
import { jwtDecode } from 'jwt-decode'
import logger from '../../logger'
import { convertToTitleCase } from '../utils/utils'
import { Role } from '../services/utils/roles'
import { HmppsUser } from '../interfaces/hmppsUser'
import { UserService } from '../services'

export default function populateCurrentUser(userService: UserService): RequestHandler {
  return async (req, res, next) => {
    try {
      // expressjwt middleware puts user object on req.auth
      if (!res.locals.user && req.auth) {
        res.locals.user = {
          token: req.headers['x-user-token'] as string,
          username: req.auth.user_name,
          authSource: req.auth.auth_source,
        } as HmppsUser
      }

      const {
        name,
        user_id: userId,
        authorities: roles = [],
      } = jwtDecode(res.locals.user.token) as {
        name?: string
        user_id?: string
        authorities?: string[]
      }

      res.locals.user = {
        ...res.locals.user,
        userId,
        name,
        displayName: convertToTitleCase(name),
        userRoles: roles.map(role => role.substring(role.indexOf('_') + 1) as Role),
      }

      if (res.locals.user.authSource === 'nomis') {
        logger.warn('user', res.locals.user)
        res.locals.user.staffId = parseInt(userId, 10) || undefined
        res.locals.user = {
          ...res.locals.user,
          ...(await userService.getPrisonUserAccess(res.locals.user)),
        }
      }

      next()
    } catch (error) {
      logger.error(error, `Failed to populate user details for: ${res.locals.user && res.locals.user.username}`)
      next(error)
    }
  }
}
