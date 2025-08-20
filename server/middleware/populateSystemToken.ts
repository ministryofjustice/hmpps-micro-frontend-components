import { RequestHandler } from 'express'
import logger from '../../logger'
import { dataAccess } from '../data'

export default function populateSystemToken(): RequestHandler {
  return async (req, res, next) => {
    try {
      const { getSystemToken } = dataAccess()
      if (res.locals.user) {
        const systemToken = await getSystemToken(res.locals.user.username)
        if (systemToken) {
          req.middleware = { ...req.middleware, systemToken }
        } else {
          logger.info('No client token available')
        }
      }
      next()
    } catch (error) {
      logger.error(error, `Failed to retrieve client token for: ${res.locals.user && res.locals.user.username}`)
      next(error)
    }
  }
}
