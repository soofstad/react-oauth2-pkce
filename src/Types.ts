import { ReactChildren } from "react"

export type TTokenData = {
  exp: number
  [x: string]: any
}

export interface IAuthProvider {
  authConfig: any,
  children: ReactChildren
}

export type AuthConfig = {
  clientId:  string
  authorizationEndpoint:  string
  tokenEndpoint: string
  redirectUri:  string
  scope?:  string
  logoutEndpoint?:  string
  logoutRedirect?:  string
}