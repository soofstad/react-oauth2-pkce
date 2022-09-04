# react-oauth2-pkce &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/soofstad/react-oauth2-pkce/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/react-oauth2-code-pkce)](https://www.npmjs.com/package/react-oauth2-code-pkce) ![CI](https://github.com/soofstad/react-oauth2-pkce/actions/workflows/tests.yaml/badge.svg)

Plug-and-play react package for OAuth2 Authorization Code flow with PKCE

Adhering to the RFCs recommendations, cryptographically sound, and with __zero__ dependencies!  

## What is OAuth2 Authorization Code flow with Proof Key for Code Exchange (PKCE)?

Short version;  
The modern and secure way to do authentication for mobile and web applications!

Long version;  
<https://oauth.net/2/pkce/>  
<https://datatracker.ietf.org/doc/html/rfc7636>

## Features

- Authorization provider-agnostic. Works equally well with all OAuth2 authentication servers following the OAuth2 spec
- Supports OpenID Connect (idTokens)
- Pre- and Post-login callbacks
- Silently refreshes short-lived access tokens in the background
- Decodes JWT's
- A total of ~440 lines of code, easy for anyone to audit and understand

## Example

```javascript
import React, { useContext } from 'react'
import ReactDOM from 'react-dom'
import { AuthContext, AuthProvider, TAuthConfig } from "react-oauth2-code-pkce"

const authConfig: TAuthConfig = {
  clientId: 'myClientID',
  authorizationEndpoint: 'myAuthEndpoint',
  tokenEndpoint: 'myTokenEndpoint',
  redirectUri: 'http://localhost:3000/',
  scope: 'someScope openid',
}

function LoginInfo() {
  const { 
    tokenData, 
    token, 
    login, 
    logOut, 
    error, 
    loginInProgress 
  } = useContext(AuthContext)
  
  // Stops the webpage from flickering while logging in
  if (loginInProgress) return null  
  
  if (error) {
    return (
      <>
        <div style={{ color: 'red' }}>
          An error occurred during authentication: {error}
        </div>
        <button onClick={() => logOut()}>Logout</button>
      </>
    )
  }
  if (!token)
    return (
      <>
        <div style={{ backgroundColor: 'red' }}>
          You are not logged in
        </div>
        <button onClick={() => login()}>Login</button>
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

## All configuration parameters

```typescript
type TAuthConfig = {
  // For required parameters, refer to the auth providers documentation
  clientId: string  // Required
  authorizationEndpoint: string  // Required
  tokenEndpoint: string  // Required
  redirectUri: string  // Required
  scope?: string  // default: ''
  // Which URL to call for logging out of the auth provider
  logoutEndpoint?: string  // default: null
  // Should be used by the auth provider to decide which URL to redirect
  // the user to after logout
  logoutRedirect?: string  // default: null
  // Optionally provide a callback function to run _before_ the
  // user is redirected to the auth server for login
  preLogin?: () => void  // default: () => null
  // Optionally provide a callback function to run _after_ the
  // user has been redirected back from the auth server
  postLogin?: () => void  // default: () => null
  // Whether or not to decode the access token (should be set to 'false' if the access token is not a JWT (e.g. from Github))
  // If `false`, 'tokenData' will be 'undefined' from the <AuthContext>
  decodeToken?: boolean  // default: true
  // By default, it will automatically redirect the user to the login server if not already logged in.
  // If set to false, you need to call the "login()" function to login (e.g. with a "Login" button)
  autoLogin?: boolean  // default: true
  // Can be used to provide any non-standard parameters to the authorization request
  extraAuthParams?: { [key: string]: string | boolean | number }  // default: null
}

```

## Develop

1. Update the 'authConfig' object in `src/index.js` with config from your authorization server and application
2. Install node_modules -> `$ yarn install`
3. Run -> `$ yarn start`

## Contribute

You are welcome to create issues and pull requests :)
