"use client"

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
  Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import type { UserRole, ModuleType } from "@/lib/types"
import { useState } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

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
  module?: ModuleType
  roles?: UserRole[]
  subItems?: SubNavItem[]
}

const SUPER_ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/super-admin", icon: LayoutDashboard },
  { label: "Hotels", href: "/super-admin/hotels", icon: Building },
  { label: "Settings", href: "/super-admin/settings", icon: Settings },
]

const HOTEL_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Staff", href: "/admin/staff", icon: Users, roles: ["admin"] },
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
]

function getNavItems(role: UserRole): NavItem[] {
  switch (role) {
    case "super-admin":
      return SUPER_ADMIN_NAV
    case "admin":
    case "staff":
      return HOTEL_NAV
    default:
      return []
  }
}

interface DashboardSidebarProps {
  role: UserRole
}

export function DashboardSidebar({ role }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, hasAccess } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const navItems = getNavItems(role).filter((item) => {
    // Check role access if defined
    if (item.roles && !item.roles.includes(role)) return false

    // Check module access if defined
    if (!item.module) return true
    return hasAccess(item.module)
  })

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="p-1.5 bg-sidebar-primary rounded-lg">
                <Building2 className="h-5 w-5 text-sidebar-primary-foreground" />
              </div>
              <span className="font-semibold text-sidebar-foreground">HotelManager</span>
            </Link>
          )}
          {collapsed && (
            <div className="p-1.5 bg-sidebar-primary rounded-lg mx-auto">
              <Building2 className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent",
              collapsed && "hidden"
            )}
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* User Info */}
        {!collapsed && user && (
          <div className="border-b border-sidebar-border p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-sidebar-accent flex items-center justify-center">
                <span className="text-sm font-medium text-sidebar-accent-foreground">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            const hasSubItems = item.subItems && item.subItems.length > 0
            const isSubActive = hasSubItems && (
              item.subItems?.some(sub => pathname === sub.href || sub.subItems?.some(s => pathname === s.href))
            )

            if (hasSubItems && !collapsed) {
              return (
                <Collapsible key={item.href} defaultOpen={isSubActive}>
                  <CollapsibleTrigger asChild>
                    <button
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                        isSubActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-3 mt-0.5 space-y-0.5">
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
                                  "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                                  isNestedActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
                                    className={cn(
                                      "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors",
                                      isNestedItemActive
                                        ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                                        : "text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
                          className={cn(
                            "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                            isSubItemActive
                              ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                              : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3">
          {collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-10 text-sidebar-foreground hover:bg-sidebar-accent mb-2"
              onClick={() => setCollapsed(!collapsed)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            className={cn(
              "w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed ? "justify-center px-2" : "justify-start"
            )}
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </div>
    </aside>
  )
}
