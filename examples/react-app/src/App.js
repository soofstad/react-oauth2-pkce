import { AuthContext, AuthProvider } from "react-oauth2-code-pkce"
import { useContext } from "react"

const authConfig = {
  clientId: '97a6b5bd-63fb-42c6-bb75-7e5de2394ba0',
  authorizationEndpoint: 'https://login.microsoftonline.com/3aa4a235-b6e2-48d5-9195-7fcf05b459b0/oauth2/v2.0/authorize',
  tokenEndpoint: 'https://login.microsoftonline.com/3aa4a235-b6e2-48d5-9195-7fcf05b459b0/oauth2/v2.0/token',
  scope: 'api://97a6b5bd-63fb-42c6-bb75-7e5de2394ba0/dmss_test_scope',
  redirectUri: 'http://localhost:3000/',
  logoutEndpoint: '',
}

function LoginInfo() {
  const { tokenData, token, logOut } = useContext(AuthContext)

  return (
      <>
        {token ?
            <>
              <h4>Login Information from Access Token</h4>
              <div>
                <label>TokenData:</label>
                <pre style={{
                  width: '350px',
                  margin: "10px",
                  padding: "5px",
                  border: "black 1px solid",
                  wordBreak: 'break-all',
                  whiteSpace: 'break-spaces',
                }}>
                  {tokenData}</pre>
              </div>
              <div>
                <label>Token:</label>
                <pre style={{
                  width: '350px',
                  margin: "10px",
                  padding: "5px",
                  border: "black 1px solid",
                  wordBreak: 'break-all',
                  whiteSpace: 'break-spaces',
                }}>
                  {token}</pre>
              </div>
            </> :
            <div>You are not logged in</div>
        }
      </>
  )

}

function App() {
  return (
      <div>
        <div>
          <h1>Demo using the 'react-oauth2-code-pkce' package</h1>
          <p>Github: <a
              href="https://github.com/soofstad/react-oauth2-pkce">https://github.com/soofstad/react-oauth2-pkce</a>
            <p/>
            <p>NPM: <a
                href="https://www.npmjs.com/package/react-oauth2-code-pkce">https://www.npmjs.com/package/react-oauth2-code-pkce</a>
            </p>
          </p>
        </div>
        <AuthProvider authConfig={authConfig}>
          <LoginInfo/>
        </AuthProvider>
      </div>
  )
}


export default App
