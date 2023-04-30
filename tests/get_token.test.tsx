import React from 'react'
import { AuthProvider } from '../src'
import { TTokenResponse } from '../src/Types'
import { render, waitFor } from '@testing-library/react'
import { AuthConsumer, authConfig } from './test-utils'

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

test('make token request with extra parameters', async () => {
  // Setting up a state similar to what it would be just after redirect back from auth provider
  localStorage.setItem('ROCP_loginInProgress', 'true')
  sessionStorage.setItem('PKCE_code_verifier', 'arandomstring')
  window.location.search = '?code=1234'

  render(
    <AuthProvider authConfig={authConfig}>
      <AuthConsumer />
    </AuthProvider>
  )

  await waitFor(() =>
    expect(fetch).toHaveBeenCalledWith('myTokenEndpoint', {
      body: 'grant_type=authorization_code&code=1234&scope=someScope%20openid&client_id=anotherClientId&redirect_uri=http%3A%2F%2Flocalhost%2F&code_verifier=arandomstring&testTokenKey=tokenValue',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
    })
  )
})
