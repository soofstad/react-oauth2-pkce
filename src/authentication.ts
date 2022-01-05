import { generateCodeChallenge, generateRandomString } from './pkceUtils'
import { TAuthConfig, TTokenData } from "./Types"

const codeVerifierStorageKey = "PKCE_code_verifier"

export async function login(authConfig: TAuthConfig) {
  // Create and store a random string in localStorage, used as the 'code_verifier'
  const codeVerifier = generateRandomString(40)
  localStorage.setItem(codeVerifierStorageKey, codeVerifier)

  // Hash and Base64URL encode the code_verifier, used as the 'code_challenge'
  generateCodeChallenge(codeVerifier).then((codeChallenge) => {
    // Set query parameters and redirect user to OAuth2 authentication endpoint
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: authConfig.clientId,
      scope: authConfig.scope || "",
      redirect_uri: authConfig.redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    })
    // Call any preLogin function in authConfig
    if (authConfig?.preLogin) authConfig.preLogin()
    location.replace(`${authConfig.authorizationEndpoint}?${params.toString()}`)
  })
}

export const fetchTokens = (authConfig: TAuthConfig): Promise<any> => {
  /*
    The browser has been redirected from the authentication endpoint with
    a 'code' url parameter.
    This code will now be exchanged for Access- and Refresh Tokens.
  */
  const urlParams = new URLSearchParams(window.location.search)
  const authCode = urlParams.get('code')
  const codeVerifier = window.localStorage.getItem(codeVerifierStorageKey)

  if (!authCode) {
    throw "Parameter 'code' not found in URL. \nHas authentication taken place?"
  }
  if (!codeVerifier) {
    throw "Can't get tokens without the CodeVerifier. \nHas authentication taken place?"
  }

  const formData = new FormData()
  formData.append('grant_type', 'authorization_code')
  formData.append('code', authCode)
  formData.append('scope', authConfig.scope || "")
  formData.append('client_id', authConfig.clientId)
  formData.append('redirect_uri', authConfig.redirectUri)
  formData.append('code_verifier', codeVerifier)

  return fetch(authConfig.tokenEndpoint, {
    method: 'POST',
    body: formData,
  })
    .then((response) => response.json().then((body: any): any => {
        if (!response.ok) {
          console.error(body.error_description)
          throw body.error_description
        }
        return body
      },
    ))

}

export const fetchWithRefreshToken = (props: { authConfig: TAuthConfig, refreshToken: string }) => {
  const { authConfig, refreshToken } = props
  const formData = new FormData()
  formData.append('grant_type', 'refresh_token')
  formData.append('refresh_token', refreshToken)
  formData.append('scope', authConfig.scope || "")
  formData.append('client_id', authConfig.clientId)
  formData.append('redirect_uri', authConfig.redirectUri)

  return fetch(authConfig.tokenEndpoint, {
    method: 'POST',
    body: formData,
  })
    .then((response) => response.json().then((body: any): any => {
        if (!response.ok) {
          console.error(body.error_description)
          throw body.error_description
        }
        return body
      },
    ))
}

/**
 * Decodes the the base64 encoded JWT. Returns a TToken.
 */
export const decodeToken = (token: string): TTokenData => {
  let base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      })
      .join(''),
  )

  return JSON.parse(jsonPayload)
}

/**
 * Check if the Access Token has expired by looking at the 'exp' JWT header.
 * Will return True if the token has expired, OR there is less than 10min until it expires.
 */
export const tokenExpired = (token: string): Boolean => {
  const bufferTimeInMilliseconds = 10 * 60 * 1000 // minutes * seconds * toMilliseconds
  const { exp } = decodeToken(token)
  const expirationTimeWithBuffer = new Date(exp * 1000 - bufferTimeInMilliseconds)
  return new Date() > expirationTimeWithBuffer
}
