import { apiRequest } from "./client"

export interface AdminNotification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}
interface AnnouncementInbox {
  isRead: boolean
  notification: { _id: string; title: string; message: string; type: string; createdAt: string }
}

// Keep super-admin announcements and operational staff events in one UI while
// preserving their distinct backend APIs and read/archive behavior.
export async function loadAdminNotifications() {
  const results = await Promise.allSettled([
    apiRequest<{ success: boolean; data: { notifications: AnnouncementInbox[] } }>("/admin/notifications"),
    apiRequest<{ success: boolean; data: AdminNotification[]; unreadCount: number }>("/admin/staff-activity/notifications?limit=50"),
  ])
  const items: AdminNotification[] = []
  let unreadCount = 0
  const failures: string[] = []
  const announcements = results[0]
  if (announcements.status === "fulfilled" && announcements.value.success !== false && Array.isArray(announcements.value.data?.notifications)) {
    for (const row of announcements.value.data.notifications) {
      if (!row.notification?._id) continue
      items.push({ ...row.notification, id: `announcement:${row.notification._id}`, isRead: row.isRead })
      if (!row.isRead) unreadCount++
    }
  } else failures.push("System announcements could not be loaded.")
  const activity = results[1]
  if (activity.status === "fulfilled" && activity.value.success !== false && Array.isArray(activity.value.data)) {
    items.push(...activity.value.data.map(item => ({ ...item, id: `activity:${item.id}` })))
    unreadCount += activity.value.unreadCount ?? activity.value.data.filter(item => !item.isRead).length
  } else failures.push("Staff notifications could not be loaded.")
  if (failures.length === 2) throw new Error(failures.join(" "))
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return { items: items.slice(0, 50), unreadCount, warning: failures.join(" ") }
}

export async function updateAdminNotification(id: string, action: "read" | "archive") {
  const [source, rawId] = id.split(":")
  if (!rawId || !["announcement", "activity"].includes(source)) throw new Error("Invalid notification")
  const base = source === "activity" ? "/admin/staff-activity/notifications" : "/admin/notifications"
  const result = await apiRequest<{ success: boolean }>(`${base}/${encodeURIComponent(rawId)}/${action}`, { method: "PATCH" })
  if (result.success === false) throw new Error("Could not update notification")
}
