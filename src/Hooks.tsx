import { useEffect, useState } from 'react'

function useBrowserStorage<T>(
  key: string,
  initialValue: T,
  type: 'session' | 'local' | 'cookie',
  baseDomain: string = ''
): [T, (v: T) => void] {
  const storage = type === 'session' ? sessionStorage : localStorage

  const getBaseDomain = (): string => {
    if (baseDomain) return baseDomain

    const domainParts = window.location.hostname.split('.')
    return domainParts.length > 1
      ? `${domainParts[domainParts.length - 2]}.${domainParts[domainParts.length - 1]}`
      : domainParts[0]
  }

  const getCookie = (name: string): string | null => {
    const value = ` ${document.cookie}`
    const parts = value.split(` ${name}=`)
    if (parts.length === 2) return parts.pop()?.split('').shift() ?? null
    return null
  }

  const deleteCookie = (name: string) => {
    document.cookie = `${name}= path=/ domain=.${getBaseDomain()} max-age=0`
  }

  const setCookie = (key: string, value: string) => {
    const cookieString = `${key}=${value}path=/domain=.${getBaseDomain()}max-age=31536000` // Store for a year
    document.cookie = cookieString
  }

  const [storedValue, setStoredValue] = useState<T>(() => {
    // added cookie case
    if (type === 'cookie') {
      if (initialValue === undefined) return initialValue

      const item = getCookie(key)
      try {
        return item ? JSON.parse(item) : initialValue
      } catch (error: any) {
        console.warn(
          `Failed to parse stored value for '${key}'.\nContinuing with default value.\nError: ${error.message}`
        )
        return initialValue
      }
    } else {
      const item = storage.getItem(key)
      try {
        return item ? JSON.parse(item) : initialValue
      } catch (_error: unknown) {
        console.warn(`Failed to parse stored value for '${key}'.\nContinuing with default value.`)
        return initialValue
      }
    }
  })

  const setValue = (value: T | ((val: T) => T)): void => {
    // added cookie case
    if (type === 'cookie') {
      if (value === undefined) {
        setStoredValue(value as any)
        deleteCookie(key)
        return
      }
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        setCookie(key, JSON.stringify(valueToStore))
      } catch (_error) {
        console.log(`Failed to store value '${value}' for key '${key}'`)
      }
    } else {
      if (value === undefined) {
        // Delete item if set to undefined. This avoids warning on loading invalid json
        setStoredValue(value)
        storage.removeItem(key)
        return
      }
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        storage.setItem(key, JSON.stringify(valueToStore))
      } catch (_error) {
        console.error(`Failed to store value '${value}' for key '${key}'`)
      }
    }
  }

  useEffect(() => {
    if (type === 'cookie') {
      // To support changes on multi-domain cookies, we resort to polling
      // In the future, change this to CookieStore API which supports Cookie Change Events
      // This is unsupported by Safari and IE11 though, so we need to keep polling for those
      // https://stackoverflow.com/questions/14344319/can-i-be-notified-of-cookie-changes-in-client-side-javascript

      const checkInterval = 1000 // check every second
      let lastCookieValue = getCookie(key)

      function checkForCookieChange() {
        const currentCookieValue = getCookie(key)
        if (lastCookieValue !== currentCookieValue) {
          lastCookieValue = currentCookieValue
          try {
            setStoredValue(currentCookieValue ? JSON.parse(currentCookieValue) : initialValue)
          } catch (error: any) {
            console.warn(
              `Failed to parse stored value for '${key}' due to cookie change.\nContinuing with default value.\nError: ${error.message}`
            )
          }
        }
      }

      const intervalId = setInterval(checkForCookieChange, checkInterval)
      return () => clearInterval(intervalId) // cleanup on unmount
    } else {
      const storageEventHandler = (event: StorageEvent) => {
        if (event.storageArea === storage && event.key === key) {
          if (event.newValue === null) {
            setStoredValue(undefined as T)
          } else {
            try {
              setStoredValue(JSON.parse(event.newValue ?? '') as T)
            } catch (_error: unknown) {
              console.warn(
                `Failed to handle storageEvent's newValue='${event.newValue}' for key '${key}'`
              )
            }
          }
        }
      }
      window.addEventListener('storage', storageEventHandler, false)
      return () => window.removeEventListener('storage', storageEventHandler, false)
    }
  })

  return [storedValue, setValue]
}

export default useBrowserStorage
