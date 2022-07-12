import { generateCodeChallenge, generateRandomString } from './pkceUtils'
import { TInternalConfig, TTokenData, TAzureADErrorResponse, TTokenResponse } from './Types'

const codeVerifierStorageKey = 'PKCE_code_verifier'
// [ AzureAD,]
export const EXPIRED_REFRESH_TOKEN_ERROR_CODES = ['AADSTS700084']

export async function logIn(config: TInternalConfig) {
  // Create and store a random string in localStorage, used as the 'code_verifier'
  const codeVerifier = generateRandomString(40)
  localStorage.setItem(codeVerifierStorageKey, codeVerifier)

  // Hash and Base64URL encode the code_verifier, used as the 'code_challenge'
  generateCodeChallenge(codeVerifier).then((codeChallenge) => {
    // Set query parameters and redirect user to OAuth2 authentication endpoint
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.clientId,
      scope: config.scope,
      redirect_uri: config.redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    })
    // Call any preLogin function in authConfig
    if (config?.preLogin) config.preLogin()
    window.location.replace(`${config.authorizationEndpoint}?${params.toString()}`)
  })
}

// This is called a "type predicate". Which allow use to know which kind of response we got, in a type safe way.
function isTokenResponse(body: TAzureADErrorResponse | TTokenResponse): body is TTokenResponse {
  return (body as TTokenResponse).access_token !== undefined
}

function postWithFormData(tokenEndpoint: string, formData: FormData): Promise<TTokenResponse> {
  return fetch(tokenEndpoint, {
    method: 'POST',
    body: formData,
  }).then((response: Response) => {
    if (!response.ok) {
      console.error(response)
      throw Error(response.statusText)
    }
    return response.json().then((body: TAzureADErrorResponse | TTokenResponse): TTokenResponse => {
      if (isTokenResponse(body)) {
        return body
      } else {
        console.error(body)
        throw Error(body.error_description)
      }
    })
  })
}

export const fetchTokens = (config: TInternalConfig): Promise<TTokenResponse> => {
  /*
    The browser has been redirected from the authentication endpoint with
    a 'code' url parameter.
    This code will now be exchanged for Access- and Refresh Tokens.
  */
  const urlParams = new URLSearchParams(window.location.search)
  const authCode = urlParams.get('code')
  const codeVerifier = window.localStorage.getItem(codeVerifierStorageKey)

  if (!authCode) {
    throw Error("Parameter 'code' not found in URL. \nHas authentication taken place?")
  }
  if (!codeVerifier) {
    throw Error("Can't get tokens without the CodeVerifier. \nHas authentication taken place?")
  }

  const formData = new FormData()
  formData.append('grant_type', 'authorization_code')
  formData.append('code', authCode)
  formData.append('scope', config.scope)
  formData.append('client_id', config.clientId)
  formData.append('redirect_uri', config.redirectUri)
  formData.append('code_verifier', codeVerifier)

  return postWithFormData(config.tokenEndpoint, formData)
}

export const fetchWithRefreshToken = (props: {
  config: TInternalConfig
  refreshToken: string
}): Promise<TTokenResponse> => {
  const { config, refreshToken } = props
  const formData = new FormData()
  formData.append('grant_type', 'refresh_token')
  formData.append('refresh_token', refreshToken)
  formData.append('scope', config.scope)
  formData.append('client_id', config.clientId)
  formData.append('redirect_uri', config.redirectUri)

  return postWithFormData(config.tokenEndpoint, formData)
}

/**
 * Decodes the base64 encoded JWT. Returns a TToken.
 */
export const decodeJWT = (token: string): TTokenData => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        })
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    console.error(e)
    throw Error(
      'Failed to decode the access token.\n\tIs it a proper Java Web Token?\n\t' +
        "You can disable JWT decoding by setting the 'decodeToken' value to 'false' the configuration."
    )
  }
}

// Returns epoch time (in seconds) for when the token will expire
export const timeOfExpire = (validTimeDelta: number) => Math.round(Date.now() / 1000 + validTimeDelta)

/**
 * Check if the Access Token has expired.
 * Will return True if the token has expired, OR there is less than 5min until it expires.
 */
export function tokenExpired(tokenExpire: number): boolean {
  const now = Math.round(Date.now()) / 1000
  const bufferTimeInSeconds = 5 * 60 // minutes * seconds
  const nowWithBuffer = now + bufferTimeInSeconds
  return nowWithBuffer >= tokenExpire
}

export const errorMessageForExpiredRefreshToken = (errorMessage: string): boolean => {
  let expired = false
  EXPIRED_REFRESH_TOKEN_ERROR_CODES.forEach((errorCode: string) => {
    if (errorMessage.includes(errorCode)) {
      expired = true
    }
  })
  return expired
}
