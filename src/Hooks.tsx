import { useCallback, useEffect } from 'react'

interface Props<T> {
  key: string
  storage: Storage
  initialValue: T
  onChange?: (newValue: T) => void
}

function useBrowserStorage<T>({ key, storage, initialValue, onChange }: Props<T>): [() => T, (v: T) => void] {
  const getValue = useCallback(() => {
    const storedValue = storage.getItem(key)
    try {
      return storedValue ? JSON.parse(storedValue) : null
    } catch (error) {
      console.error(`Error parsing storage value for key "${key}":`, error)
      return null
    }
  }, [key])

  const setValue = useCallback(
    (value: T) => {
      try {
        if (value === undefined || value === null) {
          storage.removeItem(key)

          // Browser ONLY dispatch storage events to other tabs, NOT current tab.
          // We need to manually dispatch storage event for current tab
          window.dispatchEvent(
            new StorageEvent('storage', {
              storageArea: storage,
              url: window.location.href,
              key,
            })
          )
        } else {
          const oldValue = storage.getItem(key)
          const newValue = JSON.stringify(value)

          storage.setItem(key, newValue)

          // Browser ONLY dispatch storage events to other tabs, NOT current tab.
          // We need to manually dispatch storage event for current tab
          window.dispatchEvent(
            new StorageEvent('storage', {
              storageArea: window.localStorage,
              url: window.location.href,
              key,
              newValue,
              oldValue,
            })
          )
        }
      } catch (error) {
        console.error(`Error setting storage value for key "${key}":`, error)
      }
    },
    [key]
  )

  useEffect(() => {
    const storedValue = getValue()
    if (storedValue === null && initialValue !== null && initialValue !== undefined) {
      setValue(initialValue)
    }
  }, [getValue, setValue, initialValue])

  useEffect(() => {
    const storageEventHandler = (event: StorageEvent) => {
      if (event.key !== key || event.storageArea !== storage) return

      try {
        onChange && onChange(event.newValue ? JSON.parse(event.newValue) : undefined)
      } catch (e) {
        console.warn(`Failed to handle storageEvent's newValue='${event.newValue}' for key '${key}'`)
      }
    }

    if (typeof window === 'undefined') return

    if (onChange === undefined) return

    window.addEventListener('storage', storageEventHandler, false)

    return () => window.removeEventListener('storage', storageEventHandler, false)
  }, [key, storage, onChange])

  useEffect(() => {
    if (onChange === undefined) return

    const storedValue = storage.getItem(key)
    onChange(storedValue ? JSON.parse(storedValue) : undefined)
  }, [])

  return [getValue, setValue]
}

export default useBrowserStorage
