# react-oauth2-code-pkce
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/soofstad/react-oauth2-pkce/blob/main/LICENSE) ![NPM Version](https://img.shields.io/npm/v/react-oauth2-code-pkce?logo=npm&label=version) ![NPM Downloads](https://img.shields.io/npm/d18m/react-oauth2-code-pkce?logo=npm) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/react-oauth2-code-pkce?label=size) ![CI](https://github.com/soofstad/react-oauth2-pkce/actions/workflows/tests.yaml/badge.svg)

React package for OAuth2 Authorization Code flow with PKCE

Adhering to the RFCs recommendations, cryptographically sound, and with __zero__ dependencies!  

## What is OAuth2 Authorization Code Flow with Proof Key for Code Exchange?

Short version;  
The modern and secure way to do authentication for mobile and web applications!

Long version;  
<https://www.rfc-editor.org/rfc/rfc6749.html>  
<https://datatracker.ietf.org/doc/html/rfc7636>  
<https://oauth.net/2/pkce/>

## Features

- Authorization provider-agnostic. Works equally well with all OAuth2 authentication servers following the OAuth2 spec
- Supports OpenID Connect (idTokens)
- Pre- and Post-login callbacks
- Session expired callback
- Silently refreshes short-lived access tokens in the background
- Decodes JWT's
- A total of ~440 lines of code, easy for anyone to audit and understand

## Example

```tsx
import { AuthContext, AuthProvider, TAuthConfig, TRefreshTokenExpiredEvent } from "react-oauth2-code-pkce"

const authConfig: TAuthConfig = {
  clientId: 'myClientID',
  authorizationEndpoint: 'https://myAuthProvider.com/auth',
  tokenEndpoint: 'https://myAuthProvider.com/token',
  redirectUri: 'http://localhost:3000/',
  scope: 'someScope openid',
  onRefreshTokenExpire: (event: TRefreshTokenExpiredEvent) => event.logIn(undefined, undefined, "popup"),
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

For more advanced examples, see `./examples/`.  

## Install

The package is available on npmjs.com here; https://www.npmjs.com/package/react-oauth2-code-pkce

```bash
npm install react-oauth2-code-pkce
```

## API

### IAuthContext values

The object that's returned by `useContext(AuthContext)` provides these values;

```typescript
interface IAuthContext {
  // The access token. This is what you will use for authentication against protected Web API's
  token: string
  // An object with all the properties encoded in the token (username, email, etc.), if the token is a JWT 
  tokenData?: TTokenData
  // Function to trigger login. 
  // If you want to use 'state', you might want to set 'clearURL' configuration parameter to 'false'.
  // Note that most browsers block popups by default. The library will print a warning and fallback to redirect if the popup is blocked
  logIn: (state?: string, additionalParameters?: { [key: string]: string | boolean | number }, method: TLoginMethod = 'redirect') => void
  // Function to trigger logout from authentication provider. You may provide optional 'state', and 'logout_hint' values.
  // See https://openid.net/specs/openid-connect-rpinitiated-1_0.html#RPLogout for details.
  logOut: (state?: string, logoutHint?: string, additionalParameters?: { [key: string]: string | boolean | number }) => void
  // Keeps any errors that occured during login, token fetching/refreshing, decoding, etc.. 
  error: string | null
  // The idToken, if it was returned along with the access token
  idToken?: string
  // An object with all the properties encoded in the ID-token (username, groups, etc.)
  idTokenData?: TTokenData
  // If the <AuthProvider> is done fetching tokens or not. Usefull for controlling page rendering
  loginInProgress: boolean
}
```

### Configuration parameters

__react-oauth2-code-pkce__'s goal is to "just work" with any authentication provider that either
supports the [OAuth2](https://datatracker.ietf.org/doc/html/rfc7636) or [OpenID Connect](https://openid.net/developers/specs/) (OIDC) standards.  
However, many authentication providers are not following these standards, or have extended them. 
With this in mind, if you are experiencing any problems, a good place to start is to see if the provider expects some custom parameters.
If they do, these can be injected into the different calls with these configuration options;

- `extraAuthParameters`
- `extraTokenParameters`
- `extraLogoutParameters`

The `<AuthProvider>` takes a `config` object that supports these parameters;

```typescript
type TAuthConfig = {
  // ID of your app at the authentication provider
  clientId: string  // Required
  // URL for the authentication endpoint at the authentication provider
  authorizationEndpoint: string  // Required
  // URL for the token endpoint at the authentication provider
  tokenEndpoint: string  // Required
  // Which URL the auth provider should redirect the user to after successful authentication/login
  redirectUri: string  // Required
  // Which scopes to request for the auth token
  scope?: string  // default: ''
  // Optional state value. Will often make more sense to provide the state in a call to the 'logIn()' function
  state?: string // default: null
  // Which URL to call for logging out of the auth provider
  logoutEndpoint?: string  // default: null
  // Which URL the auth provider should redirect the user to after logout
  logoutRedirect?: string  // default: null
  // Optionally provide a callback function to run _before_ the
  // user is redirected to the auth server for login
  preLogin?: () => void  // default: () => null
  // Optionally provide a callback function to run _after_ the
  // user has been redirected back from the auth server
  postLogin?: () => void  // default: () => null
  // Which method to use for login. Can be 'redirect', 'replace', or 'popup'
  // Note that most browsers block popups by default. The library will print a warning and fallback to redirect if the popup is blocked
  loginMethod: 'redirect' | 'replace' | 'popup'  // default: 'redirect'
  // Optional callback function for the 'refreshTokenExpired' event.
  // You likely want to display a message saying the user need to log in again. A page refresh is enough.
  onRefreshTokenExpire?: (event: TRefreshTokenExpiredEvent) => void  // default: undefined
  // Whether or not to decode the access token (should be set to 'false' if the access token is not a JWT (e.g. from Github))
  // If `false`, 'tokenData' will be 'undefined' from the <AuthContext>
  decodeToken?: boolean  // default: true
  // By default, the package will automatically redirect the user to the login server if not already logged in.
  // If set to false, you need to call the "logIn()" function to log in (e.g. with a "Log in" button)
  autoLogin?: boolean  // default: true
  // Store login state in 'localStorage' or 'sessionStorage'
  // If set to 'session', no login state is persisted by 'react-oauth2-code-pkce` when the browser closes.
  // NOTE: Many authentication servers will keep the client logged in by cookies. You should therefore use 
  // the logOut() function to properly log out the client. Or configure your server not to issue cookies.
  storage?: 'local' | 'session'  // default: 'local'
  // Sets the prefix for keys used by this library in storage
  storageKeyPrefix?: string // default: 'ROCP_'
  // Set to false if you need to access the urlParameters sent back from the login server.
  clearURL?: boolean  // default: true
  // Can be used to provide any non-standard parameters to the authentication request
  extraAuthParameters?: { [key: string]: string | boolean | number }  // default: null
  // Can be used to provide any non-standard parameters to the token request
  extraTokenParameters?: { [key: string]: string | boolean | number } // default: null
  // Can be used to provide any non-standard parameters to the logout request
  extraLogoutParameters?: { [key: string]: string | boolean | number } // default: null
  // Superseded by 'extraTokenParameters' options. Will be deprecated in 2.0
  extraAuthParams?: { [key: string]: string | boolean | number }  // default: null
  // Can be used if auth provider doesn't return access token expiration time in token response
  tokenExpiresIn?: number // default: null
  // Can be used if auth provider doesn't return refresh token expiration time in token response
  refreshTokenExpiresIn?: number // default: null
  // Defines the expiration strategy for the refresh token.
  // - 'renewable': The refresh token's expiration time is renewed each time it is used, getting a new validity period.
  // - 'absolute': The refresh token's expiration time is fixed from its initial issuance and does not change, regardless of how many times it is used.
  refreshTokenExpiryStrategy?: 'renewable' | 'absolute' // default: renewable
  // Whether or not to post 'scope' when refreshing the access token
  refreshWithScope?: boolean // default: true
  // Controls whether browser credentials (cookies, TLS client certificates, or authentication headers containing a username and password) are sent when requesting tokens.
  // Warning: Including browser credentials deviates from the standard protocol and can introduce unforeseen security issues. Only set this to 'include' if you know what 
  // you are doing and CSRF protection is present. Setting this to 'include' is required when the token endpoint requires client certificate authentication, but likely is
  // not needed in any other case. Use with caution.
  tokenRequestCredentials?: 'same-origin' | 'include' | 'omit' // default: 'same-origin'
}

```

## Common issues

### Sessions expire too quickly

A session expire happens when the `refresh_token` is no longer valid and can't be used to fetch a new valid `access_token`.
This is governed by the `expires_in`, and `refresh_expires_in | refresh_token_expires_in`, in the token response.
If the response does not contain these values, the library assumes a quite conservative value. 
You should configure your IDP (Identity Provider) to send these, but if that is not possible, you can set them explicitly
with the config parameters `tokenExpiresIn` and `refreshTokenExpiresIn`.

### Fails to compile with Next.js
The library's main componet `AuthProvider` is _client side only_. Meaning it must be rendered in a web browser, and can not be pre-rendered server-side (which is default in newer versions of NextJS and similar frameworks). 

This can be solved by marking the module with `use client` and importing the component in the client only (`"ssr": false`).

```tsx
'use client'
import {useContext} from "react";
import dynamic from 'next/dynamic'
import {TAuthConfig,TRefreshTokenExpiredEvent, AuthContext} from 'react-oauth2-code-pkce'

const AuthProvider = dynamic(
    ()=> import("react-oauth2-code-pkce")
        .then((mod) => mod.AuthProvider),
    {ssr: false}
)

const authConfig: TAuthConfig = {...for you to fill inn}

export default function Authenticated() {
    (<AuthProvider authConfig={authConfig}>
        <LoginInfo/>
    </AuthProvider>)
}
```

### Error `Bad authorization state...`

This is most likely to happen if the authentication at the identity provider got aborted in some way.
You might also see the error `Expected  to find a '?code=' parameter in the URL by now. Did the authentication get aborted or interrupted?` in the console.

First of all, you should handle any errors the library throws. Usually, hinting at the user reload the page is enough.

Some known causes for this is that instead of logging in at the auth provider, the user "Registers" or "Reset password" or 
something similar instead. Any such functions should be handled outside of this library, with separate buttons/links than the "Log in" button.

### After redirect back from auth provider with `?code`, no token request is made

If you are using libraries that intercept any `fetch()`-requests made. For example `@tanstack/react-query`. That can cause
issues for the _AuthProviders_ token fetching. This can be solved by _not_ wrapping the `<AuthProvider>` in any such library.

This could also happen if some routes in your app are not wrapped by the `<AuthProvider>`.

### The page randomly refreshes in the middle of a session

This will happen if you haven't provided a callback-function for the `onRefreshTokenExpire` config parameter, and the refresh token expires.
You probably want to implement some kind of "alert/message/banner", saying that the session has expired and that the user needs to log in again.
Either by refreshing the page, or clicking a "Log in" button.

## Develop

1. Update the 'authConfig' object in `src/index.js` with config from your authorization server and application
2. Install node_modules -> `$ yarn install`
3. Run -> `$ yarn start`

## Contribute

You are most welcome to create issues and pull requests :)
