import { decodeJWT } from '../src/decodeJWT'
import { epochAtSecondsFromNow, epochTimeIsPast } from '../src/timeUtils'
import { TInternalConfig } from '../src/Types'
import { fetchWithRefreshToken } from '../src/authentication'
import { FetchError } from '../src/errors'

const authConfig: TInternalConfig = {
  autoLogin: false,
  decodeToken: false,
  clientId: 'myClientID',
  authorizationEndpoint: 'myAuthEndpoint',
  tokenEndpoint: 'myTokenEndpoint',
  redirectUri: 'http://localhost:3000/',
  scope: 'someScope openid',
  clearURL: false,
  storage: 'local',
  extraAuthParams: {
    prompt: true,
    client_id: 'anotherClientId',
  },
  extraTokenParameters: {
    prompt: true,
    client_id: 'anotherClientId',
    testKey: 'test Value',
  },
}

test('decode a JWT token', () => {
  const tokenData = decodeJWT(
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.Sfl'
  )
  expect(tokenData?.name).toBe('John Doe')
})

test('decode a non-JWT token', () => {
  console.error = jest.fn()
  expect(() => {
    decodeJWT('somethingStringWhateverThis is not a JWT')
  }).toThrow()
})

test('check if expired token has expired', () => {
  const willExpireAt = epochAtSecondsFromNow(-5) // Expired 5 seconds ago
  const hasExpired = epochTimeIsPast(willExpireAt)
  expect(hasExpired).toBe(true)
})

test('check if still valid token inside buffer has expired', () => {
  const willExpireAt = epochAtSecondsFromNow(5) // Will expire in 5 seconds
  const hasExpired = epochTimeIsPast(willExpireAt)
  expect(hasExpired).toBe(true)
})

test('expire time as string gets correctly converted', () => {
  const expectedEpoch = Math.round(Date.now() / 1000 + 55555)
  const epochSumCalculated = epochAtSecondsFromNow('55555')
  expect(expectedEpoch).toBe(epochSumCalculated)
})

test('expire time as int gets correctly converted', () => {
  const expectedEpoch = Math.round(Date.now() / 1000 + 55555)
  const epochSumCalculated = epochAtSecondsFromNow(55555)
  expect(expectedEpoch).toBe(epochSumCalculated)
})

test('check if still valid token outside buffer has expired', () => {
  const willExpireAt = epochAtSecondsFromNow(301) // Will expire in 5min
  const hasExpired = epochTimeIsPast(willExpireAt)
  expect(hasExpired).toBe(false)
})

test('failed refresh fetch raises FetchError', () => {
  // @ts-ignore
  global.fetch = jest.fn(() =>
    Promise.resolve<any>({
      ok: false,
      status: 400,
      statusText: 'Bad request',
      text: async () => 'Failed to refresh token error body',
    })
  )
  fetchWithRefreshToken({ config: authConfig, refreshToken: '' }).catch((error: unknown) => {
    if (error instanceof FetchError) {
      expect(error.status).toBe(400)
      expect(error.message).toBe('Failed to refresh token error body')
    } else {
      throw new Error('This is the wrong error type')
    }
  })
})
