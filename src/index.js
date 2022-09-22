import { useContext } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthContext, AuthProvider } from './AuthContext'

const authConfig = {
  clientId: '6559ce69-219d-4e82-b6ed-889a861c7c94',
  authorizationEndpoint:
    'https://login.microsoftonline.com/d422398d-b6a5-454d-a202-7ed4c1bec457/oauth2/v2.0/authorize',
  tokenEndpoint: 'https://login.microsoftonline.com/d422398d-b6a5-454d-a202-7ed4c1bec457/oauth2/v2.0/token',
  redirectUri: 'http://localhost:3000/', // Example to redirect back to original path after login has completed
  preLogin: () => localStorage.setItem('preLoginPath', window.location.pathname),
  postLogin: () => window.location.replace(localStorage.getItem('preLoginPath') || ''),
  decodeToken: true,
  scope: 'User.read',
}

function LoginInfo() {
  const { tokenData, token, login, logOut, error, loginInProgress } = useContext(AuthContext)

  if (loginInProgress) return null

  if (error) {
    return (
      <>
        <div style={{ color: 'red' }}>An error occurred during authentication: {error}</div>
        <button onClick={() => logOut()}>Logout</button>
      </>
    )
  }

  if (!token)
    return (
      <>
        <div style={{ backgroundColor: 'red' }}>You are not logged in</div>
        <button onClick={() => login()}>Login</button>
      </>
    )
  return (
    <>
      <div>
        <button onClick={() => logOut()}>Logout</button>
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
    </>
  )
}

const container = document.getElementById('root')
const root = createRoot(container)

root.render(
  <div style={{}}>
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
