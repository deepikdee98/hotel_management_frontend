"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Building2,
  LayoutDashboard,
  Building,
  Users,
  Settings,
  LogOut,
  CreditCard,
  Package,
  Sparkles,
  Calculator,
  BarChart,
  BedDouble,
  CalendarCheck,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ClipboardList,
  LogIn,
  UsersRound,
  Receipt,
  LogOutIcon,
  Zap,
  UserPlus,
  FileText,
  Banknote,
  ArrowRightLeft,
  Lock,
  ConciergeBell,
  Link2,
  MessageSquare,
  CalendarPlus,
  Send,
  DoorOpen,
  Search,
  Moon,
  Sun,
  Mail,
  Bell,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useBranding } from "@/lib/branding-context"
import { cn } from "@/lib/utils"
import type { UserRole, ModuleType } from "@/lib/types"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import Image from "next/image"
import { PropertySwitcher } from "@/components/front-office/property-switcher"

// const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002"

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://api-staging.zentrictechnology.com"
const AUTH_TOKEN_STORAGE_KEY = "hotel_manager_tokens"

function getStoredAccessToken(): string | null {
  try {
    const tokensRaw = sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
    if (!tokensRaw) return null

    const { accessToken } = JSON.parse(tokensRaw)
    return typeof accessToken === "string" && accessToken ? accessToken : null
  } catch {
    return null
  }
}

interface SubNavItem {
  label: string
  href: string
  icon: typeof LayoutDashboard
  subItems?: SubNavItem[]
}

interface NavItem {
  label: string
  href: string
  icon: typeof LayoutDashboard
  module?: ModuleType | ModuleType[]
  roles?: UserRole[]
  subItems?: SubNavItem[]
}

const SUPER_ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/super-admin", icon: LayoutDashboard },
  { label: "Hotels", href: "/super-admin/hotels", icon: Building },
  { label: "Settings", href: "/super-admin/settings", icon: Settings },
]

