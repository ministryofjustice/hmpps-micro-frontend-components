import { Router } from 'express'
import passport from 'passport'
import flash from 'connect-flash'
import { AuthenticatedRequest, VerificationClient } from '@ministryofjustice/hmpps-auth-clients'
import { Strategy } from 'passport-oauth2'
import config from '../config'
import { HmppsUser } from '../interfaces/hmppsUser'
import logger from '../../logger'
import generateOauthClientToken from '../authentication/clientCredentials'

passport.serializeUser((user, done) => {
  // Not used but required for Passport
  done(null, user)
})

passport.deserializeUser((user, done) => {
  // Not used but required for Passport
  done(null, user as Express.User)
})

passport.use(
  new Strategy(
    {
      authorizationURL: `${config.apis.hmppsAuth.externalUrl}/oauth/authorize`,
      tokenURL: `${config.apis.hmppsAuth.url}/oauth/token`,
      clientID: config.apis.hmppsAuth.apiClientId,
      clientSecret: config.apis.hmppsAuth.apiClientSecret,
      callbackURL: `${config.domain}/develop/sign-in/callback`,
      state: true,
      customHeaders: { Authorization: generateOauthClientToken() },
    },
    (token, refreshToken, params, profile, done) => {
      return done(null, { token, username: params.user_name, authSource: params.auth_source })
    },
  ),
)

export default function setUpAuth(): Router {
  const router = Router()
  const tokenVerificationClient = new VerificationClient(config.apis.tokenVerification, logger)

  router.use(passport.initialize())
  router.use(passport.session())
  router.use(flash())

  router.get('/develop/autherror', (req, res) => {
    res.status(401)
    return res.render('autherror')
  })

  router.get('/develop/sign-in', passport.authenticate('oauth2'))

  router.get('/develop/sign-in/callback', (req, res, next) =>
    passport.authenticate('oauth2', {
      successReturnToOrRedirect: req.session.returnTo || '/develop',
      failureRedirect: '/develop/autherror',
    })(req, res, next),
  )

  const authUrl = config.apis.hmppsAuth.externalUrl
  const authSignOutUrl = `${authUrl}/sign-out?client_id=${config.apis.hmppsAuth.apiClientId}&redirect_uri=${config.domain}/develop`

  router.use('/develop/sign-out', (req, res, next) => {
    if (req.user) {
      req.logout(err => {
        if (err) return next(err)
        return req.session.destroy(() => res.redirect(authSignOutUrl))
      })
    } else res.redirect(authSignOutUrl)
  })

  router.use('/develop/account-details', (req, res) => {
    res.redirect(`${authUrl}/account-details`)
  })

  router.use(async (req, res, next) => {
    if (req.isAuthenticated() && (await tokenVerificationClient.verifyToken(req as unknown as AuthenticatedRequest))) {
      return next()
    }
    req.session.returnTo = req.originalUrl
    return res.redirect('/sign-in')
  })

  router.use((req, res, next) => {
    res.locals.user = req.user as HmppsUser
    next()
  })

  return router
}
