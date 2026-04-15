"use client"

import { useEffect, useMemo, useState } from "react"
import { Building, Users, Package, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSuperAdminDashboard, mapHotel } from "@/lib/backend-api"
import type { Hotel } from "@/lib/types"

export default function SuperAdminDashboard() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [activeStaff, setActiveStaff] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await getSuperAdminDashboard()
        const recent = Array.isArray(response.recentHotels) ? response.recentHotels.map(mapHotel) : []
        setHotels(recent)
        setActiveStaff(Number(response.stats.activeStaff || 0))
      } catch {
        setHotels([])
      }
    }

    load()
  }, [])

  const stats = useMemo(() => [
    {
      label: "Total Hotels",
      value: hotels.length.toString(),
      change: "+0",
      trend: "up",
      icon: Building,
    },
    {
      label: "Active Hotels",
      value: hotels.filter((h) => h.status === "active").length.toString(),
      change: "+0",
      trend: "up",
      icon: TrendingUp,
    },
    {
      label: "Total Rooms",
      value: hotels.reduce((acc, h) => acc + h.roomCount, 0).toString(),
      change: "+0",
      trend: "up",
      icon: Package,
    },
    {
      label: "Active Staff",
      value: activeStaff.toString(),
      change: "+0",
      trend: "up",
      icon: Users,
    },
  ], [hotels, activeStaff])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage hotels, modules, and system settings</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div
                    className={`flex items-center text-sm ${stat.trend === "up" ? "text-success" : "text-destructive"}`}
                  >
                    {stat.change}
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="h-4 w-4 ml-0.5" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 ml-0.5" />
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Hotels */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Recent Hotels</CardTitle>
          <CardDescription>Hotels recently added to the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {hotels.slice(0, 5).map((hotel) => (
              <div
                key={hotel.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{hotel.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {hotel.city}, {hotel.country}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{hotel.roomCount} rooms</p>
                    <p className="text-xs text-muted-foreground">{hotel.modules.length} modules</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      hotel.status === "active"
                        ? "bg-success/10 text-success"
                        : hotel.status === "pending"
                          ? "bg-warning/10 text-warning"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {hotel.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
