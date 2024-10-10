import type { TTokenData } from './types'

/**
 * Decodes the base64 encoded JWT. Returns a TToken.
 */
export const decodeJWT = (token: string): TTokenData => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    console.error(e)
    throw Error(
      'Failed to decode the access token.\n\tIs it a proper JSON Web Token?\n\t' +
        "You can disable JWT decoding by setting the 'decodeToken' value to 'false' the configuration."
    )
  }
}

export const decodeAccessToken = (token: string | null | undefined): TTokenData | undefined => {
  if (!token || !token.length) return undefined
  try {
    return decodeJWT(token)
  } catch (e) {
    console.warn(`Failed to decode access token: ${(e as Error).message}`)
  }
}

export const decodeIdToken = (idToken: string | null | undefined): TTokenData | undefined => {
  if (!idToken || !idToken.length) return undefined
  try {
    return decodeJWT(idToken)
  } catch (e) {
    console.warn(`Failed to decode idToken: ${(e as Error).message}`)
  }
}
