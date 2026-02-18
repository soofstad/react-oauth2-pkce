import { useEffect, useMemo, useRef } from 'react'

/**
 * Sleep-proof interval, used to execute a callback at a specified interval.
 * If the system goes to sleep and wakes up later, the callback will be executed
 * immediately (within 100ms) after waking up if the specified delay has passed.
 */
export function useInterval(callback: () => void, delay: number, maxRandomStaggerMs: number): void {
  const lastTime = useRef(Date.now())

  const randomStagger = useMemo(() => Math.random() * maxRandomStaggerMs, [maxRandomStaggerMs])

  function tick() {
    const now = Date.now()
    const totalDelay = delay + Math.random() * randomStagger
    if (now - lastTime.current >= totalDelay) {
      callback()
      lastTime.current = now
    }
  }

  useEffect(() => {
    tick() // Tick immediately on mount/effect, instead of waiting for the first interval to pass
    const interval = setInterval(tick, 100) // Run tick every 100ms to check if the specified delay has passed
    return () => clearInterval(interval)
  }, [callback, delay, randomStagger])
}
