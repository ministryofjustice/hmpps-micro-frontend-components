import express, { Router, type Request } from 'express'
import cookie from 'cookie'
import signature from 'cookie-signature'
import config from '../config'
import logger from '../../logger'
import { Services } from '../services'

const COOKIE_NAME = 'connect.sid'
export default function getUserPassport({ userService }: Services): Router {
  const router = express.Router()
  router.use(async (req, res, next) => {
    try {
      const serviceName = String(req.query.sessionServiceName)
      const sid = getSessionCookie(req)
      const result = await userService.getCentralUserPassport(sid, serviceName)
      res.locals.user = result.passport.user

      next()
    } catch (err) {
      logger.error('PASSPORT RETRIEVAL ERROR', err)
      next(err)
    }
  })
  return router
}

function getSessionCookie(req: Request) {
  const header = req.headers.cookie
  let raw
  let val

  // read from cookie header
  if (header) {
    const cookies = cookie.parse(header)

    raw = cookies[COOKIE_NAME]

    if (raw) {
      if (raw.substring(0, 2) === 's:') {
        val = unsignCookie(raw.slice(2), [config.session.secret])

        if (val === false) {
          logger.debug('cookie signature invalid')
          val = undefined
        }
      } else {
        logger.debug('cookie unsigned')
      }
    }
  }

  // back-compat read from cookieParser() signedCookies data
  if (!val && req.signedCookies) {
    val = req.signedCookies[COOKIE_NAME]

    if (val) {
      logger.warn('cookie should be available in req.headers.cookie')
    }
  }

  // back-compat read from cookieParser() cookies data
  if (!val && req.cookies) {
    raw = req.cookies[COOKIE_NAME]

    if (raw) {
      if (raw.substring(0, 2) === 's:') {
        val = unsignCookie(raw.slice(2), [config.session.secret])

        if (val) {
          logger.warn('cookie should be available in req.headers.cookie')
        }

        if (val === false) {
          logger.debug('cookie signature invalid')
          val = undefined
        }
      } else {
        logger.debug('cookie unsigned')
      }
    }
  }

  return val
}

function unsignCookie(val: string, secrets: string[]) {
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < secrets.length; i++) {
    const result = signature.unsign(val, secrets[i])

    if (result !== false) {
      return result
    }
  }

  return false
}
