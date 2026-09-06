"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAdminNotifications } from "@/lib/admin-notifications-context"

export default function NotificationsPage() {
  const { notifications, unreadCount, enabled, loading, error, refresh, markRead, remove } = useAdminNotifications()
  const [filter, setFilter] = useState("all")
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState("")
  const act = async (action: () => Promise<unknown>) => {
    setBusy(true)
    setActionError("")
    try { await action() } catch { setActionError("Could not update notifications. Please retry.") } finally { setBusy(false) }
  }
  if (!enabled) return <p>Notifications are available to hotel administrators.</p>
  const items = notifications.filter(item => filter === "all" || (filter === "unread" ? !item.isRead : item.isRead))
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold">Notifications</h1><p className="text-muted-foreground">Staff actions and hotel updates · {unreadCount} unread</p></div>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline"><Link href="/admin/staff-activity">Staff activity history</Link></Button>
        <Button variant="outline" disabled={busy || loading} onClick={() => void refresh()}>Refresh</Button>
        <Button disabled={busy || !notifications.some(item => !item.isRead)} onClick={() => void act(async () => {
          for (const item of notifications.filter(item => !item.isRead)) await markRead(item.id)
        })}>Mark displayed as read</Button>
      </div>
    </div>
    {(error || actionError) && <p role="alert" className="text-destructive">{actionError || error}</p>}
    <div className="flex gap-2" aria-label="Filter notifications">{["all", "unread", "read"].map(value => <Button key={value} variant={filter === value ? "default" : "outline"} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value[0].toUpperCase() + value.slice(1)}</Button>)}</div>
    {loading ? <p>Loading notifications…</p> : !error && !items.length ? <p>No {filter === "all" ? "" : filter + " "}notifications.</p> : null}
    {items.map(item => <Card key={item.id} className={item.isRead ? "" : "border-primary/40 bg-primary/5"}><CardContent className="space-y-2 p-4">
      <h2 className="font-semibold">{!item.isRead && <span className="mr-2 text-primary" aria-label="Unread">●</span>}{item.title}</h2>
      <p className="text-sm">{item.message}</p>
      <time className="block text-xs text-muted-foreground" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time>
      <div className="flex gap-2">{!item.isRead && <Button size="sm" variant="outline" disabled={busy} onClick={() => void act(() => markRead(item.id))}>Mark as read</Button>}<Button size="sm" variant="ghost" disabled={busy} onClick={() => void act(() => remove(item.id))}>Dismiss</Button></div>
    </CardContent></Card>)}
    <p className="text-xs text-muted-foreground">Showing the latest 50 notifications. Dismissing a notification keeps the staff activity history.</p>
  </div>
}
