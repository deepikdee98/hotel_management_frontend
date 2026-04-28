"use client"

import React from "react"

import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { DashboardSidebar } from "./dashboard-sidebar"
import { useAuth } from "@/lib/auth-context"
import type { UserRole, ModuleType } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
  requiredRole?: UserRole | UserRole[]
  requiredModule?: ModuleType
}

export function DashboardLayout({ children, requiredRole, requiredModule }: DashboardLayoutProps) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, hasAccess } = useAuth()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Wait for auth to finish loading from sessionStorage
    if (isLoading) return

    if (!isAuthenticated || !user) {
      router.replace("/")
      return
    }

    // Admin has access to everything
    if (user.role === "admin" || user.role === "hoteladmin" || user.role === "super-admin") {
      setIsReady(true)
      return
    }

    // Check module access if required
    if (requiredModule && !hasAccess(requiredModule)) {
      router.replace("/")
      return
    }

    // Check role access if required
    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
      if (!roles.includes(user.role)) {
        router.replace("/")
        return
      }
    }

    setIsReady(true)
  }, [isLoading, isAuthenticated, user, requiredRole, requiredModule, router, hasAccess])

  if (isLoading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar role={user?.role || "staff"} />
      <div className="ml-64 min-h-screen">
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  )
}
