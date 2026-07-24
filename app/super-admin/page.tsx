"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowRight, BedDouble, Building2, CalendarClock, CheckCircle2, Hotel as HotelIcon, Plus, Sparkles } from "lucide-react"
import { Cell, Pie, PieChart, Tooltip } from "recharts"
import { getSuperAdminDashboard, mapHotel } from "@/lib/backend-api"
import { useBranding } from "@/lib/branding-context"
import type { Hotel } from "@/lib/types"

type DashboardStats = { totalHotels: number; activeHotels: number; totalRooms: number }

const numberFrom = (value: unknown, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export default function SuperAdminDashboard() {
  const { companyName, logoUrl } = useBranding()
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await getSuperAdminDashboard()
        const recent = Array.isArray(response.recentHotels) ? response.recentHotels.map(mapHotel) : []
        const stats = response.stats || {}
        setHotels(recent)
        setDashboardStats({
          totalHotels: numberFrom(stats.totalHotels, recent.length),
          activeHotels: numberFrom(stats.activeHotels ?? stats.activeSubscriptions, recent.filter((hotel) => hotel.status === "active").length),
          totalRooms: numberFrom(stats.totalRooms, recent.reduce((total, hotel) => total + hotel.roomCount, 0)),
        })
      } catch {
        setHotels([])
        setFailed(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const stats = dashboardStats || { totalHotels: 0, activeHotels: 0, totalRooms: 0 }
  const kpis = [
    { label: "Total Hotels", value: stats.totalHotels, icon: Building2, tone: "bg-blue-500/10 text-blue-600 dark:text-blue-300" },
    { label: "Active Subscriptions", value: stats.activeHotels, icon: CheckCircle2, tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" },
    { label: "Total Rooms", value: stats.totalRooms, icon: BedDouble, tone: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300" },
  ]

  const subscriptionData = useMemo(() => {
    const active = hotels.filter((hotel) => hotel.subscriptionStatus === "ACTIVE" || (!hotel.subscriptionStatus && hotel.status === "active")).length
    const pending = hotels.filter((hotel) => ["WARNING", "GRACE"].includes(hotel.subscriptionStatus || "") || hotel.status === "pending").length
    const inactive = hotels.length - active - pending
    return [
      { name: "Active", value: active, color: "#22c55e" },
      { name: "Pending / Expiring", value: pending, color: "#f59e0b" },
      { name: "Inactive / Expired", value: Math.max(0, inactive), color: "#ef4444" },
    ]
  }, [hotels])
  const chartTotal = subscriptionData.reduce((total, item) => total + item.value, 0)

  return (
    <main className="space-y-5 pb-4">
      <header className="flex items-end justify-between gap-4">
        <div>
          {/* <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Command center
          </div> */}
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Super Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage hotels, modules, and system settings<span aria-hidden="true">👋</span></p>
        </div>
      </header>

      {failed && (
        <div role="alert" className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Dashboard data could not be loaded. Try refreshing the page.
        </div>
      )}

      <section aria-label="Hotel overview" className="grid gap-3 sm:grid-cols-3">
        {kpis.map(({ label, value, icon: Icon, tone }) => (
          <article key={label} className="group rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className={`rounded-xl p-2.5 ${tone}`}><Icon className="h-5 w-5" /></div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Live</span>
            </div>
            <p className="mt-4 text-3xl font-bold tabular-nums text-foreground">{loading ? <span className="inline-block h-8 w-14 animate-pulse rounded bg-muted" /> : value.toLocaleString()}</p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">{label}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,.75fr)]">
        <article className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4">
            <div><h2 className="font-semibold text-foreground">Recent Hotels</h2><p className="mt-0.5 text-xs text-muted-foreground">Latest properties added to {companyName}</p></div>
            <Link href="/super-admin/hotels" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="divide-y divide-border/60 px-5">
            {loading ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-[72px] animate-pulse bg-muted/35" />) : hotels.length ? hotels.slice(0, 5).map((hotel) => (
              <div key={hotel.id} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="shrink-0 rounded-xl bg-primary/10 p-2.5 text-primary"><HotelIcon className="h-5 w-5" /></div>
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{hotel.name}</p><p className="truncate text-xs text-muted-foreground">{[hotel.city, hotel.country].filter(Boolean).join(", ") || "Location not provided"}</p></div>
                </div>
                <div className="flex items-center justify-between gap-4 pl-[52px] sm:justify-end sm:pl-0">
                  <div className="text-left sm:text-right"><p className="text-xs font-semibold text-foreground">{hotel.roomCount} rooms</p><p className="text-[11px] text-muted-foreground">{hotel.modules.length} modules</p></div>
                  <span className={`min-w-[66px] rounded-md px-2 py-1 text-center text-[10px] font-bold uppercase tracking-wide ${hotel.status === "active" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : hotel.status === "pending" ? "bg-amber-500/10 text-amber-600 dark:text-amber-300" : "bg-red-500/10 text-red-600 dark:text-red-300"}`}>{hotel.status}</span>
                </div>
              </div>
            )) : (
              <div className="flex min-h-56 flex-col items-center justify-center px-4 text-center"><Building2 className="mb-3 h-8 w-8 text-muted-foreground/60" /><p className="text-sm font-semibold text-foreground">No hotels yet</p><p className="mt-1 max-w-xs text-xs text-muted-foreground">Add your first property to start tracking rooms and subscriptions.</p><Link href="/super-admin/hotels?add=1" className="mt-4 text-xs font-semibold text-primary hover:underline">Add your first hotel</Link></div>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h2 className="font-semibold text-foreground">Subscription Status</h2><p className="mt-0.5 text-xs text-muted-foreground">Health across recent properties</p>
          <div className="relative mx-auto mt-2 h-40 max-w-[220px]" aria-label={`${chartTotal} hotels shown in subscription chart`}>
            <PieChart width={220} height={160}>
              <Pie data={chartTotal ? subscriptionData : [{ name: "No data", value: 1, color: "var(--muted)" }]} dataKey="value" innerRadius={49} outerRadius={67} paddingAngle={chartTotal ? 3 : 0} stroke="none">
                {(chartTotal ? subscriptionData : [{ color: "var(--muted)" }]).map((item, index) => <Cell key={index} fill={item.color} />)}
              </Pie>
              {chartTotal > 0 && <Tooltip formatter={(value) => [`${value} hotels`, ""]} contentStyle={{ borderRadius: 10, borderColor: "var(--border)", background: "var(--popover)", color: "var(--popover-foreground)" }} />}
            </PieChart>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="text-2xl text-foreground">{chartTotal}</strong><span className="text-[10px] uppercase tracking-wider text-muted-foreground">Hotels</span></div>
          </div>
          <ul className="mt-2 space-y-2.5">
            {subscriptionData.map((item) => <li key={item.name} className="flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-2 text-muted-foreground"><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: item.color }} />{item.name}</span><strong className="tabular-nums text-foreground">{item.value}{chartTotal ? ` (${Math.round(item.value / chartTotal * 100)}%)` : ""}</strong></li>)}
          </ul>
        </article>
      </section>

      <section className="relative isolate overflow-hidden rounded-2xl bg-[linear-gradient(120deg,#082f73_0%,#0967d9_52%,#08aeea_100%)] px-6 py-7 text-white shadow-[0_18px_50px_-24px_rgba(14,116,238,.8)] sm:px-9 sm:py-8">
        <div className="absolute -right-8 -top-20 -z-10 h-64 w-64 rotate-12 border-[30px] border-white/10" /><div className="absolute bottom-[-85px] right-[18%] -z-10 h-48 w-48 rotate-45 border-[24px] border-cyan-200/10" />
        <Image src={logoUrl || "/logo.png"} alt="" width={150} height={150} className="absolute -right-2 bottom-[-25px] -z-10 h-36 w-36 object-contain opacity-20 sm:right-12 sm:h-44 sm:w-44" />
        <div className="max-w-xl"><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100"><CalendarClock className="h-4 w-4" /> Grow with confidence</div><h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Elevate your hotel management</h2><p className="mt-2 max-w-lg text-sm leading-6 text-blue-50/90">Streamline operations, delight guests, and bring your next property into one powerful workspace.</p><Link href="/super-admin/hotels?add=1" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-blue-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><Plus className="h-4 w-4" /> Add New Hotel</Link></div>
      </section>
    </main>
  )
}
