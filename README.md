# react-oauth2-code-pkce &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/soofstad/react-oauth2-pkce/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/react-oauth2-code-pkce)](https://www.npmjs.com/package/react-oauth2-code-pkce) ![CI](https://github.com/soofstad/react-oauth2-pkce/actions/workflows/tests.yaml/badge.svg)

React package for OAuth2 Authorization Code flow with PKCE

Adhering to the RFCs recommendations, cryptographically sound, and with __zero__ dependencies!  

## What is OAuth2 Authorization Code Flow with Proof Key for Code Exchange?

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

```tsx
import { AuthContext, AuthProvider, TAuthConfig } from "react-oauth2-code-pkce"

const authConfig: TAuthConfig = {
  clientId: 'myClientID',
  authorizationEndpoint: 'https://myAuthProvider.com/auth',
  tokenEndpoint: 'https://myAuthProvider.com/token',
  redirectUri: 'http://localhost:3000/',
  scope: 'someScope openid',
}

const UserInfo = (): JSX.Element => {
    const {token, tokenData} = useContext<IAuthContext>(AuthContext)

    return <>
        <h4>Access Token</h4>
        <pre>{token}</pre>
        <h4>User Information from JWT</h4>
        <pre>{JSON.stringify(tokenData, null, 2)}</pre>
    </>
}

ReactDOM.render(<AuthProvider authConfig={authConfig}>
        <UserInfo/>
    </AuthProvider>
    , document.getElementById('root'),
)
```

For more advanced examples, see `./examples/`

## Install

The package is available on npmjs.com here; https://www.npmjs.com/package/react-oauth2-code-pkce

```bash
npm install react-oauth2-code-pkce
```

## IAuthContext values

The `IAuthContext` interface that the `AuthContext` returns when called with `useContext()` provides these values;

```typescript
interface IAuthContext {
  // The access token. This is what you will use for authentication against protected API's
  token: string
  // An object with all the properties encoded in the token (username, email, etc)
  tokenData?: TTokenData
  // Login the user
  login: () => void  
  // Logout the user from the auth provider
  logOut: () => void
  // Keep any errors that occured during login or token fetching/refreshing. 
  error: string | null
  // The idToken, if also that was returned along with the access token
  idToken?: string
  // If the <AuthProvider> is done fetching tokens or not. Usefull for controlling page rendering
  loginInProgress: boolean
}
```

## All configuration parameters

The `<AuthProvider>` takes a `config` object that supports these parameters;

```typescript
type TAuthConfig = {
  // Id of your app at the authentication provider
  clientId: string  // Required
  // URL for the authentication endpoint at the authentication provider
  authorizationEndpoint: string  // Required
  // URL for the token endpoint at the authentication provider
  tokenEndpoint: string  // Required
  // Which URL the auth provider should redirect the user after loging out
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
  // Can be used to provide any non-standard parameters to the authentication request
  extraAuthParameters?: { [key: string]: string | boolean | number }  // default: null
  // Can be used to provide any non-standard parameters to the token request
  extraTokenParameters?: { [key: string]: string | boolean | number } // default: null
  // Superseded by 'extraTokenParameters' options. Will be deprecated in 2.0
  extraAuthParams?: { [key: string]: string | boolean | number }  // default: null
}

```

## Develop

1. Update the 'authConfig' object in `src/index.js` with config from your authorization server and application
2. Install node_modules -> `$ yarn install`
3. Run -> `$ yarn start`

## Contribute

You are welcome to create issues and pull requests :)
