import React, { createContext, useEffect, useState } from 'react'
import {
  decodeToken,
  fetchWithRefreshToken,
  fetchTokens,
  login,
  tokenExpired,
  errorMessageForExpiredRefreshToken,
} from "./authentication"
import useLocalStorage from "./Hooks"
import { IAuthProvider, TTokenData } from "./Types"
import { validateAuthConfig } from './validateAuthConfig'

export const AuthContext = createContext({})


export const AuthProvider = ({ authConfig, children }: IAuthProvider) => {
  const [refreshToken, setRefreshToken] = useLocalStorage<string | null>('ROCP_refreshToken', null)
  const [token, setToken] = useLocalStorage<string | null>('ROCP_token', null)
  const [idToken, setIdToken] = useLocalStorage<string | null>('ROCP_idToken', null)
  const [loginInProgress, setLoginInProgress] = useLocalStorage<boolean>('ROCP_loginInProgress', false)
  const [tokenData, setTokenData] = useState<TTokenData>()
  const [error, setError] = useState<string | null>(null)

  let interval: any

  validateAuthConfig(authConfig)

  function logOut() {
    setRefreshToken(null)
    setToken(null)
    setIdToken(null)
    setTokenData(undefined)
    setLoginInProgress(false)
  }

  function handleTokenResponse(response: any) {
    setRefreshToken(response.refresh_token)
    setToken(response.access_token)
    setIdToken(response?.id_token || "None")
    setLoginInProgress(false)
    setTokenData(decodeToken(response.access_token))
  }

  function refreshAccessToken() {
    if (refreshToken) {
      if (tokenExpired(token)) { // The client has an expired token. Will try to get a new one with the refreshToken
        fetchWithRefreshToken({ authConfig, refreshToken })
          .then((result: any) => handleTokenResponse(result))
          .catch((error: string) => {
            setError(error)
            if(errorMessageForExpiredRefreshToken(error)){
              logOut()
              login(authConfig)
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
        fetchTokens(authConfig)
          .then((tokens: any) => {
            handleTokenResponse(tokens)
            history.replaceState(null, "", location.pathname)  // Clear ugly url params
            // Call any postLogin function in authConfig
            if (authConfig?.postLogin) authConfig.postLogin()
          })
          .catch((error: string) => {
            setError(error)
          })
      }
    } else if (!token) {  // First page visit
      setLoginInProgress(true)
      login(authConfig)
    } else {
      refreshAccessToken() // Check if token should be updated and sets tokenData
    }
  }, [])

  return (
    <AuthContext.Provider value={{ tokenData, token, idToken, logOut, error }}>{children}</AuthContext.Provider>
  )
}
