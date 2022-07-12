import { TAuthConfig } from './Types'

function stringIsUnset(value: any) {
  const unset = ['', undefined, null]
  return unset.includes(value)
}

export function validateAuthConfig(authConfig: TAuthConfig) {
  if (stringIsUnset(authConfig?.clientId))
    throw Error("'clientId' must be set in the 'AuthConfig' object passed to 'react-oauth2-code-pkce' AuthProvider")
  if (stringIsUnset(authConfig?.authorizationEndpoint))
    throw Error(
      "'authorizationEndpoint' must be set in the 'AuthConfig' object passed to 'react-oauth2-code-pkce' AuthProvider"
    )
  if (stringIsUnset(authConfig?.tokenEndpoint))
    throw Error(
      "'tokenEndpoint' must be set in the 'AuthConfig' object passed to 'react-oauth2-code-pkce' AuthProvider"
    )
  if (stringIsUnset(authConfig?.redirectUri))
    throw Error("'redirectUri' must be set in the 'AuthConfig' object passed to 'react-oauth2-code-pkce' AuthProvider")
}
