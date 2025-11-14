
import {vi, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { AuthProvider } from '../src'
import { AuthConsumer, authConfig } from './test-utils'
import {navigate} from "../src/httpUtils";

test('First page visit should redirect to auth provider for login', async () => {
    const navigateSpy = vi.spyOn(navigate).mockImplementation(() => console.log('navigate called'))
  render(
    <AuthProvider authConfig={authConfig}>
      <AuthConsumer />
    </AuthProvider>
  )

  await vi.waitFor(() => {
    expect(navigateSpy).toHaveBeenCalledWith(
      expect.stringMatching(
        /^myAuthEndpoint\?response_type=code&client_id=myClientID&redirect_uri=http%3A%2F%2Flocalhost%2F&code_challenge=.{43}&code_challenge_method=S256&scope=someScope\+openid&state=testState/gm
      )
    )
  })
})

// test('First page visit should popup to auth provider for login', async () => {
//   // set window size to 1200x800 to make test predictable in different environments
//   global.innerWidth = 1200
//   global.innerHeight = 800
//   render(
//     <AuthProvider authConfig={{ ...authConfig, loginMethod: 'popup' }}>
//       <AuthConsumer />
//     </AuthProvider>
//   )
//
//   await vi.waitFor(() => {
//     expect(window.open).toHaveBeenCalledWith(
//       expect.stringMatching(
//         /^myAuthEndpoint\?response_type=code&client_id=myClientID&redirect_uri=http%3A%2F%2Flocalhost%2F&code_challenge=.{43}&code_challenge_method=S256&scope=someScope\+openid&state=testState/gm
//       ),
//       'loginPopup',
//       'width=600,height=600,top=100,left=300'
//     )
//   })
// })
//
// test('Attempting to log in with an unsecure context should raise error', async () => {
//   // @ts-ignore
//   window.crypto.subtle.digest = undefined
//   render(
//     <AuthProvider authConfig={authConfig}>
//       <AuthConsumer />
//     </AuthProvider>
//   )
//
//   const errorNode = await vi.waitFor(() => screen.getByTestId('error'))
//
//   await vi.waitFor(() =>
//     expect(errorNode).toHaveTextContent(
//       "The context/environment is not secure, and does not support the 'crypto.subtle' module. See: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/subtle for details"
//     )
//   )
//   expect(screen.getByTestId('loginInProgress')).toHaveTextContent('false')
// })
