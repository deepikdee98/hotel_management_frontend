"use client"

import React from "react"

import { DashboardLayout } from "@/components/dashboard-layout"

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardLayout requiredRole="super-admin">{children}</DashboardLayout>
  )
}
