"use client"

import { useCallback, useEffect, useState } from "react"
import { getSetupOptions, type SetupOption } from "@/lib/backend-api"

const cache = new Map<string, SetupOption[]>()
const listeners = new Set<() => void>()

export function invalidateSetupOptions(type?: string) {
  if (type) {
    cache.delete(type)
  } else {
    cache.clear()
  }
  listeners.forEach((listener) => listener())
}

export function useSetupOptions(type: string) {
  const [data, setData] = useState<SetupOption[]>(() => cache.get(type) || [])
  const [loading, setLoading] = useState(!cache.has(type))
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async (force = false) => {
    if (!type) return
    if (!force && cache.has(type)) {
      setData(cache.get(type) || [])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const options = await getSetupOptions(type)
      cache.set(type, options)
      setData(options)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load setup options"))
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => {
    load()
    const listener = () => load(true)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [load])

  return {
    data,
    loading,
    error,
    refresh: () => load(true),
  }
}
