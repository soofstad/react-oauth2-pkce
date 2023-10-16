import { epochAtSecondsFromNow, FALLBACK_EXPIRE_TIME } from './timeUtils'
import { useBrowserStorage, useCookieStorage } from './Hooks'
import { TInternalConfig } from './Types'

interface IUseStorage {
  refreshToken: string | undefined
  setRefreshToken: (v: string | undefined) => void
  refreshTokenExpire: number
  setRefreshTokenExpire: (v: number) => void
  token: string
  setToken: (v: string) => void
  tokenExpire: number
  setTokenExpire: (v: number) => void
  idToken: string | undefined
  setIdToken: (v: string | undefined) => void
  loginInProgress: boolean
  setLoginInProgress: (v: boolean) => void
  refreshInProgress: boolean
  setRefreshInProgress: (v: boolean) => void
}

// useStorage is a hook which abstracts the storage mechanism for the auth tokens
// crucially, when config.storage === 'cookie', it will use the useCookieStorage hook
// instead of the useBrowserStorage hook to store the tokens in cookies instead of localStorage

export const useStorage = (config: TInternalConfig): IUseStorage => {
  const [refreshToken, setRefreshToken] = useBrowserStorage<string | undefined>(
    'refreshToken',
    undefined,
    config.storage,
    config.storageKeyPrefix
  )

  const [refreshTokenCookie, setRefreshTokenCookie] = useCookieStorage<string | undefined>(
    'refreshToken',
    undefined,
    config.storageKeyPrefix,
    config.baseDomain
  )

  const [refreshTokenExpire, setRefreshTokenExpire] = useBrowserStorage<number>(
    'refreshTokenExpire',
    epochAtSecondsFromNow(2 * FALLBACK_EXPIRE_TIME),
    config.storage,
    config.storageKeyPrefix
  )

  const [refreshTokenExpireCookie, setRefreshTokenExpireCookie] = useCookieStorage<number>(
    'refreshTokenExpire',
    epochAtSecondsFromNow(2 * FALLBACK_EXPIRE_TIME),
    config.storageKeyPrefix,
    config.baseDomain
  )

  const [token, setToken] = useBrowserStorage<string>('token', '', config.storage, config.storageKeyPrefix)

  const [tokenCookie, setTokenCookie] = useCookieStorage<string>(
    'token',
    '',
    config.storageKeyPrefix,
    config.baseDomain
  )

  const [tokenExpire, setTokenExpire] = useBrowserStorage<number>(
    'tokenExpire',
    epochAtSecondsFromNow(FALLBACK_EXPIRE_TIME),
    config.storage,
    config.storageKeyPrefix
  )

  const [tokenExpireCookie, setTokenExpireCookie] = useCookieStorage<number>(
    'tokenExpire',
    epochAtSecondsFromNow(FALLBACK_EXPIRE_TIME),
    config.storageKeyPrefix,
    config.baseDomain
  )

  const [idToken, setIdToken] = useBrowserStorage<string | undefined>(
    'idToken',
    undefined,
    config.storage,
    config.storageKeyPrefix
  )

  const [idTokenCookie, setIdTokenCookie] = useCookieStorage<string | undefined>(
    'idToken',
    undefined,
    config.storageKeyPrefix,
    config.baseDomain
  )

  const [loginInProgress, setLoginInProgress] = useBrowserStorage<boolean>(
    'loginInProgress',
    false,
    config.storage,
    config.storageKeyPrefix
  )

  const [loginInProgressCookie, setLoginInProgressCookie] = useCookieStorage<boolean>(
    'loginInProgress',
    false,
    config.storageKeyPrefix,
    config.baseDomain
  )

  const [refreshInProgress, setRefreshInProgress] = useBrowserStorage<boolean>(
    'refreshInProgress',
    false,
    config.storage,
    config.storageKeyPrefix
  )

  const [refreshInProgressCookie, setRefreshInProgressCookie] = useCookieStorage<boolean>(
    'refreshInProgress',
    false,
    config.storageKeyPrefix,
    config.baseDomain
  )

  return config.storage === 'cookie'
    ? {
        refreshToken: refreshTokenCookie,
        setRefreshToken: setRefreshTokenCookie,
        refreshTokenExpire: refreshTokenExpireCookie,
        setRefreshTokenExpire: setRefreshTokenExpireCookie,
        token: tokenCookie,
        setToken: setTokenCookie,
        tokenExpire: tokenExpireCookie,
        setTokenExpire: setTokenExpireCookie,
        idToken: idTokenCookie,
        setIdToken: setIdTokenCookie,
        loginInProgress: loginInProgressCookie,
        setLoginInProgress: setLoginInProgressCookie,
        refreshInProgress: refreshInProgressCookie,
        setRefreshInProgress: setRefreshInProgressCookie,
      }
    : {
        refreshToken,
        setRefreshToken,
        refreshTokenExpire,
        setRefreshTokenExpire,
        token,
        setToken,
        tokenExpire,
        setTokenExpire,
        idToken,
        setIdToken,
        loginInProgress,
        setLoginInProgress,
        refreshInProgress,
        setRefreshInProgress,
      }
}
