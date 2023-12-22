import React, { useContext } from 'react'
// @ts-ignore
import ReactDOM from 'react-dom'
import { createRoot } from 'react-dom/client'
import { AuthContext, AuthProvider, IAuthContext, TAuthConfig } from 'react-oauth2-code-pkce'

// Get info from http://localhost:8080/realms/test/.well-known/openid-configuration

const authConfig: TAuthConfig = {
  clientId: 'account',
  authorizationEndpoint: 'http://localhost:8080/realms/test/protocol/openid-connect/auth',
  logoutEndpoint: 'http://localhost:8080/realms/test/protocol/openid-connect/logout',
  tokenEndpoint: 'http://localhost:8080/realms/test/protocol/openid-connect/token',
  redirectUri: 'http://localhost:3000/',
  scope: 'profile openid',
  // Example to redirect back to original path after login has completed
  // preLogin: () => localStorage.setItem('preLoginPath', window.location.pathname),
  // postLogin: () => window.location.replace(localStorage.getItem('preLoginPath') || ''),
  decodeToken: true,
  autoLogin: false,
}

function LoginInfo(): JSX.Element {
  const { tokenData, token, login, logOut, idToken, error }: IAuthContext = useContext(AuthContext)

  if (error) {
    return (
      <>
        <div style={{ color: 'red' }}>An error occurred during authentication: {error}</div>
        <button onClick={() => logOut()}>Logout</button>
      </>
    )
  }

  return (
    <>
      {token ? (
        <>
          <div>
            <h4>Access Token (JWT)</h4>
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
          <div>
            <h4>Login Information from Access Token (Base64 decoded JWT)</h4>
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
              {JSON.stringify(tokenData, null, 2)}
            </pre>
          </div>
          <button onClick={() => logOut()}>Logout</button>
        </>
      ) : (
        <>
          <div>You are not logged in.</div>
          <button onClick={() => login()}>Login</button>
        </>
      )}
    </>
  )
}

const container = document.getElementById('root')
const root = createRoot(container)

root.render(
  <div>
    <div>
      <h1>Demo using the 'react-oauth2-code-pkce' package</h1>
      <p>
        Github:{' '}
        <a href='https://github.com/soofstad/react-oauth2-pkce'>https://github.com/soofstad/react-oauth2-pkce</a>
      </p>
      <p>
        NPM:{' '}
        <a href='https://www.npmjs.com/package/react-oauth2-code-pkce'>
          https://www.npmjs.com/package/react-oauth2-code-pkce
        </a>
      </p>
    </div>
    <AuthProvider authConfig={authConfig}>
      {/* @ts-ignore*/}
      <LoginInfo />
    </AuthProvider>
  </div>,
  document.getElementById('root')
)
