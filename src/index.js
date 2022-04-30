import { useContext } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthContext, AuthProvider } from './AuthContext'

const authConfig = {
  clientId: '97a6b5bd-63fb-42c6-bb75-7e5de2394ba0',
  authorizationEndpoint:
    'https://login.microsoftonline.com/3aa4a235-b6e2-48d5-9195-7fcf05b459b0/oauth2/v2.0/authorize',
  tokenEndpoint: 'https://login.microsoftonline.com/3aa4a235-b6e2-48d5-9195-7fcf05b459b0/oauth2/v2.0/token',
  scope: 'api://97a6b5bd-63fb-42c6-bb75-7e5de2394ba0/dmss',
  redirectUri: 'http://localhost/',
  logoutEndpoint: '',
  logoutRedirect: '',
  // Example to redirect back to original path after login has completed
  preLogin: () => localStorage.setItem('preLoginPath', window.location.pathname),
  postLogin: () => window.location.replace(localStorage.getItem('preLoginPath') || ''),
  decodeToken: true
}

function LoginInfo() {
  const { tokenData, token, logOut, error } = useContext(AuthContext)

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
            <h4>Login Information from Access Token and IdToken if any)</h4>
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
        <div>You are not logged in</div>
      )}
      {error && <div>{error}</div>}
    </>
  )
}

const container = document.getElementById('root')
const root = createRoot(container)

root.render(
  <div>
    <div>
      <h1>Demo using the &apos;react-oauth2-code-pkce&apos; package</h1>
      <p>
        Github:{' '}
        <a href="https://github.com/soofstad/react-oauth2-pkce">https://github.com/soofstad/react-oauth2-pkce</a>
      </p>
      <p>
        NPM:{' '}
        <a href="https://www.npmjs.com/package/react-oauth2-code-pkce">
          https://www.npmjs.com/package/react-oauth2-code-pkce
        </a>
      </p>
    </div>
    <AuthProvider authConfig={authConfig}>
      <LoginInfo />
    </AuthProvider>
  </div>
)
