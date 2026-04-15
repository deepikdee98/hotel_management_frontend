"use client"

import React from "react"

import { AuthProvider } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <DashboardLayout requiredRole="super-admin">{children}</DashboardLayout>
    </AuthProvider>
  )
}
