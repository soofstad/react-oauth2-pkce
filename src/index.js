import { useContext } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthContext, AuthProvider } from './AuthContext'

const authConfig = {
  clientId: 'c43524cc7d3c82b05a47',
  authorizationEndpoint: 'https://github.com/login/oauth/authorize',
  tokenEndpoint: 'http://localhost:5000/api/token',
  redirectUri: 'http://localhost:3000/',
  // Example to redirect back to original path after login has completed
  preLogin: () => localStorage.setItem('preLoginPath', window.location.pathname),
  postLogin: () => window.location.replace(localStorage.getItem('preLoginPath') || ''),
  decodeToken: false,
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
          {authConfig.decodeToken && (
            <div>
              <h4>Login Information from Access Token and IdToken (if any)</h4>
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
          )}

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
