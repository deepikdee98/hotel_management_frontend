"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { loadAdminNotifications, updateAdminNotification, type AdminNotification } from "@/services/api/admin-notifications.service"

interface NotificationState {
  notifications: AdminNotification[]
  unreadCount: number
  loading: boolean
  error: string
  enabled: boolean
  refresh: () => Promise<void>
  markRead: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
}
const Context = createContext<NotificationState | null>(null)

export function AdminNotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const enabled = user?.role === "admin" || user?.role === "company-admin"
  const [propertyId, setPropertyId] = useState("")
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  useEffect(() => {
    const warn = () => toast({ title: "Activity recording failed", description: "Your action succeeded, but its activity record could not be saved. Contact an administrator; do not repeat the action.", variant: "destructive" })
    window.addEventListener("hotel:activity-warning", warn)
    return () => window.removeEventListener("hotel:activity-warning", warn)
  }, [toast])

  const generation = useRef(0)
  const requestId = useRef(0)
  const seen = useRef<Set<string> | null>(null)

  useEffect(() => {
    const update = () => setPropertyId(localStorage.getItem("activePropertyId") || user?.hotelId || "")
    update()
    window.addEventListener("hotel:property-changed", update)
    return () => window.removeEventListener("hotel:property-changed", update)
  }, [user?.hotelId])

  const refresh = useCallback(async () => {
    if (!enabled) return
    const scope = generation.current
    const request = ++requestId.current
    try {
      const response = await loadAdminNotifications()
      if (scope !== generation.current || request !== requestId.current) return
      const items = response.items
      const fresh = seen.current ? items.filter(item => !item.isRead && !seen.current!.has(item.id)) : []
      // Retain seen IDs so older notifications returning after a deletion do not alert again.
      if (!seen.current) seen.current = new Set()
      items.forEach(item => seen.current!.add(item.id))
      setNotifications(items)
      setUnreadCount(response.unreadCount)
      setError(response.warning)
      if (fresh.length) toast({ title: fresh.length === 1 ? fresh[0].title : `${fresh.length} new notifications`, description: fresh[0].message })
    } catch (cause) {
      if (scope === generation.current && request === requestId.current) setError(cause instanceof Error ? cause.message : "Unable to load notifications")
    } finally {
      if (scope === generation.current && request === requestId.current) setLoading(false)
    }
  }, [enabled, propertyId, user?.id, toast])

  useEffect(() => {
    generation.current++
    seen.current = null
    setNotifications([])
    setUnreadCount(0)
    setError("")
    setLoading(enabled)
    void refresh()
    const onRefresh = () => { if (document.visibilityState !== "hidden") void refresh() }
    const timer = window.setInterval(onRefresh, 15000)
    window.addEventListener("hotel:realtime-change", onRefresh)
    window.addEventListener("focus", onRefresh)
    document.addEventListener("visibilitychange", onRefresh)
    return () => {
      generation.current++
      window.clearInterval(timer)
      window.removeEventListener("hotel:realtime-change", onRefresh)
      window.removeEventListener("focus", onRefresh)
      document.removeEventListener("visibilitychange", onRefresh)
    }
  }, [enabled, refresh])

  const mutate = async (id: string, operation: (id: string) => Promise<unknown>) => {
    const scope = generation.current
    await operation(id)
    if (scope === generation.current) await refresh()
  }
  return <Context.Provider value={{ notifications, unreadCount, loading, error, enabled, refresh, markRead: id => mutate(id, value => updateAdminNotification(value, "read")), remove: id => mutate(id, value => updateAdminNotification(value, "archive")) }}>{children}</Context.Provider>
}

export function useAdminNotifications() {
  const context = useContext(Context)
  if (!context) throw new Error("Admin notification provider is missing")
  return context
}
