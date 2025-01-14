import { postWithXForm } from './httpUtils'
import { generateCodeChallenge, generateRandomString } from './pkceUtils'
import { calculatePopupPosition } from './popupUtils'
import type {
  TInternalConfig,
  TPrimitiveRecord,
  TTokenRequest,
  TTokenRequestForRefresh,
  TTokenRequestWithCodeAndVerifier,
  TTokenResponse,
} from './types'

const codeVerifierStorageKey = 'PKCE_code_verifier'
const stateStorageKey = 'ROCP_auth_state'

export async function redirectToLogin(
  config: TInternalConfig,
  customState?: string,
  additionalParameters?: TPrimitiveRecord,
  method: 'popup' | 'redirect' = 'redirect'
): Promise<void> {
  const storage = config.storage === 'session' ? sessionStorage : localStorage

  // Create and store a random string in storage, used as the 'code_verifier'
  const codeVerifier = generateRandomString(96)
  storage.setItem(codeVerifierStorageKey, codeVerifier)

  // Hash and Base64URL encode the code_verifier, used as the 'code_challenge'
  return generateCodeChallenge(codeVerifier).then((codeChallenge) => {
    // Set query parameters and redirect user to OAuth2 authentication endpoint
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      ...config.extraAuthParameters,
      ...additionalParameters,
    })

    if (config.scope !== undefined && !params.has('scope')) {
      params.append('scope', config.scope)
    }

    storage.removeItem(stateStorageKey)
    const state = customState ?? (config.stateFn && config.stateFn())
    if (state) {
      storage.setItem(stateStorageKey, state)
      params.append('state', state)
    }

    const loginUrl = `${config.authorizationEndpoint}?${params.toString()}`

    // Call any preLogin function in authConfig
    if (config?.preLogin) config.preLogin()

    if (method === 'popup') {
      const { width, height, left, top } = calculatePopupPosition(600, 600)
      const handle: null | WindowProxy = window.open(
        loginUrl,
        'loginPopup',
        `width=${width},height=${height},top=${top},left=${left}`
      )
      if (handle) return
      console.warn('Popup blocked. Redirecting to login page. Disable popup blocker to use popup login.')
    }
    window.location.assign(loginUrl)
  })
}

// This is called a "type predicate". Which allow us to know which kind of response we got, in a type safe way.
function isTokenResponse(body: unknown | TTokenResponse): body is TTokenResponse {
  return (body as TTokenResponse).access_token !== undefined
}

function postTokenRequest(
  tokenEndpoint: string,
  tokenRequest: TTokenRequest,
  credentials: RequestCredentials
): Promise<TTokenResponse> {
  return postWithXForm({ url: tokenEndpoint, request: tokenRequest, credentials: credentials }).then((response) => {
    return response.json().then((body: TTokenResponse | unknown): TTokenResponse => {
      if (isTokenResponse(body)) {
        return body
      }
      throw Error(JSON.stringify(body))
    })
  })
}

export const fetchTokens = (config: TInternalConfig): Promise<TTokenResponse> => {
  const storage = config.storage === 'session' ? sessionStorage : localStorage
  /*
    The browser has been redirected from the authentication endpoint with
    a 'code' url parameter.
    This code will now be exchanged for Access- and Refresh Tokens.
  */
  const urlParams = new URLSearchParams(window.location.search)
  const authCode = urlParams.get('code')
  const codeVerifier = storage.getItem(codeVerifierStorageKey)

  if (!authCode) {
    throw Error("Parameter 'code' not found in URL. \nHas authentication taken place?")
  }
  if (!codeVerifier) {
    throw Error("Can't get tokens without the CodeVerifier. \nHas authentication taken place?")
  }

  const tokenRequest: TTokenRequestWithCodeAndVerifier = {
    grant_type: 'authorization_code',
    code: authCode,
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
    ...config.extraTokenParameters,
    // TODO: Remove in 2.0
    ...config.extraAuthParams,
  }
  return postTokenRequest(config.tokenEndpoint, tokenRequest, config.tokenRequestCredentials)
}

export const fetchWithRefreshToken = (props: {
  config: TInternalConfig
  refreshToken: string
}): Promise<TTokenResponse> => {
  const { config, refreshToken } = props
  const refreshRequest: TTokenRequestForRefresh = {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    ...config.extraTokenParameters,
  }
  if (config.refreshWithScope) refreshRequest.scope = config.scope
  return postTokenRequest(config.tokenEndpoint, refreshRequest, config.tokenRequestCredentials)
}

export function redirectToLogout(
  config: TInternalConfig,
  token: string,
  refresh_token?: string,
  idToken?: string,
  state?: string,
  logoutHint?: string,
  additionalParameters?: TPrimitiveRecord
) {
  const params = new URLSearchParams({
    token: refresh_token || token,
    token_type_hint: refresh_token ? 'refresh_token' : 'access_token',
    client_id: config.clientId,
    post_logout_redirect_uri: config.logoutRedirect ?? config.redirectUri,
    ui_locales: window.navigator.languages.join(' '),
    ...config.extraLogoutParameters,
    ...additionalParameters,
  })
  if (idToken) params.append('id_token_hint', idToken)
  if (state) params.append('state', state)
  if (logoutHint) params.append('logout_hint', logoutHint)
  window.location.assign(`${config.logoutEndpoint}?${params.toString()}`)
}

export function validateState(urlParams: URLSearchParams, storageType: TInternalConfig['storage']) {
  const storage = storageType === 'session' ? sessionStorage : localStorage
  const receivedState = urlParams.get('state')
  const loadedState = storage.getItem(stateStorageKey)
  if (receivedState !== loadedState) {
    throw new Error(
      '"state" value received from authentication server does no match client request. Possible cross-site request forgery'
    )
  }
}
