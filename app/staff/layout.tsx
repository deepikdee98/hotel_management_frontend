"use client"

import React from "react"
import { AuthProvider } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <DashboardLayout requiredRole="staff">{children}</DashboardLayout>
    </AuthProvider>
  )
}
