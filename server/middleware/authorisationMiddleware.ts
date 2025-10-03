import { jwtDecode } from 'jwt-decode'
import type { RequestHandler } from 'express'

import logger from '../../logger'

export default function authorisationMiddleware(authorisedRoles: string[] = []): RequestHandler {
  return (req, res, next) => {
    if (res.locals?.user?.token) {
      const { authorities: roles = [] } = jwtDecode(res.locals.user.token) as { authorities?: string[] }

      if (authorisedRoles.length && !roles.some(role => authorisedRoles.includes(role))) {
        logger.error('User is not authorised to access this')
        return res.redirect('/develop/authError')
      }

      return next()
    }

    req.session.returnTo = req.originalUrl
    logger.info(`authorisationMiddleware: token = ${res.locals?.user?.token}`)
    return res.redirect('/develop/sign-in')
  }
}
