import React, { createContext, useEffect, useState } from 'react' // eslint-disable-line
import {
  decodeToken,
  errorMessageForExpiredRefreshToken,
  fetchTokens,
  fetchWithRefreshToken,
  login,
  tokenExpired,
} from './authentication'
import useLocalStorage from './Hooks'
import { IAuthContext, IAuthProvider, TTokenData, TTokenResponse } from './Types'
import { validateAuthConfig } from './validateAuthConfig'

export const AuthContext = createContext<IAuthContext>({
  token: '',
  logOut: () => null,
  error: null,
})

export const AuthProvider = ({ authConfig, children }: IAuthProvider) => {
  const [refreshToken, setRefreshToken] = useLocalStorage<string | null>('ROCP_refreshToken', null)
  const [token, setToken] = useLocalStorage<string>('ROCP_token', '')
  const [idToken, setIdToken] = useLocalStorage<string | undefined>('ROCP_idToken', undefined)
  const [loginInProgress, setLoginInProgress] = useLocalStorage<boolean>('ROCP_loginInProgress', false)
  const [tokenData, setTokenData] = useState<TTokenData | undefined>()
  const [error, setError] = useState<string | null>(null)

  let interval: any

  validateAuthConfig(authConfig)

  function logOut() {
    setRefreshToken(null)
    setToken('')
    setIdToken(undefined)
    setTokenData(undefined)
    setLoginInProgress(false)
  }

  function handleTokenResponse(response: TTokenResponse) {
    setRefreshToken(response.refresh_token)
    setToken(response.access_token)
    setIdToken(response?.id_token || 'None')
    setLoginInProgress(false)
    setTokenData(decodeToken(response.access_token))
  }

  function refreshAccessToken() {
    if (refreshToken) {
      if (token && tokenExpired(token)) {
        // The client has an expired token. Will try to get a new one with the refreshToken
        fetchWithRefreshToken({ authConfig, refreshToken })
          .then((result) => handleTokenResponse(result))
          .catch((error: string) => {
            setError(error)
            if (errorMessageForExpiredRefreshToken(error)) {
              logOut()
              login(authConfig)
            }
          })
      }
    } else {
      // No refresh_token
      console.error('Tried to refresh access_token without a refresh_token.')
      setError('Bad authorization state. Refreshing the page might solve the issue.')
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
        fetchTokens(authConfig)
          .then((tokens: TTokenResponse) => {
            handleTokenResponse(tokens)
            window.history.replaceState(null, '', window.location.pathname) // Clear ugly url params
            // Call any postLogin function in authConfig
            if (authConfig?.postLogin) authConfig.postLogin()
          })
          .catch((error: string) => {
            setError(error)
          })
      }
    } else if (!token) {
      // First page visit
      setLoginInProgress(true)
      login(authConfig)
    } else {
      setTokenData(decodeToken(token))
      refreshAccessToken() // Check if token should be updated
    }
  }, []) // eslint-disable-line

  return <AuthContext.Provider value={{ tokenData, token, idToken, logOut, error }}>{children}</AuthContext.Provider>
}
