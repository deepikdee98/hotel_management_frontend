"use client"

import { useEffect, useState } from "react"
import { BedDouble, CalendarCheck, UserCircle, Clock, ArrowRight, Bell } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getFrontOfficeReservations, getFrontOfficeRooms, getStaffDashboard, updateStaffReservationStatus } from "@/lib/backend-api"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"

export default function StaffDashboard() {
  const { user } = useAuth()
  const [rooms, setRooms] = useState<Awaited<ReturnType<typeof getFrontOfficeRooms>>>([])
  const [reservations, setReservations] = useState<Awaited<ReturnType<typeof getFrontOfficeReservations>>>([])
  const [todayCheckOuts, setTodayCheckOuts] = useState(0)

  const loadData = async () => {
    try {
      const [dashboard, roomData, reservationData] = await Promise.all([
        getStaffDashboard(),
        getFrontOfficeRooms(),
        getFrontOfficeReservations(),
      ])

      setRooms(roomData)
      setReservations(reservationData)

      const stats = dashboard.stats as Record<string, number> | undefined
      if (stats?.todayCheckouts !== undefined) {
        setTodayCheckOuts(Number(stats.todayCheckouts))
      }
    } catch {
      setRooms([])
      setReservations([])
      setTodayCheckOuts(0)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCheckIn = async (reservationId: string) => {
    try {
      await updateStaffReservationStatus(reservationId, "checked-in")
      await loadData()
    } catch (error) {
      console.error("Failed to check in guest:", error)
    }
  }

  const todayCheckIns = reservations.filter(r => r.status === "confirmed")
  const occupiedRooms = rooms.filter(r => r.status === "occupied")
  const availableRooms = rooms.filter(r => r.status === "available")

  const quickActions = [
    {
      label: "Check-in Guest",
      description: "Process a new guest arrival",
      icon: CalendarCheck,
      href: "/staff/reservations",
    },
    {
      label: "View Rooms",
      description: "See room availability and status",
      icon: BedDouble,
      href: "/staff/rooms",
    },
    {
      label: "Guest Lookup",
      description: "Search guest records",
      icon: UserCircle,
      href: "/staff/guests",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Front Desk Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome, {user?.name}. Here&apos;s your shift overview.
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

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-lg">
                <BedDouble className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{availableRooms.length}</p>
                <p className="text-sm text-muted-foreground">Available Rooms</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <BedDouble className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{occupiedRooms.length}</p>
                <p className="text-sm text-muted-foreground">Occupied Rooms</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning/10 rounded-lg">
                <CalendarCheck className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{todayCheckIns.length}</p>
                <p className="text-sm text-muted-foreground">Pending Check-ins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <UserCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{todayCheckOuts}</p>
                <p className="text-sm text-muted-foreground">Today&apos;s Check-outs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common front desk tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              )
            })}
          </CardContent>
        </Card>

        {/* Today's Check-ins */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Today&apos;s Arrivals</CardTitle>
              <CardDescription>Guests expected to check in today</CardDescription>
            </div>
            <Link href="/staff/reservations">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {todayCheckIns.length > 0 ? (
              <div className="space-y-3">
                {todayCheckIns.map((reservation) => (
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
                          Room {reservation.roomNumber} &middot; {reservation.checkOut}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">${reservation.totalAmount}</p>
                        <p className="text-xs text-muted-foreground">
                          {reservation.paidAmount === reservation.totalAmount ? "Paid" : "Partial"}
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
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No check-ins scheduled for today</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Room Overview Grid */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Room Overview</CardTitle>
            <CardDescription>Quick view of all room statuses</CardDescription>
          </div>
          <Link href="/staff/rooms">
            <Button variant="outline" size="sm">
              Manage Rooms
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium border transition-all cursor-pointer hover:scale-105 ${
                  room.status === "available"
                    ? "bg-success/10 border-success/30 text-success"
                    : room.status === "occupied"
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : room.status === "reserved"
                        ? "bg-warning/10 border-warning/30 text-warning"
                        : room.status === "cleaning"
                          ? "bg-muted border-border text-muted-foreground"
                          : "bg-destructive/10 border-destructive/30 text-destructive"
                }`}
                title={`Room ${room.number} - ${room.status}`}
              >
                <span className="font-bold">{room.number}</span>
                <span className="text-[10px] opacity-70 capitalize">{room.type.slice(0, 3)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-success" />
              <span className="text-xs text-muted-foreground">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-warning" />
              <span className="text-xs text-muted-foreground">Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-muted-foreground" />
              <span className="text-xs text-muted-foreground">Cleaning</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-destructive" />
              <span className="text-xs text-muted-foreground">Maintenance</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
