import { HmppsUser } from '../../interfaces/hmppsUser'
import { TokenData } from '../Users'

export default {}

declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number
  }
}

export declare global {
  namespace Express {
    interface User {
      username: string
      token: string
      authSource: string
    }

    interface Request {
      verified?: boolean
      id: string
      middleware?: Record
      logout(done: (err: unknown) => void): void
      auth?: TokenData
    }

    interface Locals {
      user: HmppsUser
    }
  }
}
