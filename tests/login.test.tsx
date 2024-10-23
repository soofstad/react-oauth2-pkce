import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { AuthProvider } from '../src'
import { AuthConsumer, authConfig } from './test-utils'

test('First page visit should redirect to auth provider for login', async () => {
  render(
    <AuthProvider authConfig={authConfig}>
      <AuthConsumer />
    </AuthProvider>
  )

  await waitFor(() => {
    expect(window.location.assign).toHaveBeenCalledWith(
      expect.stringMatching(
        /^myAuthEndpoint\?response_type=code&client_id=myClientID&redirect_uri=http%3A%2F%2Flocalhost%2F&code_challenge=.{43}&code_challenge_method=S256&scope=someScope\+openid&state=testState/gm
      )
    )
  })
})

test('First page visit should popup to auth provider for login', async () => {
  render(
    <AuthProvider authConfig={{ ...authConfig, loginMethod: 'popup' }}>
      <AuthConsumer />
    </AuthProvider>
  )

  await waitFor(() => {
    expect(window.open).toHaveBeenCalledWith(
      expect.stringMatching(
        /^myAuthEndpoint\?response_type=code&client_id=myClientID&redirect_uri=http%3A%2F%2Flocalhost%2F&code_challenge=.{43}&code_challenge_method=S256&scope=someScope\+openid&state=testState/gm
      ),
      'loginPopup',
      'popup width=600 height=600'
    )
  })
})

test('Attempting to log in with an unsecure context should raise error', async () => {
  // @ts-ignore
  window.crypto.subtle.digest = undefined
  render(
    <AuthProvider authConfig={authConfig}>
      <AuthConsumer />
    </AuthProvider>
  )

  const errorNode = await waitFor(() => screen.findByLabelText('error'))

  expect(errorNode).toHaveTextContent(
    "The context/environment is not secure, and does not support the 'crypto.subtle' module. See: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/subtle for details"
  )
  expect(screen.getByLabelText('loginInProgress')).toHaveTextContent('false')
})
