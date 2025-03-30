import type { ReactNode } from 'react'

// Makes only the specified keys required in the provided type
// Source: https://www.emmanuelgautier.com/blog/snippets/typescript-required-properties
type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

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
  // biome-ignore lint: It really can be `any` (almost)
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

export type TLoginMethod = 'redirect' | 'replace' | 'popup'

export type TPopupPosition = {
  left: number
  top: number
  width: number
  height: number
}

export interface IAuthProvider {
  authConfig: TAuthConfig
  children: ReactNode
}

type TLogInFunction = (state?: string, additionalParameters?: TPrimitiveRecord, method?: TLoginMethod) => void
export interface IAuthContext {
  token: string
  logIn: TLogInFunction
  logOut: (state?: string, logoutHint?: string, additionalParameters?: TPrimitiveRecord) => void
  /** @deprecated Use `logIn` instead */
  login: TLogInFunction
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
  loginMethod?: TLoginMethod
  onRefreshTokenExpire?: (event: TRefreshTokenExpiredEvent) => void
  decodeToken?: boolean
  autoLogin?: boolean
  clearURL?: boolean
  /** @deprecated Use `extraAuthParameters` instead. Will be removed in a future version. */
  extraAuthParams?: TPrimitiveRecord
  extraAuthParameters?: TPrimitiveRecord
  extraTokenParameters?: TPrimitiveRecord
  extraLogoutParameters?: TPrimitiveRecord
  tokenExpiresIn?: number
  refreshTokenExpiresIn?: number
  refreshTokenExpiryStrategy?: 'renewable' | 'absolute'
  storage?: 'session' | 'local'
  storageKeyPrefix?: string
  refreshWithScope?: boolean
  tokenRequestCredentials?: RequestCredentials
}

export type TRefreshTokenExpiredEvent = {
  logIn: TLogInFunction
  /** @deprecated Use `logIn` instead. Will be removed in a future version. */
  login: TLogInFunction
}

// The AuthProviders internal config type. All values will be set by user provided, or default values
export type TInternalConfig = WithRequired<
  TAuthConfig,
  | 'loginMethod'
  | 'decodeToken'
  | 'autoLogin'
  | 'clearURL'
  | 'refreshTokenExpiryStrategy'
  | 'storage'
  | 'storageKeyPrefix'
  | 'refreshWithScope'
  | 'tokenRequestCredentials'
>
