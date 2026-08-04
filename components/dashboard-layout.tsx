"use client"

import React, { useMemo } from "react"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardSidebar } from "./dashboard-sidebar"
import { SetupPopup } from "./setup-popup"
import { useAuth } from "@/lib/auth-context"
import { useBranding } from "@/lib/branding-context"
import type { UserRole, ModuleType } from "@/lib/types"
import { normalizeSubscriptionStatus } from "@/lib/subscription"
import { AlertTriangle, Loader2, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { RealtimeChange } from "@/services/socket.service"

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
  const { companyName } = useBranding()
  const [isReady, setIsReady] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [contentRevision, setContentRevision] = useState(0)

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

  useEffect(() => {
    const pageModules = new Set<string>([
      pathname === "/admin" || pathname === "/super-admin" ? "dashboard" : "",
      pathname.includes("reservation") ? "reservations" : "",
      pathname.includes("check-in") ? "check-in" : "",
      pathname.includes("check-out") ? "check-out" : "",
      pathname.includes("stay-view") || pathname.includes("in-house") ? "stay-view" : "",
      pathname.includes("housekeeping") ? "housekeeping" : "",
      pathname.includes("/pos") ? "pos" : "",
      pathname.includes("/accounts") ? "accounts" : "",
      pathname.includes("room") ? "rooms" : "",
      pathname.includes("setup") ? "system-configuration" : "",
      pathname.includes("guest") ? "guests" : "",
      pathname.includes("report") ? "reports" : "",
      pathname.includes("staff") ? "user-management" : "",
      pathname.includes("notification") ? "notifications" : "",
      pathname.includes("module") ? "subscription" : "",
      pathname.includes("settings") ? "hotel-settings" : "",
      routeModule || "",
    ].filter(Boolean))

    const refreshCurrentModule = (event: Event) => {
      const change = (event as CustomEvent<RealtimeChange>).detail
      if (!change?.modules?.some((module) => pageModules.has(module))) return
      const activeProperty = window.localStorage.getItem("activePropertyId") || user?.hotelId
      if (change.propertyId && activeProperty && String(change.propertyId) !== String(activeProperty)) return
      setContentRevision((revision) => revision + 1)
    }

    const refreshForPropertySwitch = () => setContentRevision((revision) => revision + 1)
    window.addEventListener("hotel:realtime-change", refreshCurrentModule)
    window.addEventListener("hotel:property-changed", refreshForPropertySwitch)
    return () => {
      window.removeEventListener("hotel:realtime-change", refreshCurrentModule)
      window.removeEventListener("hotel:property-changed", refreshForPropertySwitch)
    }
  }, [pathname, routeModule, user?.hotelId])

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

    if (user.mustChangePassword) {
      setIsReady(false)
      router.replace("/change-password")
      return
    }

    // Check module access if required
    if (modulesToCheck.length > 0 && !modulesToCheck.some((module) => hasAccess(module))) {
      setIsReady(false)
      router.replace(user.role === "super-admin" ? "/super-admin" : "/admin")
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
    <div className="admin-shell min-h-screen bg-background text-foreground">
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
            sidebarCollapsed ? "lg:pl-16" : "lg:pl-56"
          )}
        >
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/80 bg-card/95 px-4 shadow-sm backdrop-blur lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="text-sm font-semibold tracking-tight">{companyName}</span>
          </header>

          <main className="admin-content w-full min-w-0 overflow-x-hidden p-4 lg:p-6 xl:p-7 space-y-5">
            {subscriptionStatus === "WARNING" && subscriptionInfo?.message && (
              <div className="mb-4 flex items-start gap-3 rounded-md border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 shadow-sm dark:text-red-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{subscriptionInfo.message}</span>
              </div>
            )}

            {subscriptionStatus === "GRACE" && subscriptionInfo?.message && (
              <div className="mb-4 flex items-start gap-3 rounded-md border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-800 shadow-sm dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{subscriptionInfo.message}</span>
              </div>
            )}

            <React.Fragment key={`${pathname}:${contentRevision}`}>{children}</React.Fragment>
          </main>
        </div>
      </DashboardLayoutContext.Provider>
    </div>
  )
}