const HOTEL_NAV: NavItem[] = [
  { label: "Notifications", href: "/admin/notifications", icon: Bell, roles: ["company-admin", "admin"] },
  { label: "Staff Activity", href: "/admin/staff-activity", icon: ClipboardList, roles: ["company-admin", "admin"] },
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Staff", href: "/admin/staff", icon: Users, roles: ["company-admin", "admin"] },
  {
    label: "Front Office",
    href: "/admin/front-office",
    icon: BedDouble,
    module: "front-office",
    subItems: [
      {
        label: "Reception", href: "/admin/front-office/reception", icon: ConciergeBell,
        subItems: [
          { label: "Check-In", href: "/admin/front-office/reception/check-in", icon: LogIn },
          { label: "Express Check-In", href: "/admin/front-office/reception/express-check-in", icon: Zap },
          { label: "PAX Check-In", href: "/admin/front-office/reception/pax-check-in", icon: UserPlus },
          { label: "GR Card", href: "/admin/front-office/reception/gr-card", icon: FileText },
          { label: "Room Advance", href: "/admin/front-office/reception/room-advance", icon: Banknote },
          { label: "Shift Room", href: "/admin/front-office/reception/shift-room", icon: ArrowRightLeft },
          { label: "Block Room", href: "/admin/front-office/reception/block-room", icon: Lock },
          { label: "Post Services", href: "/admin/front-office/reception/post-services", icon: ConciergeBell },
          { label: "Check-Out", href: "/admin/front-office/reception/check-out", icon: DoorOpen },
          { label: "Settlement", href: "/admin/front-office/reception/settlement", icon: Receipt },
          { label: "Room Link/Unlink", href: "/admin/front-office/reception/room-link", icon: Link2 },
          { label: "Paidout/Refund", href: "/admin/front-office/reception/paidout-refund", icon: Banknote },
          { label: "Guest Complaint", href: "/admin/front-office/reception/guest-complaint", icon: MessageSquare },
          { label: "Extend Checkout", href: "/admin/front-office/reception/extend-checkout", icon: CalendarPlus },
          { label: "Send Offers", href: "/admin/front-office/reception/send-offers", icon: Send },
          { label: "Events/Plan", href: "/admin/front-office/reception/events", icon: CalendarCheck },
          { label: "Post Room Tariff", href: "/admin/front-office/reception/post-room-tariff", icon: CreditCard },
          { label: "Advance Transfer", href: "/admin/front-office/reception/advance-transfer", icon: ArrowRightLeft },
        ]
      },
      { label: "Reservation", href: "/admin/front-office/reservation", icon: CalendarCheck },
      { label: "Stay View", href: "/admin/front-office/stay-view", icon: CalendarCheck },
      { label: "Room Dashboard", href: "/admin/front-office/room-dashboard", icon: BedDouble },
      { label: "Day End Process", href: "/admin/front-office/day-end", icon: Moon },
      { label: "Lookups", href: "/admin/front-office/lookups", icon: Search },
      { label: "Reports", href: "/admin/front-office/reports", icon: BarChart },
      { label: "Night Audit", href: "/admin/front-office/night-audit", icon: ClipboardList },
      { label: "Setup", href: "/admin/front-office/setup", icon: Settings },
      { label: "SMS/Email Setup", href: "/admin/front-office/sms-email", icon: Mail },
    ]
  },
  { label: "Point of Sale", href: "/admin/pos", icon: CreditCard, module: "point-of-sale" },
  { label: "Housekeeping", href: "/admin/housekeeping", icon: Sparkles, module: "housekeeping" },
  {
    label: "Accounts",
    href: "/admin/accounts",
    icon: Calculator,
    module: "accounts",
    subItems: [
      { label: "Dashboard", href: "/admin/accounts", icon: LayoutDashboard },
      { label: "Transactions", href: "/admin/accounts/transactions", icon: ArrowRightLeft },
      { label: "Invoices", href: "/admin/accounts/invoices", icon: FileText },
      { label: "Receipts", href: "/admin/accounts/receipts", icon: Receipt },
      { label: "Payments", href: "/admin/accounts/payments", icon: Banknote },
      { label: "Expenses", href: "/admin/accounts/expenses", icon: CreditCard },
      { label: "Ledger", href: "/admin/accounts/ledger", icon: ClipboardList },
      { label: "Day Book", href: "/admin/accounts/day-book", icon: CalendarCheck },
      { label: "Tax Reports", href: "/admin/accounts/tax-reports", icon: FileText },
      { label: "Profit & Loss", href: "/admin/accounts/profit-loss", icon: BarChart },
      { label: "Balance Sheet", href: "/admin/accounts/balance-sheet", icon: Calculator },
      { label: "Settings", href: "/admin/accounts/settings", icon: Settings },
    ]
  },
  { label: "Inventory", href: "/admin/inventory", icon: Package, module: "inventory" },
  { label: "Reports", href: "/admin/reports", icon: BarChart, module: "reports" },
  { label: "Company Settings", href: "/admin/company-management", icon: Building2, roles: ["company-admin", "super-admin"] },
  { label: "Properties", href: "/admin/property-management", icon: Building, roles: ["company-admin", "super-admin"] },
]

function getNavItems(role: UserRole): NavItem[] {
  switch (role) {
    case "super-admin":
      return SUPER_ADMIN_NAV
    case "company-admin":
    case "admin":
    case "staff":
      return HOTEL_NAV
    default:
      return []
  }
}

interface DashboardSidebarProps {
  role: UserRole
  collapsed?: boolean
  mobileOpen?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  onMobileOpenChange?: (open: boolean) => void
}

