import { ReactNode } from 'react'

export type TTokenData = {
  exp: number
  [x: string]: unknown
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
}

export type TTokenResponse = {
  access_token: string
  refresh_token: string
  expires_in: number
  id_token?: string
}

export type TAzureADErrorResponse = {
  error_description: string
  [k: string]: unknown
}
