"use client"

import React from "react"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
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
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading, hasAccess } = useAuth()
  const [isReady, setIsReady] = useState(false)

  const routeModule =
    pathname.startsWith("/admin/front-office") ? "front-office" :
    pathname.startsWith("/admin/pos") ? "point-of-sale" :
    pathname.startsWith("/admin/housekeeping") ? "housekeeping" :
    pathname.startsWith("/admin/accounts") ? "accounts" :
    pathname.startsWith("/admin/inventory") ? "inventory" :
    pathname.startsWith("/admin/reports") ? "reports" :
    undefined

  const moduleToCheck = requiredModule || routeModule

  useEffect(() => {
    // Wait for auth to finish loading from sessionStorage
    if (isLoading) return

    if (!isAuthenticated || !user) {
      router.replace("/")
      return
    }

    // Check module access if required
    if (moduleToCheck && !hasAccess(moduleToCheck)) {
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
  }, [isLoading, isAuthenticated, user, requiredRole, moduleToCheck, router, hasAccess])

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
