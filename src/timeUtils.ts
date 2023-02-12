import { TTokenResponse } from './Types'
export const FALLBACK_EXPIRE_TIME = 600 // 10minutes

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

const refreshExpireKeys = [
  'refresh_expires_in', // KeyCloak
  'refresh_token_expires_in', // Azure AD
] as const

export function getRefreshExpiresIn(tokenExpiresIn: number, response: TTokenResponse): number {
  for (const key of refreshExpireKeys) {
    if (key in response) return response[key] as number
  }
  return tokenExpiresIn + FALLBACK_EXPIRE_TIME
}
