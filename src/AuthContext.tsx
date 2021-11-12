import React, { createContext, useEffect, useState } from 'react'
import { decodeToken, getAccessTokenFromRefreshToken, getTokens, login, tokenExpired } from "./authentication"
import useLocalStorage from "./Hooks"
import { IAuthProvider, TTokenData } from "./Types"
import { validateAuthConfig } from './validateAuthConfig'

export const AuthContext = createContext({})


export const AuthProvider = ({ authConfig, children }: IAuthProvider) => {
  const [refreshToken, setRefreshToken] = useLocalStorage<any>('ROCP_refreshToken', null)
  const [token, setToken] = useLocalStorage<any>('ROCP_token', null)
  const [idToken, setIdToken] = useLocalStorage<any>('ROCP_idToken', null)
  const [loginInProgress, setLoginInProgress] = useLocalStorage<Boolean>('ROCP_loginInProgress', false)
  const [tokenData, setTokenData] = useState<TTokenData>()

  validateAuthConfig(authConfig)

  function logOut(){
    setRefreshToken(null)
    setToken(null)
    setIdToken(null)
    setTokenData(undefined)
    // @ts-ignore
    setLoginInProgress(false)
  }

  function handleTokenResponse(response: any){
    setRefreshToken(response.refresh_token)
    setToken(response.access_token)
    setIdToken(response?.id_token)
    // @ts-ignore
    setLoginInProgress(false)
    setTokenData(decodeToken(response.access_token))
  }

  useEffect(() => {
    if (loginInProgress) {  // The client has been redirected back from the Auth endpoint with an auth code
      const urlParams = new URLSearchParams(window.location.search)
      if (!urlParams.get('code')) {
        // This should not happen. There should be a 'code' parameter in the url by now..."
        // Clearing all site data...
        logOut()
        location.reload()
      } else { // Request token from auth server with the auth code
        getTokens(authConfig).then((response: any) => {
          handleTokenResponse(response)
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
            handleTokenResponse(response)
          })
          .catch((error: any) => {  // For any reason we failed to get a new token with the refreshToken, login again
            console.error(error)
            // @ts-ignore
            setLoginInProgress(true)
            login(authConfig)
          })
      } else {  // The client still has a valid token
        setTokenData(decodeToken(token))
      }
    }
  }, [])

  return (
    <AuthContext.Provider value={{ tokenData, token, idToken, logOut }}>{children}</AuthContext.Provider>
  )
}