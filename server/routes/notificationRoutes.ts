import { NextFunction, Request, Response, Router } from 'express'
import { Services } from '../services'
import asyncMiddleware from '../middleware/asyncMiddleware'
import populateCurrentUser from '../middleware/populateCurrentUser'
import { Notification } from '../@types/Notification'
import { randomUUID } from 'node:crypto'
import authorisationMiddleware from '../middleware/authorisationMiddleware'
import auth from '../authentication/auth'
import tokenVerifier from '../data/tokenVerification'

export default function componentRoutes(services: Services): Router {
  const router = Router()

  // router.use(authorisationMiddleware())
  // router.use(auth.authenticationMiddleware(tokenVerifier))

  router.post(
    '/add-notification',
    asyncMiddleware(async (req, res, next) => {
      const body = req.body
      console.log(req.body)
      const cacheKey = `notifications-${body.userId}`
      const currentNotifications = await services.cacheService.getData<Notification[]>(cacheKey)
      const newNotification: Notification = {
        id: randomUUID(),
        content: body.content,
        url: body.url,
        type: body.type,
        userId: body.userId,
      }

      if (currentNotifications) {
        await services.cacheService.setData(cacheKey, [...currentNotifications, newNotification])
      } else {
        await services.cacheService.setData(cacheKey, [newNotification])
      }

      res.status(200).send()
    }),
  )

  router.post(
    '/see-notification',
    asyncMiddleware(async (req, res, next) => {
      // userId, notificationId
      const {userId, notificationId} = req.body
      const cacheKey = `notifications-${userId}`
      const currentNotifications = await services.cacheService.getData<Notification[]>(cacheKey)
      currentNotifications.forEach((o,i,a) => {
        if(o.id === notificationId) a[i].seen = true
      })

      console.log(currentNotifications)
      await services.cacheService.setData(cacheKey, currentNotifications)

      res.status(200).send()
    }),
  )

  router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.log("!!!!!!")
    console.log(err)
    if (err.name === 'UnauthorizedError') {
      res.status(401).send('Unauthorised')
    } else {
      next(err)
    }
  })

  return router
}
