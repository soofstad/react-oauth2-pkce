import React, { useContext } from 'react'
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthContext, AuthProvider, TAuthConfig } from '../src'

const authConfig: TAuthConfig = {
  clientId: 'myClientID',
  authorizationEndpoint: 'myAuthEndpoint',
  tokenEndpoint: 'myTokenEndpoint',
  redirectUri: 'http://localhost:3000/',
  scope: 'someScope openid',
}

const AuthConsumer = () => {
  const { error, loginInProgress } = useContext(AuthContext)
  return (
    <div>
      {error && <div data-testid="error">{error}</div>}
      <div data-testid="loginInProgress">{JSON.stringify(loginInProgress)}</div>
    </div>
  )
}

describe('Raise error on unsecure context', () => {
  it('populates error state and stops login', async () => {
    // @ts-ignore
    global.crypto.subtle.digest = undefined
    render(
      <AuthProvider authConfig={authConfig}>
        <AuthConsumer />
      </AuthProvider>
    )

    const errorNode = await waitFor(() => screen.findByTestId('error'))

    expect(errorNode).toHaveTextContent(
      "The context/environment is not secure, and does not support the 'crypto.subtle' module. See: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/subtle for details"
    )
    expect(screen.getByTestId('loginInProgress')).toHaveTextContent('false')
  })
})
