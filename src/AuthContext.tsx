import React, { createContext, useEffect, useMemo, useRef, useState } from 'react'
import { fetchTokens, fetchWithRefreshToken, redirectToLogin, redirectToLogout, validateState } from './authentication'
import useBrowserStorage from './Hooks'
import {
  IAuthContext,
  IAuthProvider,
  TInternalConfig,
  TRefreshTokenExpiredEvent,
  TTokenData,
  TTokenResponse,
} from './Types'
import { createInternalConfig } from './authConfig'
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
  const config: TInternalConfig = useMemo(() => createInternalConfig(authConfig), [authConfig])

  const [refreshToken, setRefreshToken] = useBrowserStorage<string | undefined>(
    'ROCP_refreshToken',
    undefined,
    config.storage
  )
  const [refreshTokenExpire, setRefreshTokenExpire] = useBrowserStorage<number>(
    'ROCP_refreshTokenExpire',
    epochAtSecondsFromNow(2 * FALLBACK_EXPIRE_TIME),
    config.storage
  )
  const [token, setToken] = useBrowserStorage<string>('ROCP_token', '', config.storage)
  const [tokenExpire, setTokenExpire] = useBrowserStorage<number>(
    'ROCP_tokenExpire',
    epochAtSecondsFromNow(FALLBACK_EXPIRE_TIME),
    config.storage
  )
  const [idToken, setIdToken] = useBrowserStorage<string | undefined>('ROCP_idToken', undefined, config.storage)
  const [loginInProgress, setLoginInProgress] = useBrowserStorage<boolean>(
    'ROCP_loginInProgress',
    false,
    config.storage
  )
  const [refreshInProgress, setRefreshInProgress] = useBrowserStorage<boolean>(
    'ROCP_refreshInProgress',
    false,
    config.storage
  )
  const [tokenData, setTokenData] = useState<TTokenData | undefined>()
  const [idTokenData, setIdTokenData] = useState<TTokenData | undefined>()
  const [error, setError] = useState<string | null>(null)

  let interval: any

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
    if (config?.logoutEndpoint) redirectToLogout(config, token, refreshToken, idToken, state, logoutHint)
  }

  function login(state?: string) {
    clearStorage()
    setLoginInProgress(true)
    // TODO: Raise error on wrong state type in v2
    let typeSafePassedState = state
    if (state && typeof state !== 'string') {
      console.warn(`Passed login state must be of type 'string'. Received '${state}'. Ignoring value...`)
      typeSafePassedState = undefined
    }
    redirectToLogin(config, typeSafePassedState).catch((error) => {
      console.error(error)
      setError(error.message)
      setLoginInProgress(false)
    })
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
      if (response.id_token) setIdTokenData(decodeJWT(response.id_token))
    } catch (e) {
      console.warn(`Failed to decode idToken: ${(e as Error).message}`)
    }
    try {
      if (config.decodeToken) setTokenData(decodeJWT(response.access_token))
    } catch (e) {
      console.warn(`Failed to decode access token: ${(e as Error).message}`)
    }
  }

  function handleExpiredRefreshToken(initial = false): void {
    // If it's the first page load, OR there is no sessionExpire callback, we trigger a new login
    if (initial) return login()
    // TODO: Breaking change - remove automatic login during ongoing session
    else if (!config.onRefreshTokenExpire) return login()
    else return config.onRefreshTokenExpire({ login } as TRefreshTokenExpiredEvent)
  }

  function refreshAccessToken(initial = false): void {
    if (!token) return
    // The token has not expired. Do nothing
    if (!epochTimeIsPast(tokenExpire)) return

    // Other instance (tab) is currently refreshing. This instance skip the refresh if not initial
    if (refreshInProgress && !initial) return

    // The refreshToken has expired
    if (epochTimeIsPast(refreshTokenExpire)) return handleExpiredRefreshToken(initial)

    // The access_token has expired, and we have a non-expired refresh_token. Use it to refresh access_token.
    if (refreshToken) {
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
      return
    }
    console.warn(
      'Failed to refresh access_token. Most likely there is no refresh_token, or the authentication server did not reply with an explicit expire time, and the default expire times are longer than the actual tokens expire time'
    )
  }

  // Register the 'check for soon expiring access token' interval (Every 10 seconds)
  useEffect(() => {
    interval = setInterval(() => refreshAccessToken(), 10000) // eslint-disable-line
    return () => clearInterval(interval)
  }, [token, refreshToken, refreshTokenExpire, tokenExpire]) // Replace the interval with a new when values used inside refreshAccessToken changes

  // This ref is used to make sure the 'fetchTokens' call is only made once.
  // Multiple calls with the same code will, and should, return an error from the API
  // See: https://beta.reactjs.org/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development
  const didFetchTokens = useRef(false)

  // Runs once on page load
  useEffect(() => {
    // The client has been redirected back from the auth endpoint with an auth code
    if (loginInProgress) {
      const urlParams = new URLSearchParams(window.location.search)
      if (!urlParams.get('code')) {
        // This should not happen. There should be a 'code' parameter in the url by now..."
        const error_description =
          urlParams.get('error_description') || 'Bad authorization state. Refreshing the page might solve the issue.'
        console.error(error_description)
        setError(error_description)
        logOut()
        return
      }
      // Make sure we only try to use the auth code once
      if (!didFetchTokens.current) {
        didFetchTokens.current = true
        try {
          validateState(urlParams)
        } catch (e: any) {
          console.error(e)
          setError((e as Error).message)
        }
        // Request tokens from auth server with the auth code
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
        return
      }
    }

    // First page visit
    if (!token && config.autoLogin) return login()

    // Page refresh after login has succeeded
    try {
      if (idToken) setIdTokenData(decodeJWT(idToken))
    } catch (e) {
      console.warn(`Failed to decode idToken: ${(e as Error).message}`)
    }
    try {
      if (config.decodeToken) setTokenData(decodeJWT(token))
    } catch (e) {
      console.warn(`Failed to decode access token: ${(e as Error).message}`)
    }
    refreshAccessToken(true) // Check if token should be updated
  }, []) // eslint-disable-line

  return (
    <AuthContext.Provider value={{ token, tokenData, idToken, idTokenData, login, logOut, error, loginInProgress }}>
      {children}
    </AuthContext.Provider>
  )
}
