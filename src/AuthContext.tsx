import React, { createContext, useEffect, useState } from 'react' // eslint-disable-line
import {
  errorMessageForExpiredRefreshToken,
  fetchTokens,
  fetchWithRefreshToken,
  redirectToLogout,
  redirectToLogin,
} from './authentication'
import useLocalStorage from './Hooks'
import {
  IAuthContext,
  IAuthProvider,
  TRefreshTokenExpiredEvent,
  TInternalConfig,
  TTokenData,
  TTokenResponse,
} from './Types'
import { validateAuthConfig } from './validateAuthConfig'
import { epochAtSecondsFromNow, epochTimeIsPast } from './timeUtils'
import { decodeJWT } from './decodeJWT'

const FALLBACK_EXPIRE_TIME = 600 // 10minutes

export const AuthContext = createContext<IAuthContext>({
  token: '',
  login: () => null,
  logOut: () => null,
  error: null,
  loginInProgress: false,
})

export const AuthProvider = ({ authConfig, children }: IAuthProvider) => {
  const [refreshToken, setRefreshToken] = useLocalStorage<string | undefined>('ROCP_refreshToken', undefined)
  const [refreshTokenExpire, setRefreshTokenExpire] = useLocalStorage<number>(
    'ROCP_refreshTokenExpire',
    epochAtSecondsFromNow(2 * FALLBACK_EXPIRE_TIME)
  )
  const [token, setToken] = useLocalStorage<string>('ROCP_token', '')
  const [tokenExpire, setTokenExpire] = useLocalStorage<number>(
    'ROCP_tokenExpire',
    epochAtSecondsFromNow(FALLBACK_EXPIRE_TIME)
  )
  const [idToken, setIdToken] = useLocalStorage<string | undefined>('ROCP_idToken', undefined)
  const [loginInProgress, setLoginInProgress] = useLocalStorage<boolean>('ROCP_loginInProgress', false)
  const [tokenData, setTokenData] = useState<TTokenData | undefined>()
  const [error, setError] = useState<string | null>(null)

  let interval: any

  // Set default values for internal config object
  const {
    autoLogin = true,
    decodeToken = true,
    scope = '',
    preLogin = () => null,
    postLogin = () => null,
    onRefreshTokenExpire = undefined,
  } = authConfig

  const config: TInternalConfig = {
    ...authConfig,
    autoLogin: autoLogin,
    decodeToken: decodeToken,
    scope: scope,
    preLogin: preLogin,
    postLogin: postLogin,
    onRefreshTokenExpire: onRefreshTokenExpire,
  }

  validateAuthConfig(config)

  function clearStorage() {
    setRefreshToken(undefined)
    setToken('')
    setTokenExpire(epochAtSecondsFromNow(FALLBACK_EXPIRE_TIME))
    setRefreshTokenExpire(epochAtSecondsFromNow(FALLBACK_EXPIRE_TIME))
    setIdToken(undefined)
    setTokenData(undefined)
    setLoginInProgress(false)
  }

  function logOut() {
    clearStorage()
    if (config?.logoutEndpoint && refreshToken) redirectToLogout(config, refreshToken)
  }

  function login() {
    setLoginInProgress(true)
    redirectToLogin(config)
  }

  function handleTokenResponse(response: TTokenResponse) {
    setToken(response.access_token)
    setRefreshToken(response.refresh_token)
    setTokenExpire(epochAtSecondsFromNow(response.expires_in ?? FALLBACK_EXPIRE_TIME))
    // If there is no refresh_token_expire, use access_token_expire + 10min.
    // If no access_token_expire, assume double the fallback expire time
    let refreshTokenExpire = response.refresh_token_expires_in ?? 2 * FALLBACK_EXPIRE_TIME
    if (!response.refresh_token_expires_in && response.expires_in) {
      refreshTokenExpire = response.expires_in + FALLBACK_EXPIRE_TIME
    }
    setRefreshTokenExpire(epochAtSecondsFromNow(refreshTokenExpire))
    setIdToken(response.id_token)
    setLoginInProgress(false)
    try {
      if (config.decodeToken) setTokenData(decodeJWT(response.access_token))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function refreshAccessToken(initial = false): void {
    if (token && epochTimeIsPast(tokenExpire)) {
      if (refreshToken && !epochTimeIsPast(refreshTokenExpire)) {
        fetchWithRefreshToken({ config, refreshToken })
          .then((result: TTokenResponse) => handleTokenResponse(result))
          .catch((error: Error) => {
            console.error(error)
            setError(error.message)
            if (initial) login() // If the attempt to get a new token failed during page load, do a full login.
            if (errorMessageForExpiredRefreshToken(error.message)) {
              if (onRefreshTokenExpire) onRefreshTokenExpire({ login } as TRefreshTokenExpiredEvent)
            }
          })
      } else {
        if (initial) return login()

        if (onRefreshTokenExpire) onRefreshTokenExpire({ login } as TRefreshTokenExpiredEvent)
        else login() // TODO Breaking change - remove automatic login during ongoing session
      }
    }
  }

  // Register the 'check for soon expiring access token' interval (Every minute)
  useEffect(() => {
    interval = setInterval(() => refreshAccessToken(), 60000) // eslint-disable-line
    return () => clearInterval(interval)
  }, [token]) // This token dependency removes the old, and registers a new Interval when a new token is fetched.

  // Runs once on page load
  useEffect(() => {
    if (loginInProgress) {
      // The client has been redirected back from the Auth endpoint with an auth code
      const urlParams = new URLSearchParams(window.location.search)
      if (!urlParams.get('code')) {
        // This should not happen. There should be a 'code' parameter in the url by now..."
        const error_description =
          urlParams.get('error_description') || 'Bad authorization state. Refreshing the page might solve the issue.'
        console.error(error_description)
        setError(error_description)
        logOut()
      } else {
        // Request token from auth server with the auth code
        fetchTokens(config)
          .then((tokens: TTokenResponse) => {
            handleTokenResponse(tokens)
            window.history.replaceState(null, '', window.location.pathname) // Clear ugly url params
            // Call any postLogin function in authConfig
            if (config?.postLogin) config.postLogin()
          })
          .catch((error: string) => {
            setError(error)
          })
      }
    } else if (!token) {
      // First page visit
      if (config.autoLogin) login()
    } else {
      if (decodeToken) {
        try {
          setTokenData(decodeJWT(token))
        } catch (e) {
          setError((e as Error).message)
        }
      }
      refreshAccessToken(true) // Check if token should be updated
    }
  }, []) // eslint-disable-line

  return (
    <AuthContext.Provider value={{ tokenData, token, idToken, login, logOut, error, loginInProgress }}>
      {children}
    </AuthContext.Provider>
  )
}
