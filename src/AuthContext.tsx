import React, { createContext, useEffect, useState } from 'react'
import { decodeToken, getAccessTokenFromRefreshToken, getTokens, login, tokenExpired } from "./authentication"
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
        getTokens(authConfig).then((response: any) => {
          if (!response.ok) {
            console.error(response.body.error_description)
            setError(response.body.error_description)
          } else {
            handleTokenResponse(response.body)
            history.replaceState(null, "", location.pathname)  // Clear ugly url params
            // Call any postLogin function in authConfig
            if (authConfig?.postLogin) authConfig.postLogin()
          }
        })
      }
    } else if (!token) {  // First page visit
      setLoginInProgress(true)
      login(authConfig)
    } else if (refreshToken) {  // A refresh token is stored in client
      if (tokenExpired(token)) { // The client has an expired token. Will try to get a new one with the refreshToken
        getAccessTokenFromRefreshToken({ authConfig, refreshToken })
          .then(({ response }: any) => {
            handleTokenResponse(response)
          })
          .catch((error: any) => {  // For any reason we failed to get a new token with the refreshToken, login again
            console.error(error)
            setLoginInProgress(true)
            login(authConfig)
          })
      } else {  // The client still has a valid token
        setTokenData(decodeToken(token))
      }
    }
  }, [])

  return (
    <AuthContext.Provider value={{ tokenData, token, idToken, logOut, error }}>{children}</AuthContext.Provider>
  )
}