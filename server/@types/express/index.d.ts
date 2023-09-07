export default {}

declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number
  }
}

export interface TokenData {
  sub: string
  user_name: string
  auth_source: 'nomis' | 'auth' | 'delius' | 'azuread'
  iss: string
  authorities: string[]
  client_id: string
  user_uuid: string
  grant_type: string
  user_id: string
  scope: string[]
  name: string
  exp: number
  jti: string
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
      logout(done: (err: unknown) => void): void
      auth?: TokenData
    }
  }
}
