"use client"

import React, { useMemo } from "react"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardSidebar } from "./dashboard-sidebar"
import { SetupPopup } from "./setup-popup"
import { useAuth } from "@/lib/auth-context"
import type { UserRole, ModuleType } from "@/lib/types"
import { normalizeSubscriptionStatus } from "@/lib/subscription"
import { AlertTriangle, Loader2, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const DashboardLayoutContext = React.createContext(false)

interface DashboardLayoutProps {
  children: React.ReactNode
  requiredRole?: UserRole | UserRole[]
  requiredModule?: ModuleType | ModuleType[]
}

export function DashboardLayout({ children, requiredRole, requiredModule }: DashboardLayoutProps) {
  const insideDashboardLayout = React.useContext(DashboardLayoutContext)
  const router = useRouter()
  const pathname = usePathname()
  const { user, subscriptionInfo, isAuthenticated, isLoading, hasAccess } = useAuth()
  const [isReady, setIsReady] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const routeModule: ModuleType | undefined =
    pathname.startsWith("/admin/front-office") ? "front-office" :
      pathname.startsWith("/admin/pos") ? "point-of-sale" :
        pathname.startsWith("/admin/housekeeping") ? "housekeeping" :
          pathname.startsWith("/admin/accounts") ? "accounts" :
            pathname.startsWith("/admin/inventory") ? "inventory" :
              pathname.startsWith("/admin/reports") ? "reports" :
                undefined

  const modulesToCheck = useMemo(
    () =>
      requiredModule
        ? Array.isArray(requiredModule)
          ? requiredModule
          : [requiredModule]
        : routeModule
          ? [routeModule]
          : [],
    [requiredModule, routeModule]
  )
  const subscriptionStatus = normalizeSubscriptionStatus(subscriptionInfo?.status)

  if (insideDashboardLayout) {
    return <>{children}</>
  }

  useEffect(() => {
    // Wait for auth to finish loading from sessionStorage
    if (isLoading) return

    if (!isAuthenticated || !user) {
      router.replace("/")
      return
    }

    // Check module access if required
    if (modulesToCheck.length > 0 && !modulesToCheck.some((module) => hasAccess(module))) {
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
  }, [isLoading, isAuthenticated, user, requiredRole, modulesToCheck, router, hasAccess])

  if (isLoading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardLayoutContext.Provider value={true}>
        <SetupPopup />
        {mobileSidebarOpen && (
          <button
            aria-label="Close navigation"
            className="fixed inset-0 z-30 bg-black/35 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
        <DashboardSidebar
          role={user?.role || "staff"}
          collapsed={sidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          onCollapsedChange={setSidebarCollapsed}
          onMobileOpenChange={setMobileSidebarOpen}
        />
        <div
          className={cn(
            "min-h-screen transition-[padding] duration-300",
            sidebarCollapsed ? "lg:pl-16" : "lg:pl-60"
          )}
        >
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="text-sm font-semibold">HotelManager</span>
          </header>
          <main className="admin-content w-full min-w-0 overflow-x-hidden p-3 sm:p-5 lg:p-6">
            {subscriptionStatus === "WARNING" && subscriptionInfo?.message && (
              <div className="mb-4 flex items-start gap-3 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 shadow-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{subscriptionInfo.message}</span>
              </div>
            )}

            {subscriptionStatus === "GRACE" && subscriptionInfo?.message && (
              <div className="mb-4 flex items-start gap-3 rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm font-medium text-yellow-900 shadow-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{subscriptionInfo.message}</span>
              </div>
            )}

            {children}
          </main>
        </div>
      </DashboardLayoutContext.Provider>
    </div>
  )
}
