import React, { useEffect, useState } from 'react'
import { decodeToken, getAccessTokenFromRefreshToken, getTokens, login, logout, tokenExpired } from "./authentication"
import useLocalStorage from "./Hooks"
import { TTokenData } from "./Types"

export const AuthContext = React.createContext({})

export const AuthProvider = ({ children }) => {
  const [refreshToken, setRefreshToken] = useLocalStorage('refreshToken', null)
  const [token, setToken] = useLocalStorage('token', null)
  const [loginInProgress, setLoginInProgress] = useLocalStorage('loginInProgress', false)
  const [tokenData, setTokenData] = useState < TTokenData | undefined > undefined

  const logOut = () => {
    setRefreshToken(null)
    setToken(null)
    logout()
  }

  useEffect(() => {
    if (!token && !loginInProgress) {
      setLoginInProgress(true)
      login()
    } else if (!token && loginInProgress && tokenExpired(token)) {
      getAccessTokenFromRefreshToken(refreshToken)
          .then((response) => {
            setRefreshToken(response.refresh_token)
            setToken(response.access_token)
            setLoginInProgress(false)
            setTokenData(decodeToken(response.access_token))
          })
          // TODO: Check error type before assuming anything
          .catch(() => {
            // Get token with refreshToken failed. Login again.
            // const urlParams = new URLSearchParams(window.location.search)
            // if (!urlParams.get('code')) {
              login()
            //   return
            // }
            // getTokens().then((response) => {
            //   setRefreshToken(response.refresh_token)
            //   setToken(response.access_token)
            //   setLoggedIn(true)
            //   setLoginInProgress(false)
            //   setTokenData(getUserData(response.access_token, true))
            // })

          })
    }

  }, [])

  return (
      <AuthContext.Provider value={{ tokenData, token, logOut }}>{children}</AuthContext.Provider>
  )
}