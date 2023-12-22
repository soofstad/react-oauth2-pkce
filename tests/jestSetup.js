const { TextDecoder, TextEncoder } = require('util')
const nodeCrypto = require('crypto')

beforeEach(() => {
  localStorage.removeItem('ROCP_loginInProgress')
  localStorage.removeItem('ROCP_token')
  localStorage.removeItem('ROCP_refreshToken')
  localStorage.removeItem('PKCE_code_verifier')

  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder

  global.crypto.subtle = nodeCrypto.webcrypto.subtle

  // biome-ignore lint: set undefine does not work...
  delete window.location
  const location = new URL('https://www.example.com')
  location.replace = jest.fn()
  window.location = location
})
