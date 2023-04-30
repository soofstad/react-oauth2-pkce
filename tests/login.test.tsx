import React from 'react'
import '@testing-library/jest-dom'
import { AuthProvider } from '../src'
import { render, screen, waitFor } from '@testing-library/react'
import { authConfig, AuthConsumer } from './test-utils'

test('First page visit should redirect to auth provider for login', async () => {
  render(
    <AuthProvider authConfig={authConfig}>
      <AuthConsumer />
    </AuthProvider>
  )

  await waitFor(() => {
    expect(window.location.replace).toHaveBeenCalledWith(
      expect.stringMatching(
        /^myAuthEndpoint\?response_type=code&client_id=myClientID&scope=someScope\+openid&redirect_uri=http%3A%2F%2Flocalhost%2F&code_challenge=.{43}&code_challenge_method=S256&state=testState/gm
      )
    )
  })
})

test('Attempting to login with and unsecure context should raise error', async () => {
  // @ts-ignore
  global.crypto.subtle.digest = undefined
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
