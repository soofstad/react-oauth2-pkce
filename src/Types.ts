import { ReactNode } from 'react'

interface TTokenRqBase {
  grant_type: string
  scope: string
  client_id: string
  redirect_uri: string
}
interface TTokenRequestWithCodeAndVerifier extends TTokenRqBase {
  code: string
  code_verifier: string
}
interface TTokenRequestForRefresh extends TTokenRqBase {
  refresh_token: string
}
export type TTokenRequest = TTokenRequestWithCodeAndVerifier | TTokenRequestForRefresh

export type TTokenData = {
  [x: string]: any
}

export type TTokenResponse = {
  access_token: string
  scope: string
  token_type: string
  expires_in?: number
  refresh_token?: string
  refresh_token_expires_in?: number
  id_token?: string
}

export interface IAuthProvider {
  authConfig: TAuthConfig
  children: ReactNode
}

export interface IAuthContext {
  token: string
  logOut: () => void
  error: string | null
  tokenData?: TTokenData
  idToken?: string
}

// Input from users of the package, some optional values
export type TAuthConfig = {
  clientId: string
  authorizationEndpoint: string
  tokenEndpoint: string
  redirectUri: string
  scope?: string
  logoutEndpoint?: string
  logoutRedirect?: string
  preLogin?: () => void
  postLogin?: () => void
  decodeToken?: boolean
}

export type TAzureADErrorResponse = {
  error_description: string
  [k: string]: unknown
}

// The AuthProviders internal config type. All values will be set by user provided, or default values
export type TInternalConfig = {
  clientId: string
  authorizationEndpoint: string
  tokenEndpoint: string
  redirectUri: string
  scope: string
  preLogin?: () => void
  postLogin?: () => void
  decodeToken: boolean
}
