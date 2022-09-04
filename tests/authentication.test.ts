import { decodeJWT, epochAtSecondsFromNow, epochTimeIsPast } from '../src/authentication'

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

test('check if still valid token outside buffer has expired', () => {
  const willExpireAt = epochAtSecondsFromNow(301) // Will expire in 5min
  const hasExpired = epochTimeIsPast(willExpireAt)
  expect(hasExpired).toBe(false)
})
