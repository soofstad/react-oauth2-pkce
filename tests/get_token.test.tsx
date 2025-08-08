import { render, waitFor } from '@testing-library/react'
import { AuthProvider } from '../src'
import type { TTokenResponse } from '../src/types'
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

describe('make token request', () => {
  beforeEach(() => {
    // Setting up a state similar to what it would be just after redirect back from auth provider
    localStorage.setItem('ROCP_loginInProgress', 'true')
    localStorage.setItem('ROCP_PKCE_code_verifier', 'arandomstring')
    window.location.search = '?code=1234'
  })

  test('with extra parameters', async () => {
    render(
      <AuthProvider authConfig={authConfig}>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith('myTokenEndpoint', {
        body: 'grant_type=authorization_code&code=1234&client_id=anotherClientId&redirect_uri=http%3A%2F%2Flocalhost%2F&code_verifier=arandomstring&testTokenKey=tokenValue',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
        credentials: 'same-origin',
      })
    )
  })

  test('with custom credentials', async () => {
    render(
      <AuthProvider authConfig={{ ...authConfig, tokenRequestCredentials: 'include' }}>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith('myTokenEndpoint', {
        body: 'grant_type=authorization_code&code=1234&client_id=anotherClientId&redirect_uri=http%3A%2F%2Flocalhost%2F&code_verifier=arandomstring&testTokenKey=tokenValue',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
        credentials: 'include',
      })
    )
  })
})
