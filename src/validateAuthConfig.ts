import { TAuthConfig } from "./Types"

function stringIsUnset(value: any){
  const unset = ["", undefined, null]
  return unset.includes(value)
}

export function validateAuthConfig(authConfig: TAuthConfig) {
  if(stringIsUnset(authConfig?.clientId))
    throw "'clientId' must be set in the 'AuthConfig' object passed to 'react-oauth2-code-pkce' AuthProvider"
  if(stringIsUnset(authConfig?.authorizationEndpoint))
    throw "'authorizationEndpoint' must be set in the 'AuthConfig' object passed to 'react-oauth2-code-pkce' AuthProvider"
  if(stringIsUnset(authConfig?.tokenEndpoint))
    throw "'tokenEndpoint' must be set in the 'AuthConfig' object passed to 'react-oauth2-code-pkce' AuthProvider"
  if(stringIsUnset(authConfig?.redirectUri))
    throw "'redirectUri' must be set in the 'AuthConfig' object passed to 'react-oauth2-code-pkce' AuthProvider"
}