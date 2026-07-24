"use client"

import { useEffect, useMemo, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
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
  Users,
  ChevronDown,
  LockKeyhole
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
  const { toast } = useToast()
  const userRole = user?.role as string | undefined
  const isAdmin = userRole === "admin" || userRole === "hoteladmin" || userRole === "company-admin" || userRole === "companyadmin"
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
      if (isAdmin) setStaff(staffData || [])

      if (dashboard?.success && dashboard?.data?.blockedRooms) {
        setBlockedRooms(dashboard.data.blockedRooms as BlockedRoom[])
      }

      // If we don't have reservationData (e.g. no access or empty), 
      // then use recentReservations as a fallback
      if ((!reservationData || reservationData.length === 0) && dashboard?.data?.recentReservations) {
        const recent = (dashboard.data.recentReservations as Record<string, unknown>[]).map((item) => mapReservation(item))
        setReservations(recent)
      } else if (reservationData) {
        setReservations(reservationData)
      }

      const stats = (dashboard?.data?.stats || {}) as Record<string, number>
      let roomStatus = (dashboard?.data?.roomStatus || {}) as Record<string, number>

      if (!isAdmin && staffDashboard) {
        const staffDashboardData = staffDashboard as { stats?: Record<string, number>; roomOverview?: Array<{ status?: string }> }
        const sDashboardStats = staffDashboardData.stats
        const roomOverview = Array.isArray(staffDashboardData.roomOverview) ? staffDashboardData.roomOverview : []

        if (!Object.keys(roomStatus).length && roomOverview.length) {
          roomStatus = roomOverview.reduce<Record<string, number>>((acc: Record<string, number>, room: { status?: string }) => {
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
      toast({
        title: "Check-in Successful",
        description: "Guest has been checked in.",
      })
    } catch (error: any) {
      console.error("Failed to check in guest:", error)
      toast({
        title: "Check-in Failed",
        description: error.message || "Failed to check in guest.",
        variant: "destructive",
      })
    }
  }

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const todayArrivals = useMemo(() => {
    return reservations.filter(r => {
      // Robust date matching: compare YYYY-MM-DD parts
      const checkInDateStr = r.checkIn && typeof r.checkIn === 'string' ? r.checkIn.split('T')[0] : '';
      return checkInDateStr === todayStr && 
             (r.status === "confirmed" || r.status === "no-show")
    })
  }, [reservations, todayStr])

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
      value: todayArrivals.length.toString(),
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
  ], [dashboardStats, isAdmin, todayCheckOuts, todayArrivals])

  const activeStaff = staff.filter(s => s.status === "active").length
  const occupiedRoomsCount = rooms.filter(r => r.status === "occupied").length

  return (
    <div className="space-y-6">
      {/* Header Row matching 1st image */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Welcome back, <span className="font-bold text-blue-600 dark:text-blue-400">{user?.hotelName || "Grand Hotel"}</span>. Here's what's happening today. 👋
          </p>
        </div>
        
        {/* Right side widgets */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Notification bell card */}
          <Button 
            variant="outline" 
            size="icon" 
            className="relative h-11 w-11 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full text-[9px] font-bold text-white flex items-center justify-center shadow-xs animate-pulse">
              3
            </span>
          </Button>

          {/* Date Widget Card */}
          <div className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-4 py-2.5 rounded-2xl shadow-xs font-semibold">
            <CalendarCheck className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
            <span>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
          </div>

          {/* Profile Dropdown Card */}
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-3.5 py-1.5 rounded-2xl shadow-xs">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-blue-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 font-bold text-blue-600 dark:text-blue-400 text-sm">
              {user?.name ? user.name.split(" ").map((n) => n[0]).join("") : "HA"}
            </div>
            <div className="text-left leading-tight hidden sm:block">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user?.name || "Grand Hotel Admin"}</p>
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{user?.role === "super-admin" ? "Super Admin" : "Administrator"}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-1 hidden sm:block" />
          </div>
        </div>
      </div>

      {/* Stats Grid with dynamic light backgrounds matching 1st image */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          const bgColors = [
            "bg-blue-50 dark:bg-blue-950/20",
            "bg-blue-50 dark:bg-blue-950/20",
            "bg-purple-50 dark:bg-purple-950/20",
            "bg-emerald-50 dark:bg-emerald-950/20",
          ]
          const textColors = [
            "text-blue-600 dark:text-blue-400",
            "text-blue-600 dark:text-blue-400",
            "text-purple-600 dark:text-purple-400",
            "text-emerald-600 dark:text-emerald-400",
          ]
          const cardBg = bgColors[index % bgColors.length]
          const cardText = textColors[index % textColors.length]
          
          return (
            <Card key={stat.label} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={cn("p-2.5 rounded-xl", cardBg)}>
                    <Icon className={cn("h-5 w-5", cardText)} />
                  </div>
                  <div
                    className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/15 px-2 py-0.5 rounded-full"
                  >
                    {stat.change}
                    <ArrowUpRight className="h-3 w-3" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
                  <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Arrivals and Blocked */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Arrivals */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Today's Arrivals</CardTitle>
                <CardDescription className="text-slate-400">{todayArrivals.length} pending check-ins</CardDescription>
              </div>
              <Link href="/admin/front-office/reservation">
                <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayArrivals.length > 0 ? (
                  todayArrivals.slice(0, 5).map((reservation) => (
                    <div
                      key={reservation.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/70 dark:border-slate-800/60"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-100/50 flex items-center justify-center overflow-hidden">
                          {reservation.guestPhotoUrl ? (
                            <img 
                              src={reservation.guestPhotoUrl} 
                              alt={reservation.guestName} 
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-sm font-semibold text-blue-600">${reservation.guestName.split(" ").map((n: string) => n[0]).join("")}</span>`;
                              }}
                            />
                          ) : (
                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                              {reservation.guestName.split(" ").map((n: string) => n[0]).join("")}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{reservation.guestName}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Room {reservation.roomNumber} &middot; {reservation.checkIn} to {reservation.checkOut}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold text-slate-800 dark:text-slate-200">${reservation.totalAmount}</p>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase">
                            ${reservation.paidAmount} paid
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleCheckIn(reservation.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs"
                        >
                          Check In
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  /* Premium Empty State matching 1st image */
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400">
                      <CalendarCheck className="h-7 w-7" />
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[8px] font-bold text-white shadow-xs">!</span>
                    </div>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-200">No arrivals scheduled for today</p>
                    <p className="text-xs text-slate-400 mt-1">You're all caught up! Enjoy the day.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Blocked Rooms */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Blocked Rooms</CardTitle>
              <CardDescription className="text-slate-400">Rooms currently out of service</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {blockedRooms.length > 0 ? (
                  blockedRooms.slice(0, 5).map((block) => (
                    <div
                      key={block.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/70 dark:border-slate-800/60"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <BedDouble className="h-5 w-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">Room {block.roomNumber}</p>
                          <p className="text-xs text-slate-400 mt-0.5">Blocked Range</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{block.remark}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(block.from).toLocaleDateString()} to {new Date(block.to).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  /* Premium Empty State matching 1st image */
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400">
                      <LockKeyhole className="h-7 w-7" />
                    </div>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-200">No rooms currently blocked</p>
                    <p className="text-xs text-slate-400 mt-1">All rooms are ready to welcome guests.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel: Room Status & Staff */}
        <div className="space-y-6">
          {/* Room Status with beautiful progress bars */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3 gap-3">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Room Status</CardTitle>
              </div>
              <Link href="/admin/front-office/room-dashboard">
                <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800">
                  View Room Dashboard
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const totalRoomsCount = rooms.length || 1
                const availablePercentage = (rooms.filter(r => r.status === "available").length / totalRoomsCount) * 100
                const occupiedPercentage = (occupiedRoomsCount / totalRoomsCount) * 100
                const reservedPercentage = (rooms.filter(r => r.status === "reserved").length / totalRoomsCount) * 100
                const maintenancePercentage = (rooms.filter(r => r.status === "maintenance").length / totalRoomsCount) * 100

                return [
                  { label: "Available", dotColor: "bg-emerald-500", barColor: "bg-emerald-500", count: rooms.filter(r => r.status === "available").length, percentage: availablePercentage },
                  { label: "Occupied", dotColor: "bg-blue-600", barColor: "bg-blue-600", count: occupiedRoomsCount, percentage: occupiedPercentage },
                  { label: "Reserved", dotColor: "bg-amber-500", barColor: "bg-amber-500", count: rooms.filter(r => r.status === "reserved").length, percentage: reservedPercentage },
                  { label: "Maintenance", dotColor: "bg-slate-400", barColor: "bg-slate-400", count: rooms.filter(r => r.status === "maintenance").length, percentage: maintenancePercentage },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5 w-24">
                      <div className={cn("h-2.5 w-2.5 rounded-full", item.dotColor)} />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
                    </div>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-500", item.barColor)}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 w-4 text-right">{item.count}</span>
                  </div>
                ))
              })()}
            </CardContent>
          </Card>

          {/* Staff Overview */}
          {isAdmin && (
            <Card className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Staff Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Active Staff</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{activeStaff}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Total Staff</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{staff.length}</span>
                </div>
                <div className="h-px bg-slate-100 dark:bg-slate-800" />
                <div className="space-y-3">
                  {staff.slice(0, 3).map((s) => (
                    <div key={s.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50/50 dark:hover:bg-slate-850 transition-colors">
                      <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 text-xs shadow-xs border border-slate-100/50 dark:border-slate-800">
                        {s.name.split(" ").map((n: string) => n[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{s.name}</p>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5">{s.role}</p>
                      </div>
                      <div className={`h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900 shadow-xs ${s.status === "active" ? "bg-emerald-500" : "bg-slate-300"}`} />
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
