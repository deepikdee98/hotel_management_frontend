"use client"

import { useEffect, useMemo, useState } from "react"
import { Users, BedDouble, CalendarCheck, DollarSign, ArrowUpRight, ArrowDownRight, Clock, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAdminDashboard, getAdminStaff, getFrontOfficeReservations, getFrontOfficeRooms, mapReservation } from "@/lib/backend-api"
import { useAuth } from "@/lib/auth-context"

export default function AdminDashboard() {
  const { user } = useAuth()
  const [rooms, setRooms] = useState<Awaited<ReturnType<typeof getFrontOfficeRooms>>>([])
  const [reservations, setReservations] = useState<Awaited<ReturnType<typeof getFrontOfficeReservations>>>([])
  const [staff, setStaff] = useState<Awaited<ReturnType<typeof getAdminStaff>>>([])
  const [dashboardStats, setDashboardStats] = useState({
    totalRooms: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    todayCheckIns: 0,
    todayCheckOuts: 0,
    revenue: 0,
    occupancyRate: 0,
  })

  useEffect(() => {
    const load = async () => {
      try {
        const [dashboard, roomData, reservationData, staffData] = await Promise.all([
          getAdminDashboard(),
          getFrontOfficeRooms(),
          getFrontOfficeReservations(),
          getAdminStaff(),
        ])

        setRooms(roomData)
        setReservations(reservationData)
        setStaff(staffData)

        const stats = dashboard.data.stats as Record<string, number>
        const roomStatus = dashboard.data.roomStatus as Record<string, number>
        setDashboardStats({
          totalRooms: Number(roomStatus.available || 0) + Number(roomStatus.occupied || 0) + Number(roomStatus.reserved || 0) + Number(roomStatus.maintenance || 0),
          occupiedRooms: Number(roomStatus.occupied || 0),
          availableRooms: Number(roomStatus.available || 0),
          todayCheckIns: Number(stats.todayCheckIns || 0),
          todayCheckOuts: Number(stats.todayCheckOuts || 0),
          revenue: Number(stats.totalRevenue || 0),
          occupancyRate: Number(stats.occupancyRate || 0),
        })

        const recentReservations = (dashboard.data.recentReservations as Record<string, unknown>[] | undefined) || []
        if (recentReservations.length) {
          setReservations(recentReservations.map((item) => mapReservation(item)))
        }
      } catch {
        setRooms([])
        setReservations([])
        setStaff([])
      }
    }

    load()
  }, [])

  const stats = useMemo(() => [
    {
      label: "Occupancy Rate",
      value: `${dashboardStats.occupancyRate}%`,
      change: "+0%",
      trend: "up",
      icon: TrendingUp,
      description: "vs last week",
    },
    {
      label: "Available Rooms",
      value: dashboardStats.availableRooms.toString(),
      change: "0",
      trend: "up",
      icon: BedDouble,
      description: `of ${dashboardStats.totalRooms} total`,
    },
    {
      label: "Today's Check-ins",
      value: dashboardStats.todayCheckIns.toString(),
      change: "+0",
      trend: "up",
      icon: CalendarCheck,
      description: "arrivals today",
    },
    {
      label: "Revenue Today",
      value: `$${dashboardStats.revenue.toLocaleString()}`,
      change: "+0%",
      trend: "up",
      icon: DollarSign,
      description: "vs yesterday",
    },
  ], [dashboardStats])

  const activeStaff = staff.filter(s => s.status === "active").length
  const occupiedRooms = rooms.filter(r => r.status === "occupied").length
  const pendingReservations = reservations.filter(r => r.status === "confirmed").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}. Here&apos;s what&apos;s happening at {user?.hotelName}.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Last updated: Just now</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-primary/10 rounded-lg">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div
                    className={`flex items-center gap-1 text-sm font-medium ${
                      stat.trend === "up" ? "text-success" : "text-destructive"
                    }`}
                  >
                    {stat.change}
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Reservations */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Reservations</CardTitle>
            <CardDescription>{pendingReservations} pending check-ins</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reservations.slice(0, 5).map((reservation) => (
                <div
                  key={reservation.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {reservation.guestName.split(" ").map(n => n[0]).join("")}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{reservation.guestName}</p>
                      <p className="text-sm text-muted-foreground">
                        Room {reservation.roomNumber} &middot; {reservation.checkIn} to {reservation.checkOut}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium text-foreground">${reservation.totalAmount}</p>
                      <p className="text-xs text-muted-foreground">
                        ${reservation.paidAmount} paid
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        reservation.status === "checked-in"
                          ? "bg-success/10 text-success"
                          : reservation.status === "confirmed"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {reservation.status.replace("-", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Sidebar */}
        <div className="space-y-6">
          {/* Room Status */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Room Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-success" />
                  <span className="text-sm text-foreground">Available</span>
                </div>
                <span className="font-medium text-foreground">
                  {rooms.filter(r => r.status === "available").length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-sm text-foreground">Occupied</span>
                </div>
                <span className="font-medium text-foreground">{occupiedRooms}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-warning" />
                  <span className="text-sm text-foreground">Reserved</span>
                </div>
                <span className="font-medium text-foreground">
                  {rooms.filter(r => r.status === "reserved").length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-muted-foreground" />
                  <span className="text-sm text-foreground">Maintenance</span>
                </div>
                <span className="font-medium text-foreground">
                  {rooms.filter(r => r.status === "maintenance").length}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Staff Overview */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Staff Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Staff</span>
                <span className="font-medium text-foreground">{activeStaff}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Staff</span>
                <span className="font-medium text-foreground">{staff.length}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="space-y-3">
                {staff.slice(0, 3).map((staff) => (
                  <div key={staff.id} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-medium text-muted-foreground">
                        {staff.name.split(" ").map(n => n[0]).join("")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{staff.name}</p>
                      <p className="text-xs text-muted-foreground">{staff.role}</p>
                    </div>
                    <div className={`h-2 w-2 rounded-full ${staff.status === "active" ? "bg-success" : "bg-muted-foreground"}`} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
