import type { RequestHandler } from 'express'
import { VerificationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'

export type AuthenticationMiddleware = () => RequestHandler

const authenticationMiddleware: AuthenticationMiddleware = () => {
  const tokenVerificationClient = new VerificationClient(config.apis.tokenVerification, logger)
  return async (req, res, next) => {
    if (req.isAuthenticated() && (await tokenVerificationClient.verifyToken(req))) {
      return next()
    }
    req.session.returnTo = req.originalUrl
    return res.redirect('/develop/sign-in')
  }
}

export default { authenticationMiddleware }
