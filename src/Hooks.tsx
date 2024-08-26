import { useEffect, useState } from 'react'

function isString(value: any): boolean {
  return typeof value === 'string' || value instanceof String;
}

function useBrowserStorage<T>(key: string, initialValue: T, type: 'session' | 'local'): [T, (v: T) => void] {
  const storage = type === 'session' ? sessionStorage : localStorage

  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = storage.getItem(key)
    try {
      return item ? JSON.parse(item) : initialValue
    } catch (error: unknown) {
      console.warn(`Failed to parse stored value for '${key}'.\nContinuing with default value.`)
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)): void => {
    if (value === undefined) {
      // Delete item if set to undefined. This avoids warning on loading invalid json
      setStoredValue(value)
      storage.removeItem(key)
      return
    }
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)

      const storageString = isString(valueToStore) ? (valueToStore as string) : JSON.stringify(valueToStore);
      storage.setItem(key, storageString)
    } catch (error) {
      console.error(`Failed to store value '${value}' for key '${key}'`)
    }
  }

  useEffect(() => {
    const storageEventHandler = (event: StorageEvent) => {
      if (event.storageArea === storage && event.key === key) {
        if (event.newValue === null) {
          setStoredValue(undefined as T)
        } else {
          try {
            setStoredValue(JSON.parse(event.newValue ?? '') as T)
          } catch (error: unknown) {
            console.warn(`Failed to handle storageEvent's newValue='${event.newValue}' for key '${key}'`)
          }
        }
      }
    }
    window.addEventListener('storage', storageEventHandler, false)
    return () => window.removeEventListener('storage', storageEventHandler, false)
  })

  return [storedValue, setValue]
}

export default useBrowserStorage
