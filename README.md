# react-oauth2-pkce &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/soofstad/react-oauth2-pkce/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/react-oauth2-code-pkce)](https://www.npmjs.com/package/react-oauth2-code-pkce) ![CI](https://github.com/soofstad/react-oauth2-pkce/actions/workflows/tests.yaml/badge.svg)

Plug-and-play react package for OAuth2 Authorization Code flow with PKCE

Adhering to the RFCs recommendations, cryptographically sound, and with __zero__ dependencies!  

## What is OAuth2 Authorization Code flow with PKCE?

Short version;  
The modern and secure way to do authentication for mobile and web applications!

Long version;  
<https://oauth.net/2/pkce/>  
<https://datatracker.ietf.org/doc/html/rfc7636>

## Features

- Authorization server agnostic, works equally well with all OAuth2 auth servers following the OAuth2 spec
- Supports OpenID Connect (idTokens)
- Pre- and Post login callbacks
- Silently refreshes short lived access tokens in the background
- Decodes JWT's
- A total of ~440 lines of code, easy for anyone to audit.

## Example

```javascript
import React, { useContext } from 'react'
import ReactDOM from 'react-dom'
import { AuthContext, AuthProvider, TAuthConfig } from "react-oauth2-code-pkce"

const authConfig: TAuthConfig = {
  clientId: 'myClientID',
  authorizationEndpoint: 'myAuthEndpoint',
  tokenEndpoint: 'myTokenEndpoint',
  // Whereever your application is running. Must match configuration on authorization server
  redirectUri: 'http://localhost:3000/',
  // Optional
  scope: 'someScope openid',
  // Optional
  logoutEndpoint: '',
  // Optional
  logoutRedirect: '',
  // Example to redirect back to original path after login has completed
  preLogin: () => localStorage.setItem('preLoginPath', location.pathname),
  postLogin: () => location.replace(localStorage.getItem('preLoginPath')),
  // Whether or not to try and decode the access token.
  // Stops errors from being printed in the console for non-JWT access tokens, etc. from Github
  decodeToken: true
}

function LoginInfo() {
  const { tokenData, token, logOut, error, loginInProgress } = useContext(AuthContext)
  
  // Stops the webpage from flickering while logging in
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
        <button onClick={() => window.location.reload()}>Login</button>
      </>
    )

  return (
    <>
      <div>
        <h4>Access Token (JWT)</h4>
        <pre>{token}</pre>
      </div>
      <div>
        <h4>Login Information from Access Token (Base64 decoded JWT)</h4>
        <pre>{JSON.stringify(tokenData, null, 2)}</pre>
      </div>
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

## Install

The package is available on npmjs.com here; https://www.npmjs.com/package/react-oauth2-code-pkce

```bash
npm install react-oauth2-code-pkce
```

and import

```javascript
import { AuthContext, AuthProvider } from "react-oauth2-code-pkce"
```
## Develop

1. Update the 'authConfig' object in `src/index.js` with config from your authorization server and application
2. Install node_modules -> `$ yarn install`
3. Run -> `$ yarn start`
## Contribute

You are welcome to create issues and pull requests :)
