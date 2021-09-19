# react-oauth2-pkce

Plug-and-play react package for OAuth2 Authorization Code flow with PKCE

Staying true to the RFCs recommendations, cryptographically sound, and with __zero__ dependencies*!  

Updated in 2021!

\* TypeScript and React

## What is OAuth2 Authorization Code flow with PKCE?

Short version;  
The modern and secure way to do authentication for mobile and web applications!

Long version;  
<https://oauth.net/2/pkce/>  
<https://datatracker.ietf.org/doc/html/rfc7636>

## Example

```javascript
import React, { useContext } from 'react'
import ReactDOM from 'react-dom'
import { AuthContext, AuthProvider } from "react-oauth2-code-pkce"

const authConfig = {
  clientId: 'myClientID',
  authorizationEndpoint: 'myAuthEndpoint',
  tokenEndpoint: 'myTokenEndpoint',
  // Where ever your application is running. Must match whats configured in authorization server
  redirectUri: 'http://localhost:3000/',
  // Optional
  scope: 'someScope',
  // Optional
  logoutEndpoint: '',
  // Optional
  logoutRedirect: ''
}

function LoginInfo() {
  const { tokenData, token, logOut } = useContext(AuthContext)

  return (
      <>
        {token ?
            <>
              <div>
                <h4>Access Token (JWT)</h4>
                <pre>{token}</pre>
              </div>
              <div>
                <h4>Login Information from Access Token (Base64 decoded JWT)</h4>
                <pre>{JSON.stringify(tokenData, null, 2)}</pre>
              </div>
            </> :
            <div>You are not logged in</div>
        }
      </>
  )

}


ReactDOM.render(
    <div>
      <AuthProvider authConfig={authConfig}>
        <LoginInfo/>
      </AuthProvider>
    </div>, document.getElementById('root'),
)
```

## Contribute

You are welcome to create issues and pull requests :)
