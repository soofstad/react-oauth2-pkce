import React, { useContext } from 'react'
// @ts-ignore
import ReactDOM from 'react-dom'
import { AuthContext, AuthProvider, TAuthConfig, IAuthContext } from "react-oauth2-code-pkce"

const authConfig: TAuthConfig = {
  clientId: 'f462a430-56f0-4a00-800a-6f578da7e943',
  authorizationEndpoint: 'https://login.microsoftonline.com/3aa4a235-b6e2-48d5-9195-7fcf05b459b0/oauth2/v2.0/authorize',
  tokenEndpoint: 'https://login.microsoftonline.com/3aa4a235-b6e2-48d5-9195-7fcf05b459b0/oauth2/v2.0/token',
  scope: 'User.Read',
  redirectUri: 'http://localhost/',
  logoutEndpoint: '',
  logoutRedirect: '',
}

function LoginInfo(): JSX.Element {
  const { tokenData, token, logOut, idToken, error }: IAuthContext = useContext(AuthContext)

  if (error){
    return <>
      <div style={{color: "red"}}>An error occurred during authentication: {error}</div>
      <button onClick={()=>logOut()}>Logout</button>
      </>

  }

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
                <h4>Login Information from Access Token (Base64 decoded JWT)</h4>
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
            <div>You are not logged in. Refresh page to login.</div>
        }
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
        {/* @ts-ignore*/}
        <LoginInfo/>
      </AuthProvider>
    </div>, document.getElementById('root'),
)