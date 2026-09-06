"use client"

import React from "react"
import { AdminNotificationBell } from "@/components/admin-notification-bell"
import { AdminNotificationsProvider } from "@/lib/admin-notifications-context"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminNotificationsProvider>
      <DashboardLayout requiredRole={["admin", "staff", "company-admin"]}>
        <div className="flex justify-end"><AdminNotificationBell /></div>
        {children}
      </DashboardLayout>
    </AdminNotificationsProvider>
  )
}
