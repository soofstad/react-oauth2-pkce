import { TInternalConfig } from './Types'

function stringIsUnset(value: any) {
  const unset = ['', undefined, null]
  return unset.includes(value)
}

export function validateAuthConfig(config: TInternalConfig) {
  if (stringIsUnset(config?.clientId))
    throw Error("'clientId' must be set in the 'AuthConfig' object passed to 'react-oauth2-code-pkce' AuthProvider")
  if (stringIsUnset(config?.authorizationEndpoint))
    throw Error(
      "'authorizationEndpoint' must be set in the 'AuthConfig' object passed to 'react-oauth2-code-pkce' AuthProvider"
    )
  if (stringIsUnset(config?.tokenEndpoint))
    throw Error(
      "'tokenEndpoint' must be set in the 'AuthConfig' object passed to 'react-oauth2-code-pkce' AuthProvider"
    )
  if (stringIsUnset(config?.redirectUri))
    throw Error("'redirectUri' must be set in the 'AuthConfig' object passed to 'react-oauth2-code-pkce' AuthProvider")
}