export function DashboardSidebar({
  role,
  collapsed = false,
  mobileOpen = false,
  onCollapsedChange,
  onMobileOpenChange,
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, hasAccess } = useAuth()
  const { companyName, logoUrl } = useBranding()
  const [hotelLogoUrl, setHotelLogoUrl] = useState("")
  const { resolvedTheme, setTheme } = useTheme()
  const [themeMounted, setThemeMounted] = useState(false)

  useEffect(() => setThemeMounted(true), [])

  useEffect(() => {
    if (!user || user.role === "super-admin") {
      setHotelLogoUrl("")
      return
    }

    let isCancelled = false

    const loadHotelLogo = async () => {
      const accessToken = getStoredAccessToken()
      if (!accessToken) return

      try {
        const configResponse = await fetch(`${API_BASE_URL}/admin/setup/hotel-config`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        })

        if (!configResponse.ok) return

        const hotelConfig = await configResponse.json()
        const logoKey = hotelConfig?.logo?.key
        const fallbackLogoUrl = hotelConfig?.logo?.url || user.avatar || ""
        let nextLogoUrl = fallbackLogoUrl

        if (logoKey) {
          const readResponse = await fetch(`${API_BASE_URL}/uploads/read-url`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ key: logoKey }),
          })

          if (readResponse.ok) {
            const readPayload = await readResponse.json()
            nextLogoUrl = readPayload?.data?.readUrl || nextLogoUrl
          }
        }

        if (!isCancelled) setHotelLogoUrl(nextLogoUrl)
      } catch {
        if (!isCancelled) setHotelLogoUrl(user.avatar || "")
      }
    }

    loadHotelLogo()

    const handleLogoUpdated = (event: Event) => {
      const logoUrl = (event as CustomEvent<{ logoUrl?: string }>).detail?.logoUrl
      if (logoUrl) setHotelLogoUrl(logoUrl)
    }

    window.addEventListener("hotel-logo-updated", handleLogoUpdated)

    return () => {
      isCancelled = true
      window.removeEventListener("hotel-logo-updated", handleLogoUpdated)
    }
  }, [user])

  const navItems = getNavItems(role).filter((item) => {
    // Check role access if defined
    if (item.roles && !item.roles.includes(role)) return false

    // Check module access if defined
    if (!item.module) return true
    const modules = Array.isArray(item.module) ? item.module : [item.module]
    return modules.some((module) => hasAccess(module))
  })

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const toggleCollapsed = () => {
    onCollapsedChange?.(!collapsed)
  }

  const closeMobileSidebar = () => {
    onMobileOpenChange?.(false)
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-dvh w-56 overflow-hidden bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        collapsed ? "lg:w-16" : "lg:w-56"
      )}
    >
      <div className="relative flex h-full flex-col bg-sidebar">
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full border border-primary/10" />
        {/* Header */}
        <div className="relative flex h-[72px] items-center justify-between border-b border-sidebar-border px-4">
          <Link
            href="/"
            className={cn("flex items-center gap-2.5", collapsed && "lg:hidden")}
            onClick={closeMobileSidebar}
          >
            <div className="rounded-xl overflow-hidden shadow-xs border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-1">
              <Image
                src={logoUrl || "/logo.png"}
                alt={companyName}
                width={26}
                height={26}
                className="object-contain"
              />
            </div>

            <span>
              <span className="block font-extrabold tracking-tight text-slate-800 dark:text-white text-sm">{companyName}</span>
              <span className="block text-[9px] uppercase tracking-[0.18em] font-bold text-primary">Hotel operations</span>
            </span>
          </Link>
          {collapsed && (
            <div className="hidden mx-auto lg:block rounded-xl overflow-hidden shadow-xs border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-1">
              <Image
                src={logoUrl || "/logo.png"}
                alt={companyName}
                width={26}
                height={26}
                className="object-contain"
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            onClick={closeMobileSidebar}
            aria-label="Close navigation"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "hidden h-8 w-8 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:flex",
              collapsed && "lg:hidden"
            )}
            onClick={toggleCollapsed}
            aria-label="Collapse navigation"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* User Info */}
        {user && (
          <div className={cn("border-b border-sidebar-border p-3.5", collapsed && "lg:hidden")}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-sidebar-border bg-sidebar-accent shadow-inner">
                {hotelLogoUrl ? (
                  <img src={hotelLogoUrl} alt={user.hotelName || "Hotel logo"} className="h-full w-full object-contain" />
                ) : (
                  <span className="text-sm font-semibold text-sidebar-accent-foreground">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Property Switcher */}
        {!collapsed && <PropertySwitcher />}

        {/* Navigation */}
        <nav className="relative flex-1 space-y-1 overflow-y-auto p-2.5 bg-sidebar">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            const hasSubItems = item.subItems && item.subItems.length > 0
            const isSubActive = hasSubItems && (
              item.subItems?.some(sub => pathname === sub.href || sub.subItems?.some(s => pathname === s.href))
            )

            if (hasSubItems) {
              return (
                <Collapsible key={item.href} defaultOpen={isSubActive}>
                  <CollapsibleTrigger asChild>
                    <button
                      className={cn(
                        "flex min-h-10 w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all",
                        collapsed && "lg:justify-center lg:px-2",
                        isSubActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
                      </div>
                      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200 [[data-state=open]>&]:rotate-180", collapsed && "lg:hidden")} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className={cn("pl-3 mt-0.5 space-y-0.5", collapsed && "lg:hidden")}>
                    {item.subItems?.map((subItem) => {
                      const SubIcon = subItem.icon
                      const isSubItemActive = pathname === subItem.href
                      const hasNestedSubs = subItem.subItems && subItem.subItems.length > 0
                      const isNestedActive = hasNestedSubs && subItem.subItems?.some(s => pathname === s.href)

                      if (hasNestedSubs) {
                        return (
                          <Collapsible key={subItem.href} defaultOpen={isNestedActive}>
                            <CollapsibleTrigger asChild>
                              <button
                                className={cn(
                                  "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-all",
                                  isNestedActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                                )}
                              >
                                <div className="flex items-center gap-2.5">
                                  <SubIcon className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span>{subItem.label}</span>
                                </div>
                                <ChevronDown className="h-3 w-3 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pl-3 mt-0.5 space-y-0.5 max-h-64 overflow-y-auto">
                              {subItem.subItems?.map((nestedItem) => {
                                const NestedIcon = nestedItem.icon
                                const isNestedItemActive = pathname === nestedItem.href
                                return (
                                  <Link
                                    key={nestedItem.href}
                                    href={nestedItem.href}
                                    onClick={closeMobileSidebar}
                                    className={cn(
                                      "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                                      isNestedItemActive
                                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xs"
                                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                                    )}
                                  >
                                    <NestedIcon className="h-3 w-3 flex-shrink-0" />
                                    <span>{nestedItem.label}</span>
                                  </Link>
                                )
                              })}
                            </CollapsibleContent>
                          </Collapsible>
                        )
                      }

                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={closeMobileSidebar}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-all",
                            isSubItemActive
                              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xs"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <SubIcon className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{subItem.label}</span>
                        </Link>
                      )
                    })}
                  </CollapsibleContent>
                </Collapsible>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-10 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/65 hover:text-sidebar-accent-foreground",
                  collapsed && "lg:justify-center lg:px-2"
                )}
                title={collapsed ? item.label : undefined}
                onClick={closeMobileSidebar}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="relative border-t border-sidebar-border p-2.5 bg-sidebar">
          {themeMounted && (
            <Button
              variant="ghost"
              className={cn("mb-1 w-full rounded-lg text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", collapsed ? "justify-center px-2" : "justify-start px-3")}
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme`}
            >
              {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {!collapsed && <span className="ml-3">{resolvedTheme === "dark" ? "Light theme" : "Dark theme"}</span>}
            </Button>
          )}
          {collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="mb-2 hidden h-10 w-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:flex"
              onClick={toggleCollapsed}
              aria-label="Expand navigation"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            className={cn(
              "w-full text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 font-semibold rounded-xl",
              collapsed ? "justify-center px-2" : "justify-start px-3"
            )}
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="ml-3.5">Logout</span>}
          </Button>
        </div>
      </div>
    </aside>
  )
}
