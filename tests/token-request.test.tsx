import React, { useContext } from 'react'
import { AuthProvider } from '../src/AuthContext'
import { TAuthConfig, TTokenResponse } from '../src/Types'
import { act, render, waitFor } from '@testing-library/react'
import { AuthContext } from '../src'

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
  storage: 'local',
  extraAuthParams: {
    prompt: true,
    client_id: 'anotherClientId',
  },
  extraTokenParameters: {
    prompt: true,
    client_id: 'anotherClientId',
    testKey: 'test Value',
  },
}

const AuthConsumer = () => {
  const { tokenData } = useContext(AuthContext)
  return <div>{tokenData?.name}</div>
}

describe('make token request with extra parameters', () => {
  // Setting up a state similar to what it would be just after redirect back from auth provider
  localStorage.setItem('ROCP_loginInProgress', 'true')
  const storage = authConfig.storage === 'local' ? localStorage : sessionStorage
  storage.setItem('PKCE_code_verifier', 'arandomstring')

  it('calls the token endpoint with these parameters', async () => {
    // Have been redirected back with a code in query params
    window.location.search = '?code=1234'

    render(
      <AuthProvider authConfig={authConfig}>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith('myTokenEndpoint', {
        body: 'grant_type=authorization_code&code=1234&scope=someScope%20openid&client_id=anotherClientId&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2F&code_verifier=arandomstring&prompt=true&testKey=test%20Value',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
      })
    )
  })
})
