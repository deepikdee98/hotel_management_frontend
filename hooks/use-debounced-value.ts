"use client"

import { useEffect, useState } from "react"

export function useDebouncedValue<T>(value: T, delay = 300) {
  const safeDelay = Number.isFinite(delay) && delay > 0 ? delay : 0
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), safeDelay)
    return () => window.clearTimeout(timer)
  }, [value, safeDelay])

  return debouncedValue
}
