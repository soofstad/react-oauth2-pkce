import axios from 'axios'
import { generateCodeChallenge, generateRandomString } from './pkceUtils'
import { TTokenData } from "./Types"

const codeVerifierStorageKey = "PKCE_code_verifier"

const authSettings = {
  clientId: process.env.REACT_APP_AUTH_CLIENT_ID || '',
  authorizationEndpoint: process.env.REACT_APP_AUTH_ENDPOINT || '',
  tokenEndpoint: process.env.REACT_APP_TOKEN_ENDPOINT || '',
  scope: process.env.REACT_APP_AUTH_SCOPE || '',
  redirectUri: process.env.REACT_APP_AUTH_REDIRECT_URI || '',
  logoutEndpoint: process.env.REACT_APP_LOGOUT_ENDPOINT || '',
}

export function logout() {
  window.location.href = `${authSettings.logoutEndpoint}?post_logout_redirect_uri=${authSettings.redirectUri}`
}

export async function login() {
  // Create and store a random string in localStorage, used as the 'code_verifier'
  const codeVerifier = generateRandomString(20)
  window.localStorage.setItem(codeVerifierStorageKey, codeVerifier)

  // Hash and Base64URL encode the code_verifier, used as the 'code_challenge'
  generateCodeChallenge(codeVerifier).then((codeChallenge) => {
    // Set query parameters and redirect user to OAuth2 authentication endpoint
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: authSettings.clientId,
      scope: authSettings.scope,
      redirect_id: authSettings.redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    })
    window.location.replace(
      `${authSettings.authorizationEndpoint}?${params.toString()}`,
    )
  })
}

export const getTokens = (): Promise<any> => {
  /*
    The browser has been redirected from the authentication endpoint with
    a 'code' url parameter.
    This code will now be exchanged for Access- and Refresh Tokens.
  */
  const urlParams = new URLSearchParams(window.location.search)
  const authCode = urlParams.get('code')
  const codeVerifier = window.localStorage.getItem(codeVerifierStorageKey)

  if (!authCode) {
    console.error("Parameter 'code' not found in URL. \nHas authentication taken place?")
    return
  }
  if (!codeVerifier) {
    console.error("Can't get tokens without the CodeVerifier. \nHas authentication taken place?")
    return
  }

  const formData = new FormData()
  formData.append('grant_type', 'authorization_code')
  formData.append('code', authCode)
  formData.append('scope', authSettings.scope)
  formData.append('client_id', authSettings.clientId)
  formData.append('redirect_uri', authSettings.redirectUri)
  formData.append('code_verifier', codeVerifier)

  return axios
    .post(authSettings.tokenEndpoint, formData)
    .then((response) => response.data)
    .catch((e) => {
      console.error(e)
    })
}

export const getAccessTokenFromRefreshToken = (refreshToken: string) => {
  const params = new URLSearchParams({
    client_id: authSettings.clientId,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  return axios
    .post(authSettings.tokenEndpoint, params)
    .then((response) => response.data)
    .catch((error) => {
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
