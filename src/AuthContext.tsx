import React, { createContext, useEffect, useMemo, useRef, useState } from 'react'
import useBrowserStorage from './Hooks'
import { Mutex } from 'async-mutex'
import { createInternalConfig } from './authConfig'
import { fetchTokens, fetchWithRefreshToken, redirectToLogin, redirectToLogout, validateState } from './authentication'
import { decodeJWT } from './decodeJWT'
import { FALLBACK_EXPIRE_TIME, epochAtSecondsFromNow, epochTimeIsPast, getRefreshExpiresIn } from './timeUtils'
import { IAuthContext, IAuthProvider, TInternalConfig, TPrimitiveRecord, TTokenData, TTokenResponse } from './types'

export const AuthContext = createContext<IAuthContext>({
  token: undefined,
  logIn: () => null,
  logOut: () => null,
  error: null,
  isLoading: false,
  getTokenSilently: () => Promise.resolve(''),
})

export const AuthProvider = ({ authConfig, children }: IAuthProvider) => {
  const config: TInternalConfig = useMemo(() => createInternalConfig(authConfig), [authConfig])
  const storage: Storage = config.storage === 'session' ? sessionStorage : localStorage
  const mutex = new Mutex()

  const loginInProgressStorageKey = `${config.storageKeyPrefix}loginInProgress`
  const logoutInProgressStorageKey = `${config.storageKeyPrefix}logoutInProgress`
  const tokenStorageKey = `${config.storageKeyPrefix}token`

  const [tokenData, setTokenData] = useState<TTokenData | undefined>()
  const [isLoading, setIsLoading] = useState<boolean>(
    () =>
      storage.getItem(loginInProgressStorageKey) === 'true' || storage.getItem(logoutInProgressStorageKey) === 'true'
  )
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => storage.getItem(tokenStorageKey) !== null)
  const [idTokenData, setIdTokenData] = useState<TTokenData | undefined>()
  const [error, setError] = useState<string | null>(null)

  const [getRefreshToken, setRefreshToken] = useBrowserStorage<string | undefined>({
    key: `${config.storageKeyPrefix}refreshToken`,
    initialValue: undefined,
    storage,
  })
  const [getRefreshTokenExpire, setRefreshTokenExpire] = useBrowserStorage<number | undefined>({
    key: `${config.storageKeyPrefix}refreshTokenExpire`,
    initialValue: undefined,
    storage,
  })
  const [getTokenExpire, setTokenExpire] = useBrowserStorage<number | undefined>({
    key: `${config.storageKeyPrefix}tokenExpire`,
    initialValue: undefined,
    storage,
  })
  const [getToken, setToken] = useBrowserStorage<string | undefined>({
    key: tokenStorageKey,
    initialValue: undefined,
    storage,
    onChange: (token) => {
      setIsAuthenticated(!!token)

      try {
        if (token && config.decodeToken) {
          setTokenData(decodeJWT(token))
        }
      } catch (e) {
        console.warn(`Failed to decode access token: ${(e as Error).message}`)
      }
    },
  })
  const [getIdToken, setIdToken] = useBrowserStorage<string | undefined>({
    key: `${config.storageKeyPrefix}idToken`,
    initialValue: undefined,
    storage,
    onChange: (idToken) => {
      try {
        if (idToken) {
          setIdTokenData(decodeJWT(idToken))
        }
      } catch (e) {
        console.warn(`Failed to decode idToken: ${(e as Error).message}`)
      }
    },
  })
  const [getLoginMethod, setLoginMethod] = useBrowserStorage<'redirect' | 'popup'>({
    key: `${config.storageKeyPrefix}loginMethod`,
    initialValue: 'redirect',
    storage,
  })
  const [getLoginInProgress, setLoginInProgress] = useBrowserStorage<boolean>({
    key: loginInProgressStorageKey,
    initialValue: false,
    storage,
    onChange: (loginInProgress) => setIsLoading(loginInProgress === true),
  })
  const [getLogoutInProgress, setLogoutInProgress] = useBrowserStorage<boolean>({
    key: logoutInProgressStorageKey,
    initialValue: false,
    storage,
    onChange: (logoutInProgress) => setIsLoading(logoutInProgress === true),
  })

  function clearStorage() {
    setRefreshToken(undefined)
    setToken(undefined)
    setTokenExpire(undefined)
    setRefreshTokenExpire(undefined)
    setIdToken(undefined)
    setTokenData(undefined)
    setIdTokenData(undefined)
    setLoginInProgress(false)
  }

  function logOut(state?: string, logoutHint?: string, additionalParameters?: TPrimitiveRecord) {
    const refreshToken = getRefreshToken()
    const token = getToken()
    const idToken = getIdToken()
    clearStorage()
    setLogoutInProgress(true)
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
    setRefreshToken(response.refresh_token)
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
    const refreshTokenExpire = getRefreshTokenExpire()
    if (!refreshTokenExpire || config.refreshTokenExpiryStrategy !== 'absolute') {
      const refreshTokenExpiresIn = config.refreshTokenExpiresIn ?? getRefreshExpiresIn(tokenExpiresIn, response)
      setRefreshTokenExpire(epochAtSecondsFromNow(refreshTokenExpiresIn))
    }
  }

  async function refreshAccessToken(): Promise<string> {
    const refreshToken = getRefreshToken()
    if (!refreshToken) throw new Error('No refresh token available')

    const refreshTokenExpire = getRefreshTokenExpire()
    if (!refreshTokenExpire) throw new Error('No refresh token expire available')

    // The refreshToken has expired
    if (epochTimeIsPast(refreshTokenExpire)) throw new Error('Refresh token expired')

    // The access_token has expired, and we have a non-expired refresh_token. Use it to refresh access_token.
    try {
      const result: TTokenResponse = await fetchWithRefreshToken({
        config,
        refreshToken,
      })

      handleTokenResponse(result)

      return result.access_token
    } catch (error) {
      throw error
    }
  }

  async function getTokenSilently(): Promise<string> {
    return await mutex.runExclusive(async () => {
      const token = getToken()
      if (!token) throw new Error('No token available')

      const tokenExpire = getTokenExpire()
      if (!tokenExpire) throw new Error('No token expire available')

      // The access_token has expired
      if (epochTimeIsPast(tokenExpire)) {
        const newToken = await refreshAccessToken()
        return newToken
      }

      return token
    })
  }

  // This ref is used to make sure the 'fetchTokens' call is only made once.
  // Multiple calls with the same code will, and should, return an error from the API
  // See: https://beta.reactjs.org/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development
  const didFetchTokens = useRef(false)

  // Runs once on page load
  useEffect(() => {
    // The client has been redirected back from the auth endpoint with an auth code
    const loginInProgress = getLoginInProgress()
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
            const loginMethod = getLoginMethod()
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

    // The client has been redirected back from the auth endpoint after a logout
    const logoutInProgress = getLogoutInProgress()
    if (logoutInProgress) {
      setLogoutInProgress(false)

      // Call any postLogout function in authConfig
      if (config?.postLogout) config.postLogout()
      return
    }

    // First page visit
    const token = getToken()
    if (!token && config.autoLogin) return logIn()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        getTokenSilently,
        tokenData,
        idTokenData,
        logIn,
        logOut,
        error,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
