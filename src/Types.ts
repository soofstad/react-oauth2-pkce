import { ReactNode } from 'react'

interface TTokenRqBase {
  grant_type: string
  client_id: string
  redirect_uri: string
}

export interface TTokenRequestWithCodeAndVerifier extends TTokenRqBase {
  code: string
  code_verifier: string
}

export interface TTokenRequestForRefresh extends TTokenRqBase {
  scope?: string
  refresh_token: string
}

export type TTokenRequest = TTokenRequestWithCodeAndVerifier | TTokenRequestForRefresh

export type TTokenData = {
  // biome-ignore lint: It really can be any, almost
  [x: string]: any
}

export type TTokenResponse = {
  access_token: string
  scope: string
  token_type: string
  expires_in?: number
  refresh_token?: string
  refresh_token_expires_in?: number
  refresh_expires_in?: number
  id_token?: string
}

export interface IAuthProvider {
  authConfig: TAuthConfig
  children: ReactNode
}

export interface IAuthContext {
  token: string
  logOut: (state?: string, logoutHint?: string) => void
  login: (state?: string, additionalParameters?: TPrimitiveRecord) => void
  error: string | null
  tokenData?: TTokenData
  idToken?: string
  idTokenData?: TTokenData
  loginInProgress: boolean
}

export type TPrimitiveRecord = { [key: string]: string | boolean | number }

// Input from users of the package, some optional values
export type TAuthConfig = {
  clientId: string
  authorizationEndpoint: string
  tokenEndpoint: string
  redirectUri: string
  scope?: string
  state?: string
  logoutEndpoint?: string
  logoutRedirect?: string
  preLogin?: () => void
  postLogin?: () => void
  onRefreshTokenExpire?: (event: TRefreshTokenExpiredEvent) => void
  decodeToken?: boolean
  autoLogin?: boolean
  clearURL?: boolean
  // TODO: Remove in 2.0
  extraAuthParams?: TPrimitiveRecord
  extraAuthParameters?: TPrimitiveRecord
  extraTokenParameters?: TPrimitiveRecord
  extraLogoutParameters?: TPrimitiveRecord
  tokenExpiresIn?: number
  refreshTokenExpiresIn?: number
  storage?: 'session' | 'local'
  storageKeyPrefix?: string
  refreshWithScope?: boolean
}

export type TRefreshTokenExpiredEvent = {
  login: () => void
}

// The AuthProviders internal config type. All values will be set by user provided, or default values
export type TInternalConfig = {
  clientId: string
  authorizationEndpoint: string
  tokenEndpoint: string
  redirectUri: string
  scope?: string
  state?: string
  logoutEndpoint?: string
  logoutRedirect?: string
  preLogin?: () => void
  postLogin?: () => void
  onRefreshTokenExpire?: (event: TRefreshTokenExpiredEvent) => void
  decodeToken: boolean
  autoLogin: boolean
  clearURL: boolean
  // TODO: Remove in 2.0
  extraAuthParams?: TPrimitiveRecord
  extraAuthParameters?: TPrimitiveRecord
  extraTokenParameters?: TPrimitiveRecord
  extraLogoutParameters?: TPrimitiveRecord
  tokenExpiresIn?: number
  refreshTokenExpiresIn?: number
  storage: 'session' | 'local'
  storageKeyPrefix: string
  refreshWithScope: boolean
}
