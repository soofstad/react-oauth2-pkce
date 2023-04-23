import { generateCodeChallenge, generateRandomString } from './pkceUtils'
import {
  TInternalConfig,
  TTokenResponse,
  TTokenRequest,
  TTokenRequestWithCodeAndVerifier,
  TTokenRequestForRefresh,
} from './Types'
import { postWithXForm } from './httpUtils'

const codeVerifierStorageKey = 'PKCE_code_verifier'
const stateStorageKey = 'ROCP_auth_state'

export async function redirectToLogin(config: TInternalConfig, customState?: string): Promise<void> {
  // Create and store a random string in sessionStorage, used as the 'code_verifier'
  const codeVerifier = generateRandomString(96)
  sessionStorage.setItem(codeVerifierStorageKey, codeVerifier)

  // Hash and Base64URL encode the code_verifier, used as the 'code_challenge'
  return generateCodeChallenge(codeVerifier).then((codeChallenge) => {
    // Set query parameters and redirect user to OAuth2 authentication endpoint
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.clientId,
      scope: config.scope,
      redirect_uri: config.redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      ...config.extraAuthParameters,
    })

    sessionStorage.removeItem(stateStorageKey)
    const state = customState ?? config.state
    if (state) {
      sessionStorage.setItem(stateStorageKey, state)
      params.append('state', state)
    }
    // Call any preLogin function in authConfig
    if (config?.preLogin) config.preLogin()
    window.location.replace(`${config.authorizationEndpoint}?${params.toString()}`)
  })
}

// This is called a "type predicate". Which allow us to know which kind of response we got, in a type safe way.
function isTokenResponse(body: any | TTokenResponse): body is TTokenResponse {
  return (body as TTokenResponse).access_token !== undefined
}

function postTokenRequest(tokenEndpoint: string, tokenRequest: TTokenRequest): Promise<TTokenResponse> {
  return postWithXForm(tokenEndpoint, tokenRequest).then((response) => {
    return response.json().then((body: TTokenResponse | any): TTokenResponse => {
      if (isTokenResponse(body)) {
        return body
      } else {
        throw Error(body)
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
  const codeVerifier = window.sessionStorage.getItem(codeVerifierStorageKey)

  if (!authCode) {
    throw Error("Parameter 'code' not found in URL. \nHas authentication taken place?")
  }
  if (!codeVerifier) {
    throw Error("Can't get tokens without the CodeVerifier. \nHas authentication taken place?")
  }

  const tokenRequest: TTokenRequestWithCodeAndVerifier = {
    grant_type: 'authorization_code',
    code: authCode,
    scope: config.scope,
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
    // TODO: Remove in 2.0
    ...config.extraAuthParams,
    ...config.extraTokenParameters,
  }
  return postTokenRequest(config.tokenEndpoint, tokenRequest)
}

export const fetchWithRefreshToken = (props: {
  config: TInternalConfig
  refreshToken: string
}): Promise<TTokenResponse> => {
  const { config, refreshToken } = props
  const refreshRequest: TTokenRequestForRefresh = {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    scope: config.scope,
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
  }
  return postTokenRequest(config.tokenEndpoint, refreshRequest)
}

export function redirectToLogout(
  config: TInternalConfig,
  token: string,
  idToken?: string,
  state?: string,
  logoutHint?: string
) {
  const params = new URLSearchParams({
    token: token,
    // TODO: Add config param for token type
    token_type_hint: 'refresh_token',
    client_id: config.clientId,
    post_logout_redirect_uri: config.logoutRedirect ?? config.redirectUri,
    ui_locales: window.navigator.languages.reduce((a: string, b: string) => a + ' ' + b),
    ...config.extraLogoutParameters,
  })
  if (idToken) params.append('id_token_hint', idToken)
  if (state) params.append('state', state)
  if (logoutHint) params.append('logout_hint', logoutHint)

  window.location.replace(`${config.logoutEndpoint}?${params.toString()}`)
}

export function validateState(urlParams: URLSearchParams) {
  const receivedState = urlParams.get('state')
  const loadedState = sessionStorage.getItem(stateStorageKey)
  if (receivedState !== loadedState) {
    throw new Error(
      '"state" value received from authentication server does no match client request. Possible cross-site request forgery'
    )
  }
}
