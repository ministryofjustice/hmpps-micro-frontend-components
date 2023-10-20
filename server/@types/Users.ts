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

export interface AuthUser {
  name: string
  activeCaseLoadId: string
  username: string
  authSource: 'nomis' | 'auth'
  staffId: number
  userId: string
  uuid: string
  displayName: string
  roles: string[]
  token: string
}

export type User = (AuthUser | TokenData) & { authSource: TokenData['auth_source']; token: string; roles: string[] }
export const isApiUser = (user: TokenData | AuthUser): user is TokenData => !!(user as TokenData).auth_source
