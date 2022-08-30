/**
 * @jest-environment jsdom
 */
import React, { useContext } from 'react'
import { AuthProvider } from '../src/AuthContext'
import { TAuthConfig, TTokenResponse } from '../src/Types'
import { act, render } from '@testing-library/react'
import { TextDecoder, TextEncoder } from 'util'
import crypto from 'crypto'
import { AuthContext } from '../src'

global.TextEncoder = TextEncoder
// @ts-ignore
global.TextDecoder = TextDecoder

// @ts-ignore
delete window.location
// @ts-ignore
window.location = { replace: jest.fn() }

Object.defineProperty(global.self, 'crypto', {
  value: {
    subtle: crypto.webcrypto.subtle,
    getRandomValues: crypto.webcrypto.getRandomValues,
  },
})

// @ts-ignore
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve<TTokenResponse>({
        scope: 'value',
        refresh_token: '1234',
        token_type: 'dummy',
        access_token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.Sfl',
      }),
  })
)

const authConfig: TAuthConfig = {
  clientId: 'myClientID',
  authorizationEndpoint: 'myAuthEndpoint',
  tokenEndpoint: 'myTokenEndpoint',
  redirectUri: 'http://localhost:3000/',
  scope: 'someScope openid',
  extraAuthParams: {
    prompt: true,
    client_id: 'anotherClientId',
  },
}

const AuthConsumer = () => {
  const { tokenData } = useContext(AuthContext)
  return <div>{tokenData?.name}</div>
}

describe('Redirected to app with auth code', () => {
  const wrapper = ({ children }: any) => <AuthProvider authConfig={authConfig}>{children}</AuthProvider>

  // Setting up a state similar to what it would be just after redirect back from auth provider
  localStorage.setItem('ROCP_loginInProgress', 'true')
  localStorage.setItem('PKCE_code_verifier', 'arandomstring')

  const location = {
    ...window.location,
    search: '?code=1234',
  }
  Object.defineProperty(window, 'location', {
    writable: true,
    value: location,
  })
  it('calls the auth endpoint with these parameters', async () => {
    await act(async () => {
      render(<AuthConsumer />, { wrapper })
    })

    expect(fetch).toHaveBeenCalledWith('myTokenEndpoint', {
      body: 'grant_type=authorization_code&code=1234&scope=someScope%20openid&client_id=anotherClientId&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2F&code_verifier=arandomstring&prompt=true',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
    })
  })
})
