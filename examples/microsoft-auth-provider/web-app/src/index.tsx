import React, { useContext } from 'react'
// @ts-ignore
import ReactDOM from 'react-dom'
import { AuthContext, AuthProvider, type IAuthContext, type TAuthConfig } from 'react-oauth2-code-pkce'

const authConfig: TAuthConfig = {
  clientId: '6559ce69-219d-4e82-b6ed-889a861c7c94',
  authorizationEndpoint:
    'https://login.microsoftonline.com/d422398d-b6a5-454d-a202-7ed4c1bec457/oauth2/v2.0/authorize',
  tokenEndpoint: 'https://login.microsoftonline.com/d422398d-b6a5-454d-a202-7ed4c1bec457/oauth2/v2.0/token',
  redirectUri: 'http://localhost:3000/',
  onRefreshTokenExpire: (event) =>
    window.confirm('Tokens have expired. Refresh page to continue using the site?') && event.logIn(),
  // Example to redirect back to original path after login has completed
  preLogin: () => localStorage.setItem('preLoginPath', window.location.pathname),
  postLogin: () => window.location.replace(localStorage.getItem('preLoginPath') || ''),
  decodeToken: true,
  scope: 'User.read',
  autoLogin: false,
}

function LoginInfo(): JSX.Element {
  const { tokenData, token, logOut, idToken, error, logIn }: IAuthContext = useContext(AuthContext)

  if (error) {
    return (
      <>
        <div style={{ color: 'red' }}>An error occurred during authentication: {error}</div>
        <button type='button' onClick={() => logOut()}>
          Log out
        </button>
      </>
    )
  }

  return (
    <>
      {token ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignContent: 'center',
            alignItems: 'center',
            color: 'grey',
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              padding: '10px',
              margin: '10px',
              border: '1px solid white',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <p>Welcome, John Doe!</p>

            <button type='button' style={{ width: '100px' }} onClick={() => logOut()}>
              Log out
            </button>

            <p>Use this token to authenticate yourself</p>
            <pre
              style={{
                width: '400px',
                margin: '10px',
                padding: '5px',
                border: 'black 2px solid',
                wordBreak: 'break-all',
                whiteSpace: 'break-spaces',
              }}
            >
              {token}
            </pre>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignContent: 'center',
            alignItems: 'center',
            color: 'grey',
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              padding: '10px',
              margin: '10px',
              border: '1px solid white',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <p>Please login to continue</p>

            <button type='button' style={{ width: '100px' }} onClick={() => logIn()}>
              Log in
            </button>
          </div>
        </div>
      )}
    </>
  )
}

ReactDOM.render(
  <div>
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignContent: 'center',
        alignItems: 'center',
        color: 'grey',
        fontFamily: 'sans-serif',
      }}
    >
      <h1 style={{ paddingRight: '5px' }}>Demo using</h1>
      <h1 style={{ fontFamily: 'monospace' }}> react-oauth2-code-pkce</h1>
    </div>
    <AuthProvider authConfig={authConfig}>
      {/* @ts-ignore*/}
      <LoginInfo />
    </AuthProvider>
  </div>,
  document.getElementById('root')
)
