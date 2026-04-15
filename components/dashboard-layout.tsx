"use client"

import React from "react"

import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { DashboardSidebar } from "./dashboard-sidebar"
import { useAuth } from "@/lib/auth-context"
import type { UserRole } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
  requiredRole: UserRole
}

export function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Wait for auth to finish loading from sessionStorage
    if (isLoading) return

    if (isAuthenticated && user?.role === requiredRole) {
      setIsReady(true)
    } else {
      router.replace("/")
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router])

  if (isLoading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar role={requiredRole} />
      <div className="ml-65 min-h-screen">
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  )
}
