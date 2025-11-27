import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '../src'
import { AuthConsumer, authConfig } from './test-utils'

test('Full featured logout requests', async () => {
  localStorage.setItem('ROCP_loginInProgress', 'false')
  localStorage.setItem('ROCP_token', '"test-token-value"')
  localStorage.setItem('ROCP_refreshToken', '"test-refresh-value"')
  const user = userEvent.setup()

  render(
    <AuthProvider authConfig={authConfig}>
      <AuthConsumer />
    </AuthProvider>
  )

  await user.click(screen.getByText('Log out'))

  await waitFor(() =>
    expect(window.location.assign).toHaveBeenCalledWith(
      'myLogoutEndpoint?token=test-refresh-value&token_type_hint=refresh_token&client_id=myClientID&ui_locales=en-US+en&testLogoutKey=logoutValue&state=logoutState&post_logout_redirect_uri=primary-logout-redirect'
    )
  )
  expect(window.location.assign).toHaveBeenCalledTimes(1)
})

test('No refresh token, no logoutRedirect, logout request', async () => {
  localStorage.setItem('ROCP_loginInProgress', 'false')
  localStorage.setItem('ROCP_token', '"test-token-value"')
  authConfig.logoutRedirect = undefined
  const user = userEvent.setup()

  render(
    <AuthProvider authConfig={authConfig}>
      <AuthConsumer />
    </AuthProvider>
  )

  await user.click(screen.getByText('Log out'))

  await waitFor(() =>
    expect(window.location.assign).toHaveBeenCalledWith(
      'myLogoutEndpoint?token=test-token-value&token_type_hint=access_token&client_id=myClientID&ui_locales=en-US+en&testLogoutKey=logoutValue&state=logoutState&post_logout_redirect_uri=http%3A%2F%2Flocalhost%2F'
    )
  )
  expect(window.location.assign).toHaveBeenCalledTimes(1)
})
