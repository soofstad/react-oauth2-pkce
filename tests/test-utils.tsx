import React, { useContext } from 'react'
import { AuthContext, type TAuthConfig } from '../src'

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
  stateFn: () => 'testState',
  loginMethod: 'redirect',
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
  const { tokenData, logOut, loginInProgress, idToken, idTokenData, logIn, token, error } = useContext(AuthContext)
  return (
    <>
      <div>{tokenData?.name}</div>
      <button type='button' onClick={() => logOut('logoutState')}>
        Log out
      </button>
      <button type='button' onClick={() => logIn('loginState')}>
        Log in
      </button>
      <label aria-label={'loginInProgress'}>{JSON.stringify(loginInProgress)}</label>
      <label aria-label={'error'}>{error}</label>
      <label aria-label={'token'}>{token}</label>
    </>
  )
}
