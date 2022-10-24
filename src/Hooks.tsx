import { useEffect, useState } from 'react'

function useLocalStorage<T>(key: string, initialValue: T): [T, (v: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = localStorage.getItem(key)
    try {
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)): void => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.log(`Failed to store value '${value}' for key '${key}'`)
    }
  }

  useEffect(() => {
    const storageEventHandler = (event: StorageEvent) => {
      if (event.storageArea === localStorage && event.key === key) {
        setStoredValue(JSON.parse(event.newValue ?? '') as T)
      }
    }
    window.addEventListener('storage', storageEventHandler, false)
    return () => window.removeEventListener('storage', storageEventHandler, false)
  })

  return [storedValue, setValue]
}

export default useLocalStorage
