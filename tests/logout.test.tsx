import { expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { AuthProvider } from '../src'
import { navigate } from '../src/httpUtils'
import { AuthConsumer, authConfig } from './test-utils'

test('Full featured logout requests', async () => {
  localStorage.setItem('ROCP_loginInProgress', 'false')
  localStorage.setItem('ROCP_token', '"test-token-value"')
  localStorage.setItem('ROCP_refreshToken', '"test-refresh-value"')

  render(
    <AuthProvider authConfig={authConfig}>
      <AuthConsumer />
    </AuthProvider>
  )

  await userEvent.click(page.getByText('Log out'))

  await vi.waitFor(() =>
    expect(navigate).toHaveBeenCalledWith(
      'myLogoutEndpoint?token=test-refresh-value&token_type_hint=refresh_token&client_id=myClientID&post_logout_redirect_uri=primary-logout-redirect&ui_locales=en-US%40posix&testLogoutKey=logoutValue&state=logoutState'
    )
  )
  expect(navigate).toHaveBeenCalledTimes(1)
})

test('No refresh token, no logoutRedirect, logout request', async () => {
  localStorage.setItem('ROCP_loginInProgress', 'false')
  localStorage.setItem('ROCP_token', '"test-token-value"')
  authConfig.logoutRedirect = undefined

  render(
    <AuthProvider authConfig={authConfig}>
      <AuthConsumer />
    </AuthProvider>
  )

  await userEvent.click(page.getByText('Log out'))

  await vi.waitFor(() =>
    expect(navigate).toHaveBeenCalledWith(
      'myLogoutEndpoint?token=test-token-value&token_type_hint=access_token&client_id=myClientID&post_logout_redirect_uri=http%3A%2F%2Flocalhost%2F&ui_locales=en-US%40posix&testLogoutKey=logoutValue&state=logoutState'
    )
  )
  expect(navigate).toHaveBeenCalledTimes(1)
})
