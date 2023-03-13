import React, { createContext, useEffect, useRef, useState } from 'react' // eslint-disable-line
import { fetchTokens, fetchWithRefreshToken, redirectToLogin, redirectToLogout, validateState } from './authentication'
import useLocalStorage from './Hooks'
import {
  IAuthContext,
  IAuthProvider,
  TInternalConfig,
  TRefreshTokenExpiredEvent,
  TTokenData,
  TTokenResponse,
} from './Types'
import { validateAuthConfig } from './validateAuthConfig'
import { epochAtSecondsFromNow, epochTimeIsPast, FALLBACK_EXPIRE_TIME, getRefreshExpiresIn } from './timeUtils'
import { decodeJWT } from './decodeJWT'
import { FetchError } from './errors'

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
  const [refreshInProgress, setRefreshInProgress] = useLocalStorage<boolean>('ROCP_refreshInProgress', false)
  const [tokenData, setTokenData] = useState<TTokenData | undefined>()
  const [idTokenData, setIdTokenData] = useState<TTokenData | undefined>()
  const [error, setError] = useState<string | null>(null)

  let interval: any

  // Set default values for internal config object
  const {
    autoLogin = true,
    clearURL = true,
    decodeToken = true,
    scope = '',
    preLogin = () => null,
    postLogin = () => null,
    onRefreshTokenExpire = undefined,
  } = authConfig

  const config: TInternalConfig = {
    ...authConfig,
    autoLogin: autoLogin,
    clearURL: clearURL,
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
    setIdTokenData(undefined)
    setLoginInProgress(false)
  }

  function logOut(state?: string, logoutHint?: string) {
    clearStorage()
    setError(null)
    if (config?.logoutEndpoint && refreshToken) redirectToLogout(config, refreshToken, idToken, state, logoutHint)
  }

  function login(state?: string) {
    clearStorage()
    setLoginInProgress(true)
    if (typeof state !== 'string') {
      console.warn(`Passed login state must be of type 'string'. Received '${state}'. Ignoring value...`)
      redirectToLogin(config)
      return
    }
    redirectToLogin(config, state)
  }

  function handleTokenResponse(response: TTokenResponse) {
    setToken(response.access_token)
    setRefreshToken(response.refresh_token)
    const tokenExpiresIn = config.tokenExpiresIn ?? response.expires_in ?? FALLBACK_EXPIRE_TIME
    setTokenExpire(epochAtSecondsFromNow(tokenExpiresIn))
    const refreshTokenExpiresIn = config.refreshTokenExpiresIn ?? getRefreshExpiresIn(tokenExpiresIn, response)
    setRefreshTokenExpire(epochAtSecondsFromNow(refreshTokenExpiresIn))
    setIdToken(response.id_token)
    try {
      if (config.decodeToken) setTokenData(decodeJWT(response.access_token))
      if (config.decodeToken && response.id_token) setIdTokenData(decodeJWT(response.id_token))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function handleExpiredRefreshToken(initial = false): void {
    // If it's the first page load, OR there is no sessionExpire callback, we trigger a new login
    if (initial) return login()
    // TODO: Breaking change - remove automatic login during ongoing session
    else if (!onRefreshTokenExpire) return login()
    else return onRefreshTokenExpire({ login } as TRefreshTokenExpiredEvent)
  }

  function refreshAccessToken(initial = false): void {
    // Only refresh if no other instance (tab) is currently refreshing, or it's initial page load
    if (token && epochTimeIsPast(tokenExpire) && (!refreshInProgress || initial)) {
      // We have a refreshToken, and it is not expired
      if (refreshToken && !epochTimeIsPast(refreshTokenExpire)) {
        setRefreshInProgress(true)
        fetchWithRefreshToken({ config, refreshToken })
          .then((result: TTokenResponse) => handleTokenResponse(result))
          .catch((error: unknown) => {
            if (error instanceof FetchError) {
              // If the fetch failed with status 400, assume expired refresh token
              if (error.status === 400) {
                return handleExpiredRefreshToken(initial)
              }
              // Unknown error. Set error, and login if first page load
              else {
                console.error(error)
                setError(error.message)
                if (initial) login()
              }
            }
            // Unknown error. Set error, and login if first page load
            else if (error instanceof Error) {
              console.error(error)
              setError(error.message)
              if (initial) login()
            }
          })
          .finally(() => {
            setRefreshInProgress(false)
          })
      }
      // The refreshToken has expired
      else {
        return handleExpiredRefreshToken(initial)
      }
    }
    // The token has not expired. Do nothing
    return
  }

  // Register the 'check for soon expiring access token' interval (Every 10 seconds)
  useEffect(() => {
    interval = setInterval(() => refreshAccessToken(), 10000) // eslint-disable-line
    return () => clearInterval(interval)
  }, [token]) // This token dependency removes the old, and registers a new Interval when a new token is fetched.

  // This ref is used to make sure the 'fetchTokens' call is only made once.
  // Multiple calls with the same code will, and should, return an error from the API
  // See: https://beta.reactjs.org/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development
  const didFetchTokens = useRef(false)

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
      } else if (!didFetchTokens.current) {
        didFetchTokens.current = true
        try {
          validateState(urlParams)
        } catch (e: any) {
          console.error(e)
          setError((e as Error).message)
        }
        // Request token from auth server with the auth code
        fetchTokens(config)
          .then((tokens: TTokenResponse) => {
            handleTokenResponse(tokens)
            // Call any postLogin function in authConfig
            if (config?.postLogin) config.postLogin()
          })
          .catch((error: Error) => {
            console.error(error)
            setError(error.message)
          })
          .finally(() => {
            if (config.clearURL) {
              // Clear ugly url params
              window.history.replaceState(null, '', window.location.pathname)
            }
            setLoginInProgress(false)
          })
      }
    } else if (!token) {
      // First page visit
      if (config.autoLogin) login()
    } else {
      if (decodeToken) {
        try {
          setTokenData(decodeJWT(token))
          if (idToken) setIdTokenData(decodeJWT(idToken))
        } catch (e) {
          setError((e as Error).message)
        }
      }
      refreshAccessToken(true) // Check if token should be updated
    }
  }, []) // eslint-disable-line

  return (
    <AuthContext.Provider value={{ token, tokenData, idToken, idTokenData, login, logOut, error, loginInProgress }}>
      {children}
    </AuthContext.Provider>
  )
}
