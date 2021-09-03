// @ts-ignore
import axios from 'axios'
import { generateCodeChallenge, generateRandomString } from './pkceUtils'
import { AuthConfig, TTokenData } from "./Types"

const codeVerifierStorageKey = "PKCE_code_verifier"

export function logout(authConfig: AuthConfig) {
  window.location.href = `${authConfig.logoutEndpoint}?post_logout_redirect_uri=${authConfig.redirectUri}`
}

export async function login(authConfig: AuthConfig) {
  console.log(authConfig)
  // Create and store a random string in localStorage, used as the 'code_verifier'
  const codeVerifier = generateRandomString(20)
  window.localStorage.setItem(codeVerifierStorageKey, codeVerifier)

  // Hash and Base64URL encode the code_verifier, used as the 'code_challenge'
  generateCodeChallenge(codeVerifier).then((codeChallenge) => {
    // Set query parameters and redirect user to OAuth2 authentication endpoint
    console.log(authConfig)
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: authConfig.clientId,
      scope: authConfig.scope,
      redirect_id: authConfig.redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    })
    window.location.replace(
      `${authConfig.authorizationEndpoint}?${params.toString()}`,
    )
  })
}

export const getTokens = (authConfig: AuthConfig): Promise<any> => {
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
  formData.append('scope', authConfig.scope)
  formData.append('client_id', authConfig.clientId)
  formData.append('redirect_uri', authConfig.redirectUri)
  formData.append('code_verifier', codeVerifier)

  return axios.post(authConfig.tokenEndpoint, formData)
    .then((response)=> response.data)

}

export const getAccessTokenFromRefreshToken = ({authConfig, refreshToken}: any) => {
  const params = new URLSearchParams({
    client_id: authConfig.clientId,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  return axios
    .post(authConfig.tokenEndpoint, params)
    .then((response: any) => response.data)
    .catch((error: any) => {
      console.error(`Failed to fetch AccessToken with RefreshToken: ${error}`)
    })
}

/**
 * Decodes the the base64 encoded JWT. Returns a TToken.
 */
export const decodeToken = (token: string): TTokenData => {
  var base64Url = token.split('.')[1]
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
 * Will return True if the token has expired, OR there is less than 30min until it expires.
 */
export const tokenExpired = (token: string): Boolean => {
  const bufferTimeInMilliseconds = 30 * 60 * 1000 // minutes * seconds * toMilliseconds
  const { exp } = decodeToken(token)
  const expirationTimeWithBuffer = new Date(exp * 1000 - bufferTimeInMilliseconds)
  return new Date() > expirationTimeWithBuffer
}
