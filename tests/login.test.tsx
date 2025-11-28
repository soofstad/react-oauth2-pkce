import { expect, test, vi } from 'vitest'
import { page } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { AuthProvider } from '../src'
import { navigate, openPopup } from '../src/httpUtils'
import { AuthConsumer, authConfig } from './test-utils'

test('First page visit should redirect to auth provider for login', async () => {
  render(
    <AuthProvider authConfig={authConfig}>
      <AuthConsumer />
    </AuthProvider>
  )

  await vi.waitFor(() => {
    expect(navigate).toHaveBeenCalledWith(
      expect.stringMatching(
        /^myAuthEndpoint\?response_type=code&client_id=myClientID&redirect_uri=http%3A%2F%2Flocalhost%2F&code_challenge=.{43}&code_challenge_method=S256&scope=someScope\+openid&state=testState/gm
      ),
      'assign'
    )
  })
})

test('First page visit should popup to auth provider for login', async () => {
  render(
    <AuthProvider authConfig={{ ...authConfig, loginMethod: 'popup' }}>
      <AuthConsumer />
    </AuthProvider>
  )

  await vi.waitFor(() => {
    expect(openPopup).toHaveBeenCalledWith(
      expect.stringMatching(
        /^myAuthEndpoint\?response_type=code&client_id=myClientID&redirect_uri=http%3A%2F%2Flocalhost%2F&code_challenge=.{43}&code_challenge_method=S256&scope=someScope\+openid&state=testState/gm
      ),
      600,
      600,
      100,
      300
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

  const errorNode = await page.getByTestId('error')

  await vi.waitFor(() =>
    expect(errorNode).toHaveTextContent(
      "The context/environment is not secure, and does not support the 'crypto.subtle' module. See: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/subtle for details"
    )
  )
  expect(page.getByTestId('loginInProgress')).toHaveTextContent('false')
})
