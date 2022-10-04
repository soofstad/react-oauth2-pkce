const { TextDecoder, TextEncoder } = require('util')
const nodeCrypto = require('crypto')

// Add some mocks
beforeAll(() => {
  global.TextEncoder = TextEncoder
  // @ts-ignore
  global.TextDecoder = TextDecoder

  // @ts-ignore
  delete window.location
  const location = new URL('https://www.example.com')
  // @ts-ignore
  location.replace = jest.fn()
  // @ts-ignore
  window.location = location

  window.crypto = {
    subtle: nodeCrypto.webcrypto.subtle,
    getRandomValues: nodeCrypto.webcrypto.getRandomValues.bind(nodeCrypto.webcrypto),
  }
})
