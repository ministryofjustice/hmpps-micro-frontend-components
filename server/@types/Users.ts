export interface TokenData {
  sub: string
  user_name: string
  auth_source: 'nomis' | 'delius' | 'external' | 'azuread'
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
