import React, { useContext } from 'react'
import { AuthProvider } from '../src/AuthContext'
import { TAuthConfig } from '../src/Types'
import { render, waitFor } from '@testing-library/react'
import { AuthContext } from '../src'

const authConfig: TAuthConfig = {
  clientId: 'myClientID',
  authorizationEndpoint: 'myAuthEndpoint',
  tokenEndpoint: 'myTokenEndpoint',
  redirectUri: 'http://localhost:3000/',
  scope: 'someScope openid',
  state: 'testState',
  extraAuthParameters: {
    prompt: true,
    client_id: 'anotherClientId',
  },
  extraTokenParameters: {
    prompt: false,
    client_id: 'anotherClientId',
    testKey: 'test Value',
  },
}

const AuthConsumer = () => {
  const { tokenData } = useContext(AuthContext)
  return <div>{tokenData?.name}</div>
}

describe('first page visit should redirect to auth provider for login', () => {
  it('redirects with correct query params', async () => {
    render(
      <AuthProvider authConfig={authConfig}>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() =>
      expect(window.location.replace).toHaveBeenCalledWith(
        expect.stringMatching(
          /^myAuthEndpoint\?response_type=code&client_id=anotherClientId&scope=someScope\+openid&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2F&code_challenge=.{43}&code_challenge_method=S256&prompt=true&state=testState/gm
        )
      )
    )
  })
})
