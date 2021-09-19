import { AuthConfig } from "./Types"

export function validateAuthConfig(authConfig: AuthConfig) {
  if(authConfig.clientId === "" || null || undefined)
    throw "ClientId must be set in the 'AuthConfig' object passed to 'react-oauth2-code-pkce' AuthProvider"
  if(authConfig.authorizationEndpoint === "" || null || undefined)
    throw "authorizationEndpoint must be set in the 'AuthConfig' object passed to 'react-oauth2-code-pkce' AuthProvider"
  if(authConfig.tokenEndpoint === "" || null || undefined)
    throw "tokenEndpoint must be set in the 'AuthConfig' object passed to 'react-oauth2-code-pkce' AuthProvider"
  if(authConfig.redirectUri === "" || null || undefined)
    throw "redirectUri must be set in the 'AuthConfig' object passed to 'react-oauth2-code-pkce' AuthProvider"
}