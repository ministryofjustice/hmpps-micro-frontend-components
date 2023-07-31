import express, { Router, type Request } from 'express'
import cookie from 'cookie'
import signature from 'cookie-signature'
import superagent from 'superagent'
import config from '../config'
import logger from '../../logger'

const COOKIE_NAME = 'connect.sid'
export default function getToken(): Router {
  const router = express.Router()
  router.use(async (req, res, next) => {
    const cookieValue = getSessionCookie(req)
    logger.debug('COOKIE VALUE: ', cookieValue)
    logger.debug('SERVICE NAME: ', req.query.sessionServiceName)
    const token = await superagent.get(
      `${config.apis.session.url}/sessions/${cookieValue}/${req.query.sessionServiceName}`,
    )

    logger.debug('TOKEN RESPONSE: ', token)

    next()
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
