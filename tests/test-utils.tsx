import React, { useContext } from 'react'
import { AuthContext, TAuthConfig } from '../src'

export const authConfig: TAuthConfig = {
  autoLogin: true,
  clientId: 'myClientID',
  authorizationEndpoint: 'myAuthEndpoint',
  tokenEndpoint: 'myTokenEndpoint',
  logoutEndpoint: 'myLogoutEndpoint',
  redirectUri: 'http://localhost/',
  logoutRedirect: 'primary-logout-redirect',
  scope: 'someScope openid',
  decodeToken: false,
  state: 'testState',
  extraLogoutParameters: {
    testLogoutKey: 'logoutValue',
  },
  extraAuthParams: {
    client_id: 'anotherClientId',
  },
  extraTokenParameters: {
    testTokenKey: 'tokenValue',
  },
}

export const AuthConsumer = () => {
  const { tokenData, logOut, loginInProgress, idToken, idTokenData, login, token, error } = useContext(AuthContext)
  return (
    <>
      <div>{tokenData?.name}</div>
      <button type='button' onClick={() => logOut('logoutState')}>
        Logout
      </button>
      <button type='button' onClick={() => login('loginState')}>
        Login
      </button>
      <label aria-label={'loginInProgress'}>{JSON.stringify(loginInProgress)}</label>
      <label aria-label={'error'}>{error}</label>
      <label aria-label={'token'}>{token}</label>
    </>
  )
}
