import React, { createContext, useEffect, useState } from 'react'
import {
  decodeJWT,
  errorMessageForExpiredRefreshToken,
  fetchTokens,
  fetchWithRefreshToken,
  login,
  timeOfExpire,
  tokenExpired,
} from "./authentication"
import useLocalStorage from "./Hooks"
import { IAuthContext, IAuthProvider, TInternalConfig, TTokenData, TTokenResponse } from "./Types"
import { validateAuthConfig } from './validateAuthConfig'

export const AuthContext = createContext<IAuthContext>({ token: '', logOut: () => null, error: null })

export const AuthProvider = ({ authConfig, children }: IAuthProvider) => {
  const [refreshToken, setRefreshToken] = useLocalStorage<string | null>('ROCP_refreshToken', null)
  const [token, setToken] = useLocalStorage<string | null>('ROCP_token', null)
  const [tokenExpire, setTokenExpire] = useLocalStorage<string | null>('ROCP_tokenExpire', null)
  const [idToken, setIdToken] = useLocalStorage<string | null>('ROCP_idToken', null)
  const [loginInProgress, setLoginInProgress] = useLocalStorage<boolean>('ROCP_loginInProgress', false)
  const [tokenData, setTokenData] = useState<TTokenData | null>(null)
  const [error, setError] = useState<string | null>(null)

  let interval: any

  // Set default values and override from passed config
  const {
    decodeToken = true,
    scope = "",
    preLogin = () => null,
    postLogin = () => null,
  } = authConfig

  const config: TInternalConfig = {
    decodeToken: decodeToken,
    scope: scope,
    preLogin: preLogin,
    postLogin: postLogin,
    ...authConfig,
  }

  validateAuthConfig(config)

  function logOut() {
    setRefreshToken(null)
    setToken(null)
    setIdToken(null)
    setTokenData(null)
    setLoginInProgress(false)
  }

  function handleTokenResponse(response: TTokenResponse) {
    setRefreshToken(response?.refresh_token)
    setToken(response.access_token)
    setTokenExpire(timeOfExpire(response.expires_in))
    setIdToken(response?.id_token)
    setLoginInProgress(false)
    if (config.decodeToken) setTokenData(decodeJWT(response.access_token))
  }

  function refreshAccessToken() {
    if (refreshToken) {
      if (tokenExpired(tokenExpire)) { // The client has an expired token. Will try to get a new one with the refreshToken
        fetchWithRefreshToken({ config, refreshToken })
          .then((result: any) => handleTokenResponse(result))
          .catch((error: string) => {
            setError(error)
            if (errorMessageForExpiredRefreshToken(error)) {
              logOut()
              login(config)
            }
          })
      }
    } else { // No refresh_token
      console.error("Tried to refresh token without a refresh token.")
      setError('Bad authorization state. Refreshing the page might solve the issue.')
    }
  }

  // Register the 'check for soon expiring access token' interval (Every minute)
  useEffect(() => {
    interval = setInterval(() => refreshAccessToken(), 60000)
    return () => clearInterval(interval)
  }, [token]) // This token dependency removes the old, and registers a new Interval when a new token is fetched.

  // Runs once on page load
  useEffect(() => {
    if (loginInProgress) {  // The client has been redirected back from the Auth endpoint with an auth code
      const urlParams = new URLSearchParams(window.location.search)
      if (!urlParams.get('code')) {
        // This should not happen. There should be a 'code' parameter in the url by now..."
        const error_description = urlParams.get('error_description') || 'Bad authorization state. Refreshing the page might solve the issue.'
        console.error(error_description)
        setError(error_description)
        logOut()
      } else { // Request token from auth server with the auth code
        fetchTokens(config)
          .then((tokens: any) => {
            handleTokenResponse(tokens)
            history.replaceState(null, "", location.pathname)  // Clear ugly url params
            // Call any postLogin function in authConfig
            config.postLogin()
          })
          .catch((error: string) => {
            setError(error)
          })
      }
    } else if (!token) {  // First page visit
      setLoginInProgress(true)
      login(config)
    } else {
      if (decodeToken) setTokenData(decodeJWT(token))
      refreshAccessToken() // Check if token should be updated
    }
  }, [])

  return (
    <AuthContext.Provider value={{ tokenData, token, idToken, logOut, error }}>{children}</AuthContext.Provider>
  )
}
