import React, { createContext, useEffect, useMemo, useRef, useState } from 'react'
import useBrowserStorage from './Hooks'
import { createInternalConfig } from './authConfig'
import { fetchTokens, fetchWithRefreshToken, redirectToLogin, redirectToLogout, validateState } from './authentication'
import { decodeJWT } from './decodeJWT'
import { FetchError } from './errors'
import { FALLBACK_EXPIRE_TIME, epochAtSecondsFromNow, epochTimeIsPast, getRefreshExpiresIn } from './timeUtils'
import {
  IAuthContext,
  IAuthProvider,
  TInternalConfig,
  TPrimitiveRecord,
  TRefreshTokenExpiredEvent,
  TTokenData,
  TTokenResponse,
} from './types'

export const AuthContext = createContext<IAuthContext>({
  token: '',
  login: () => null,
  logIn: () => null,
  logOut: () => null,
  error: null,
  loginInProgress: false,
})

export const AuthProvider = ({ authConfig, children }: IAuthProvider) => {
  const config: TInternalConfig = useMemo(() => createInternalConfig(authConfig), [authConfig])

  const [refreshToken, setRefreshToken] = useBrowserStorage<string | undefined>(
    `${config.storageKeyPrefix}refreshToken`,
    undefined,
    config.storage
  )
  const [refreshTokenExpire, setRefreshTokenExpire] = useBrowserStorage<number | undefined>(
    `${config.storageKeyPrefix}refreshTokenExpire`,
    undefined,
    config.storage
  )
  const [token, setToken] = useBrowserStorage<string>(`${config.storageKeyPrefix}token`, '', config.storage)
  const [tokenExpire, setTokenExpire] = useBrowserStorage<number>(
    `${config.storageKeyPrefix}tokenExpire`,
    epochAtSecondsFromNow(FALLBACK_EXPIRE_TIME),
    config.storage
  )
  const [idToken, setIdToken] = useBrowserStorage<string | undefined>(
    `${config.storageKeyPrefix}idToken`,
    undefined,
    config.storage
  )
  const [loginInProgress, setLoginInProgress] = useBrowserStorage<boolean>(
    `${config.storageKeyPrefix}loginInProgress`,
    false,
    config.storage
  )
  const [refreshInProgress, setRefreshInProgress] = useBrowserStorage<boolean>(
    `${config.storageKeyPrefix}refreshInProgress`,
    false,
    config.storage
  )
  const [loginMethod, setLoginMethod] = useBrowserStorage<'redirect' | 'popup'>(
    `${config.storageKeyPrefix}loginMethod`,
    'redirect',
    config.storage
  )
  const [tokenData, setTokenData] = useState<TTokenData | undefined>()
  const [idTokenData, setIdTokenData] = useState<TTokenData | undefined>()
  const [error, setError] = useState<string | null>(null)

  function clearStorage() {
    setRefreshToken(undefined)
    setToken('')
    setTokenExpire(epochAtSecondsFromNow(FALLBACK_EXPIRE_TIME))
    setRefreshTokenExpire(undefined)
    setIdToken(undefined)
    setTokenData(undefined)
    setIdTokenData(undefined)
    setLoginInProgress(false)
  }

  function logOut(state?: string, logoutHint?: string, additionalParameters?: TPrimitiveRecord) {
    clearStorage()
    setError(null)
    if (config?.logoutEndpoint && token)
      redirectToLogout(config, token, refreshToken, idToken, state, logoutHint, additionalParameters)
  }

  function logIn(state?: string, additionalParameters?: TPrimitiveRecord, method: 'redirect' | 'popup' = 'redirect') {
    clearStorage()
    setLoginInProgress(true)
    setLoginMethod(method)
    // TODO: Raise error on wrong state type in v2
    let typeSafePassedState = state
    if (state && typeof state !== 'string') {
      const jsonState = JSON.stringify(state)
      console.warn(
        `Passed login state must be of type 'string'. Received '${jsonState}'. Ignoring value. In a future version, an error will be thrown here.`
      )
      typeSafePassedState = undefined
    }
    redirectToLogin(config, typeSafePassedState, additionalParameters, method).catch((error) => {
      console.error(error)
      setError(error.message)
      setLoginInProgress(false)
    })
  }

  function handleTokenResponse(response: TTokenResponse) {
    setToken(response.access_token)
    setIdToken(response.id_token)
    let tokenExp = FALLBACK_EXPIRE_TIME
    // Decode IdToken, so we can use "exp" from that as fallback if expire not returned in the response
    try {
      if (response.id_token) {
        const decodedToken = decodeJWT(response.id_token)
        tokenExp = Math.round(Number(decodedToken.exp) - Date.now() / 1000) // number of seconds from now
      }
    } catch (e) {
      console.warn(`Failed to decode idToken: ${(e as Error).message}`)
    }
    const tokenExpiresIn = config.tokenExpiresIn ?? response.expires_in ?? tokenExp
    setTokenExpire(epochAtSecondsFromNow(tokenExpiresIn))
    const refreshTokenExpiresIn = config.refreshTokenExpiresIn ?? getRefreshExpiresIn(tokenExpiresIn, response)
    if (response.refresh_token) {
      setRefreshToken(response.refresh_token)
      if(!refreshTokenExpire || config.refreshTokenExpiryStrategy !== 'absolute'){
        setRefreshTokenExpire(epochAtSecondsFromNow(refreshTokenExpiresIn))
      }
    }
  }

  function handleExpiredRefreshToken(initial = false): void {
    // If it's the first page load, OR there is no sessionExpire callback, we trigger a new login
    if (initial) return logIn()

    // TODO: Breaking change - remove automatic login during ongoing session
    if (!config.onRefreshTokenExpire) return logIn()

    config.onRefreshTokenExpire({
      login: logIn,
      logIn,
    } as TRefreshTokenExpiredEvent)
  }

  function refreshAccessToken(initial = false): void {
    if (!token) return
    // The token has not expired. Do nothing
    if (!epochTimeIsPast(tokenExpire)) return

    // Other instance (tab) is currently refreshing. This instance skip the refresh if not initial
    if (refreshInProgress && !initial) return

    // If no refreshToken, act as if the refreshToken expired (session expired)
    if (!refreshToken) return handleExpiredRefreshToken(initial)

    // The refreshToken has expired
    if (refreshTokenExpire && epochTimeIsPast(refreshTokenExpire)) return handleExpiredRefreshToken(initial)

    // The access_token has expired, and we have a non-expired refresh_token. Use it to refresh access_token.
    if (refreshToken) {
      setRefreshInProgress(true)
      fetchWithRefreshToken({ config, refreshToken })
        .then((result: TTokenResponse) => handleTokenResponse(result))
        .catch((error: unknown) => {
          if (error instanceof FetchError) {
            // If the fetch failed with status 400, assume expired refresh token
            if (error.status === 400) {
              handleExpiredRefreshToken(initial)
              return
            }
            // Unknown error. Set error, and log in if first page load
            console.error(error)
            setError(error.message)
            if (initial) logIn()
          }
          // Unknown error. Set error, and log in if first page load
          else if (error instanceof Error) {
            console.error(error)
            setError(error.message)
            if (initial) logIn()
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

  // Register the 'check for soon expiring access token' interval (every ~10 seconds).
  useEffect(() => {
    console.log('Registering interval for token refresh')
    // The randomStagger is used to avoid multiple tabs logging in at the exact same time.
    const randomStagger = 10000 * Math.random()
    const interval = setInterval(() => refreshAccessToken(), 5000 + randomStagger)
    return () => clearInterval(interval)
  }, [token, refreshToken, refreshTokenExpire, tokenExpire]) // Replace the interval with a new when values used inside refreshAccessToken changes

  // This ref is used to make sure the 'fetchTokens' call is only made once.
  // Multiple calls with the same code will, and should, return an error from the API
  // See: https://beta.reactjs.org/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development
  const didFetchTokens = useRef(false)

  // Load token-/idToken-data when tokens change
  useEffect(() => {
    try {
      if (idToken) setIdTokenData(decodeJWT(idToken))
    } catch (e) {
      console.warn(`Failed to decode idToken: ${(e as Error).message}`)
    }
    try {
      if (token && config.decodeToken) setTokenData(decodeJWT(token))
    } catch (e) {
      console.warn(`Failed to decode access token: ${(e as Error).message}`)
    }
  }, [token, idToken])

  // Runs once on page load
  useEffect(() => {
    // The client has been redirected back from the auth endpoint with an auth code
    if (loginInProgress) {
      const urlParams = new URLSearchParams(window.location.search)
      if (!urlParams.get('code')) {
        // This should not happen. There should be a 'code' parameter in the url by now...
        const error_description =
          urlParams.get('error_description') ||
          'Bad authorization state. Refreshing the page and log in again might solve the issue.'
        console.error(
          `${error_description}\nExpected  to find a '?code=' parameter in the URL by now. Did the authentication get aborted or interrupted?`
        )
        setError(error_description)
        clearStorage()
        return
      }
      // Make sure we only try to use the auth code once
      if (!didFetchTokens.current) {
        didFetchTokens.current = true
        try {
          validateState(urlParams, config.storage)
        } catch (e: unknown) {
          console.error(e)
          setError((e as Error).message)
        }
        // Request tokens from auth server with the auth code
        fetchTokens(config)
          .then((tokens: TTokenResponse) => {
            handleTokenResponse(tokens)
            // Call any postLogin function in authConfig
            if (config?.postLogin) config.postLogin()
            if (loginMethod === 'popup') window.close()
          })
          .catch((error: Error) => {
            console.error(error)
            setError(error.message)
          })
          .finally(() => {
            if (config.clearURL) {
              // Clear ugly url params
              window.history.replaceState(null, '', `${window.location.pathname}${window.location.hash}`)
            }
            setLoginInProgress(false)
          })
      }
      return
    }

    // First page visit
    if (!token && config.autoLogin) return logIn()
    refreshAccessToken(true) // Check if token should be updated
  }, [])

  return (
    <AuthContext.Provider
      value={{
        token,
        tokenData,
        idToken,
        idTokenData,
        login: logIn,
        logIn,
        logOut,
        error,
        loginInProgress,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
