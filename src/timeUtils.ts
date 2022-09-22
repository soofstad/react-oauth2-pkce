// Returns epoch time (in seconds) for when the token will expire
export const epochAtSecondsFromNow = (secondsFromNow: number) => Math.round(Date.now() / 1000 + secondsFromNow)

/**
 * Check if the Access Token has expired.
 * Will return True if the token has expired, OR there is less than 5min until it expires.
 */
export function epochTimeIsPast(timestamp: number): boolean {
  const now = Math.round(Date.now()) / 1000
  const nowWithBuffer = now + 120
  return nowWithBuffer >= timestamp
}
