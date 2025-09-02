import type { Request, Response, NextFunction } from 'express'
import type { HTTPError } from 'superagent'
import logger from '../logger'
import { errorHasStatus, getErrorStatus } from './utils/errorHelpers'

export default function createErrorHandler(production: boolean) {
  return (error: HTTPError, req: Request, res: Response, next: NextFunction): void => {
    logger.error(`Error handling request for '${req.originalUrl}', user '${res.locals.user?.username}'`, error)

    if (errorHasStatus(error, 401) || errorHasStatus(error, 403)) {
      logger.info('Logging user out')
      return res.redirect('/develop/sign-out')
    }

    res.locals.message = production
      ? 'Something went wrong. The error has been logged. Please try again'
      : error.message
    res.locals.status = getErrorStatus(error)
    res.locals.stack = production ? null : error.stack

    res.status(getErrorStatus(error) || 500)

    return res.render('pages/error')
  }
}
