import React, { createContext, useEffect, useState } from 'react'
import { decodeToken, getAccessTokenFromRefreshToken, getTokens, login, logout, tokenExpired } from "./authentication"
import useLocalStorage from "./Hooks"
import { IAuthProvider, TTokenData } from "./Types"
import { validateAuthConfig } from './validateAuthConfig'

export const AuthContext = createContext({})


export const AuthProvider = ({ authConfig, children }: IAuthProvider) => {
  const [refreshToken, setRefreshToken] = useLocalStorage<any>('refreshToken', null)
  const [token, setToken] = useLocalStorage<any>('token', null)
  const [loginInProgress, setLoginInProgress] = useLocalStorage<Boolean>('loginInProgress', false)
  const [tokenData, setTokenData] = useState<TTokenData>()

  validateAuthConfig(authConfig)

  const logOut = () => {
    setRefreshToken(null)
    setToken(null)
    setTokenData(undefined)
    logout(authConfig)
  }

  useEffect(() => {
    if (loginInProgress) {  // The client has been redirected back from the Auth endpoint with an auth code
      const urlParams = new URLSearchParams(window.location.search)
      if (!urlParams.get('code')) {
        // This should not happen. There should be a 'code' parameter in the url by now..."
        // Clearing all site data...
        setRefreshToken(null)
        setToken(null)
        setTokenData(undefined)
        // @ts-ignore
        setLoginInProgress(false)
        location.reload()
      } else { // Request token from auth server with the auth code
        getTokens(authConfig).then((response: any) => {
          setRefreshToken(response.refresh_token)
          setToken(response.access_token)
          // @ts-ignore
          setLoginInProgress(false)
          setTokenData(decodeToken(response.access_token))
          history.replaceState(null, "", location.pathname)  // Clear ugly url params
        })
      }
    } else if (!token) {  // First page visit
      // @ts-ignore
      setLoginInProgress(true)
      login(authConfig)
    } else if (refreshToken) {  // A refresh token is stored in client
      if (tokenExpired(token)) { // The client has an expired token. Will try to get a new one with the refreshToken
        getAccessTokenFromRefreshToken({ authConfig, refreshToken })
          .then(({ response }: any) => {
            setRefreshToken(response.refresh_token)
            setToken(response.access_token)
            setTokenData(decodeToken(response.access_token))
            // @ts-ignore
            setLoginInProgress(false)
          })
          .catch((error: any) => {  // For any reason we failed to get a new token with the refreshToken, login again
            console.error(error)
            // @ts-ignore
            setLoginInProgress(true)
            login(authConfig)
          })
      } else {
        setTokenData(decodeToken(token))
      }
    }
  }, [])

  return (
    <AuthContext.Provider value={{ tokenData, token, logOut }}>{children}</AuthContext.Provider>
  )
}