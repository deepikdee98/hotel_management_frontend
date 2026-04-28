"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BedDouble,
  CalendarCheck,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  TrendingUp,
  UserCircle,
  ArrowRight,
  Bell,
  Users
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  getAdminDashboard,
  getAdminStaff,
  getFrontOfficeReservations,
  getFrontOfficeRooms,
  getStaffDashboard,
  mapReservation,
  updateStaffReservationStatus
} from "@/lib/backend-api"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"

interface BlockedRoom {
  id: string
  roomNumber: string
  from: string
  to: string
  remark: string
}

export default function UnifiedDashboard() {
  const { user, hasAccess } = useAuth()
  const isAdmin = user?.role === "admin" || user?.role === "hoteladmin"
  const canAccessFrontOffice = hasAccess("front-office")

  const [rooms, setRooms] = useState<any[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [blockedRooms, setBlockedRooms] = useState<BlockedRoom[]>([])
  const [todayCheckOuts, setTodayCheckOuts] = useState(0)
  const [dashboardStats, setDashboardStats] = useState({
    totalRooms: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    todayCheckIns: 0,
    todayCheckOuts: 0,
    revenue: 0,
    occupancyRate: 0,
  })

  const loadData = async () => {
    try {
      const dashboardPromise = getAdminDashboard()
      const roomDataPromise = canAccessFrontOffice ? getFrontOfficeRooms() : Promise.resolve([])
      const reservationDataPromise = canAccessFrontOffice ? getFrontOfficeReservations() : Promise.resolve([])
      const staffDataPromise = isAdmin ? getAdminStaff() : Promise.resolve([])
      const staffDashboardPromise = !isAdmin ? getStaffDashboard() : Promise.resolve({ stats: {} })

      const [dashboard, roomData, reservationData, staffData, staffDashboard] = await Promise.all([
        dashboardPromise,
        roomDataPromise,
        reservationDataPromise,
        staffDataPromise,
        staffDashboardPromise,
      ])

      setRooms(roomData || [])
      setReservations(reservationData || [])
      if (isAdmin) setStaff(staffData || [])

      if (dashboard?.success && dashboard?.data?.blockedRooms) {
        setBlockedRooms(dashboard.data.blockedRooms as BlockedRoom[])
      }

      const stats = (dashboard?.data?.stats || {}) as Record<string, number>
      let roomStatus = (dashboard?.data?.roomStatus || {}) as Record<string, number>

      if (!isAdmin && staffDashboard) {
        const sDashboardStats = staffDashboard.stats as Record<string, number> | undefined
        const roomOverview = Array.isArray(staffDashboard.roomOverview) ? staffDashboard.roomOverview : []

        if (!Object.keys(roomStatus).length && roomOverview.length) {
          roomStatus = roomOverview.reduce<Record<string, number>>((acc, room: any) => {
            const status = String(room.status || "available")
            acc[status] = (acc[status] || 0) + 1
            return acc
          }, {})
        }

        if (sDashboardStats?.todayCheckouts !== undefined) {
          setTodayCheckOuts(Number(sDashboardStats.todayCheckouts))
        }
      }

      setDashboardStats({
        totalRooms: Number(roomStatus.available || 0) + Number(roomStatus.occupied || 0) + Number(roomStatus.reserved || 0) + Number(roomStatus.maintenance || 0),
        occupiedRooms: Number(roomStatus.occupied || 0),
        availableRooms: Number(roomStatus.available || 0),
        todayCheckIns: Number(stats.todayCheckIns || 0),
        todayCheckOuts: Number(stats.todayCheckOuts || 0),
        revenue: Number(stats.totalRevenue || 0),
        occupancyRate: Number(stats.occupancyRate || 0),
      })

      const recentReservations = (dashboard?.data?.recentReservations as Record<string, unknown>[] | undefined) || []
      if (recentReservations.length) {
        setReservations(recentReservations.map((item) => mapReservation(item)))
      }
    } catch (error) {
      console.error("Dashboard Load Error:", error)
      setRooms([])
      setReservations([])
      setStaff([])
    }
  }

  useEffect(() => {
    loadData()
  }, [isAdmin, canAccessFrontOffice])

  const handleCheckIn = async (reservationId: string) => {
    try {
      await updateStaffReservationStatus(reservationId, "checked-in")
      await loadData()
    } catch (error) {
      console.error("Failed to check in guest:", error)
    }
  }

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
      value: isAdmin ? `$${dashboardStats.revenue.toLocaleString()}` : todayCheckOuts.toString(),
      change: "+0%",
      trend: "up",
      icon: isAdmin ? DollarSign : CalendarCheck,
      description: isAdmin ? "vs yesterday" : "departures today",
    },
  ], [dashboardStats, isAdmin, todayCheckOuts])

  const activeStaff = staff.filter(s => s.status === "active").length
  const occupiedRoomsCount = rooms.filter(r => r.status === "occupied").length
  const confirmedReservations = reservations.filter(r => r.status === "confirmed")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}. Here's what's happening at {user?.hotelName}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="relative bg-transparent">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
              3
            </span>
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
            <Clock className="h-4 w-4" />
            <span>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
          </div>
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
                    className={`flex items-center gap-1 text-sm font-medium ${stat.trend === "up" ? "text-success" : "text-destructive"
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
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Arrivals / Recent Reservations */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Today's Arrivals</CardTitle>
                <CardDescription>{confirmedReservations.length} pending check-ins</CardDescription>
              </div>
              <Link href="/admin/front-office/reservation">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {confirmedReservations.length > 0 ? (
                  confirmedReservations.slice(0, 5).map((reservation) => (
                    <div
                      key={reservation.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {reservation.guestName.split(" ").map((n: string) => n[0]).join("")}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{reservation.guestName}</p>
                          <p className="text-sm text-muted-foreground">
                            Room {reservation.roomNumber} &middot; {reservation.checkIn} to {reservation.checkOut}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-medium text-foreground">${reservation.totalAmount}</p>
                          <p className="text-xs text-muted-foreground">
                            ${reservation.paidAmount} paid
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleCheckIn(reservation.id)}
                        >
                          Check In
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No arrivals scheduled for today
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Blocked Rooms */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Blocked Rooms</CardTitle>
              <CardDescription>Rooms currently out of service</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {blockedRooms.length > 0 ? (
                  blockedRooms.slice(0, 5).map((block) => (
                    <div
                      key={block.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-muted-foreground/10 flex items-center justify-center">
                          <BedDouble className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Room {block.roomNumber}</p>
                          <p className="text-xs text-muted-foreground">Blocked Range</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">{block.remark}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(block.from).toLocaleDateString()} to {new Date(block.to).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No rooms currently blocked
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel: Room Status & Staff */}
        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Room Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Available", color: "bg-success", count: rooms.filter(r => r.status === "available").length },
                { label: "Occupied", color: "bg-primary", count: occupiedRoomsCount },
                { label: "Reserved", color: "bg-warning", count: rooms.filter(r => r.status === "reserved").length },
                { label: "Maintenance", color: "bg-muted-foreground", count: rooms.filter(r => r.status === "maintenance").length },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${item.color}`} />
                    <span className="text-sm text-foreground">{item.label}</span>
                  </div>
                  <span className="font-medium text-foreground">{item.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {isAdmin && (
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
                  {staff.slice(0, 3).map((s) => (
                    <div key={s.id} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs font-medium text-muted-foreground">
                          {s.name.split(" ").map((n: string) => n[0]).join("")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.role}</p>
                      </div>
                      <div className={`h-2 w-2 rounded-full ${s.status === "active" ? "bg-success" : "bg-muted-foreground"}`} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
