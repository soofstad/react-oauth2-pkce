import React, { useContext } from 'react'
import ReactDOM from 'react-dom'
import { AuthProvider, AuthContext, TAuthConfig } from "./AuthContext"

const authConfig = {
  clientId: 'f462a430-56f0-4a00-800a-6f578da7e943',
  authorizationEndpoint: 'https://login.microsoftonline.com/3aa4a235-b6e2-48d5-9195-7fcf05b459b0/oauth2/v2.0/authorize',
  tokenEndpoint: 'https://login.microsoftonline.com/3aa4a235-b6e2-48d5-9195-7fcf05b459b0/oauth2/v2.0/token',
  scope: 'User.Read openid',
  redirectUri: 'http://localhost:8080/',
  logoutEndpoint: '',
  logoutRedirect: '',
}

function LoginInfo() {
  const { tokenData, token, logOut, idToken, error} = useContext(AuthContext)

  return (
      <>
        {token ?
            <>
              <div>
                <h4>Access Token (JWT)</h4>
                <pre style={{
                  width: '400px',
                  margin: "10px",
                  padding: "5px",
                  border: "black 2px solid",
                  wordBreak: 'break-all',
                  whiteSpace: 'break-spaces',
                }}>
                  {token}</pre>
              </div>
              <div>
                <h4>Login Information from Access Token and IdToken if any)</h4>
                <pre style={{
                  width: '400px',
                  margin: "10px",
                  padding: "5px",
                  border: "black 2px solid",
                  wordBreak: 'break-all',
                  whiteSpace: 'break-spaces',
                }}>
                  {JSON.stringify(tokenData, null, 2)}</pre>
              </div>
              <button onClick={()=>logOut()}>Logout</button>
            </> :
            <div>You are not logged in</div>
        }
        {error && <div>{error}</div>}
      </>
  )

}


ReactDOM.render(
    <div>
      <div>
        <h1>Demo using the 'react-oauth2-code-pkce' package</h1>
        <p>Github: <a
            href="https://github.com/soofstad/react-oauth2-pkce">https://github.com/soofstad/react-oauth2-pkce</a>
        </p>
        <p>NPM: <a
            href="https://www.npmjs.com/package/react-oauth2-code-pkce">https://www.npmjs.com/package/react-oauth2-code-pkce</a>
        </p>
      </div>
      <AuthProvider authConfig={authConfig}>
        <LoginInfo/>
      </AuthProvider>
    </div>, document.getElementById('root'),
)
