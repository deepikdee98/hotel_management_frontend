"use client"

import Link from "next/link"
import { Bell, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAdminNotifications } from "@/lib/admin-notifications-context"

export function AdminNotificationBell() {
  const { enabled, unreadCount, error } = useAdminNotifications()
  if (!enabled) return null
  return <Button asChild variant="outline" size="icon" className="relative shrink-0">
    <Link href="/admin/notifications" aria-label={error ? "Notifications unavailable — open to retry" : `Notifications, ${unreadCount} unread`}>
      <Bell className="h-5 w-5" />
      {error ? <AlertCircle className="absolute -right-1 -top-1 h-4 w-4 text-destructive" /> : unreadCount > 0 && <span className="absolute -right-2 -top-2 rounded-full bg-destructive px-1.5 text-xs text-destructive-foreground">{unreadCount > 99 ? "99+" : unreadCount}</span>}
    </Link>
  </Button>
}
