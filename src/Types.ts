import { ReactNode } from "react"

export type TTokenData = {
  exp: number
  [x: string]: any
}

export type TTokenResponse = {
  access_token: string
  expires_in: number
  scope: string
  token_type: string
  refresh_token?: string
  id_token?: string
}

export interface IAuthProvider {
  authConfig: TAuthConfig,
  children: ReactNode
}

export interface IAuthContext {
  token: string
  logOut: ()=>void,
  error: any
  tokenData?: TTokenData|null,
  idToken?: string,
}


// Input from users of the package, some optional values
export type TAuthConfig = {
  clientId:  string
  authorizationEndpoint:  string
  tokenEndpoint: string
  redirectUri:  string
  scope?:  string
  logoutEndpoint?:  string
  logoutRedirect?:  string
  preLogin?: Function
  postLogin?: Function
  decodeToken?: boolean
}

// The AuthProviders internal config type. All values will be set by user provided, or default values
export type TInternalConfig = {
  clientId:  string
  authorizationEndpoint:  string
  tokenEndpoint: string
  redirectUri:  string
  scope:  string
  preLogin: Function
  postLogin: Function
  decodeToken: boolean
}