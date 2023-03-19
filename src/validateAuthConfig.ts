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
  if (!['session', 'local'].includes(config.storage)) throw Error("'storage' must be one of ('session', 'local')")
  if (config?.extraAuthParams)
    console.warn(
      "The 'extraAuthParams' configuration parameter will be deprecated. You should use " +
        "'extraTokenParameters' instead."
    )
  if (config?.extraAuthParams && config?.extraTokenParameters)
    console.warn(
      "Using both 'extraAuthParams' and 'extraTokenParameters' is not recommended. " +
        "They do the same thing, and you should only use 'extraTokenParameters'"
    )
}
