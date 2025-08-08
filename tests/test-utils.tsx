import { useContext } from 'react'
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
  state: 'testState',
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
  const { tokenData, logOut, loginInProgress, logIn, token, error } = useContext(AuthContext)
  return (
    <>
      <div>{tokenData?.name}</div>
      <button type='button' onClick={() => logOut('logoutState')}>
        Log out
      </button>
      <button type='button' onClick={() => logIn('loginState')}>
        Log in
      </button>
      <p data-testid={'loginInProgress'}>{JSON.stringify(loginInProgress)}</p>
      <p data-testid={'error'}>{error}</p>
      <p data-testid={'token'}>{token}</p>
    </>
  )
}
