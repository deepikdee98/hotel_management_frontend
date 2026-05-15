"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  BedDouble,
  CalendarCheck,
  UserCircle,
  ArrowUpRight,
  Clock,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Eye,
  LogOut,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DashboardLayout } from "@/components/dashboard-layout"
import { getFrontOfficeReservations, getFrontOfficeRooms } from "@/lib/backend-api"

export default function AdminFrontOfficePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false)
  const [rooms, setRooms] = useState<Awaited<ReturnType<typeof getFrontOfficeRooms>>>([])
  const [reservations, setReservations] = useState<Awaited<ReturnType<typeof getFrontOfficeReservations>>>([])

  useEffect(() => {
    const load = async () => {
      try {
        const [roomData, reservationData] = await Promise.all([
          getFrontOfficeRooms(),
          getFrontOfficeReservations(),
        ])
        setRooms(roomData)
        setReservations(reservationData)
      } catch {
        setRooms([])
        setReservations([])
      }
    }

    load()
  }, [])

  const stats = useMemo(() => {
    const totalRooms = rooms.length
    const availableRooms = rooms.filter((r) => r.status === "available").length
    const todayCheckIns = reservations.filter((r) => r.status === "confirmed").length
    const todayCheckOuts = reservations.filter((r) => r.status === "checked-out").length

    return [
      {
        label: "Total Rooms",
        value: totalRooms.toString(),
        icon: BedDouble,
        color: "text-primary",
        bgColor: "bg-primary/10",
      },
      {
        label: "Available",
        value: availableRooms.toString(),
        icon: BedDouble,
        color: "text-success",
        bgColor: "bg-success/10",
      },
      {
        label: "Today's Check-ins",
        value: todayCheckIns.toString(),
        icon: CalendarCheck,
        color: "text-chart-2",
        bgColor: "bg-chart-2/10",
      },
      {
        label: "Today's Check-outs",
        value: todayCheckOuts.toString(),
        icon: CalendarCheck,
        color: "text-warning",
        bgColor: "bg-warning/10",
      },
    ]
  }, [rooms, reservations])

  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const recentGuests = useMemo(() => {
    const guestMap = new Map<string, { id: string; name: string; email: string; visits: number }>()

    for (const reservation of reservations) {
      const key = reservation.guestName.trim().toLowerCase()
      if (!key) continue
      const existing = guestMap.get(key)
      if (existing) {
        existing.visits += 1
      } else {
        guestMap.set(key, {
          id: reservation.id,
          name: reservation.guestName,
          email: reservation.guestEmail || "",
          visits: 1,
        })
      }
    }

    return Array.from(guestMap.values()).slice(0, 4)
  }, [reservations])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Confirmed</Badge>
      case "checked-in":
        return <Badge className="bg-success/10 text-success border-success/20">Checked In</Badge>
      case "checked-out":
        return <Badge className="bg-muted text-muted-foreground border-muted">Checked Out</Badge>
      case "cancelled":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRoomStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-success"
      case "occupied":
        return "bg-primary"
      case "reserved":
        return "bg-warning"
      case "maintenance":
        return "bg-muted-foreground"
      case "cleaning":
        return "bg-chart-2"
      case "blocked":
        return "bg-destructive"
      default:
        return "bg-muted"
    }
  }

  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Front Office</h1>
            <p className="text-muted-foreground">
              Manage rooms, reservations, and guest check-ins
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
                    <div className={`p-2.5 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
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

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Reservations Table */}
          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Reservations</CardTitle>
                  <CardDescription>{filteredReservations.length} reservations found</CardDescription>
                </div>
                <Dialog open={isNewReservationOpen} onOpenChange={setIsNewReservationOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                      <Plus className="h-4 w-4 mr-2" />
                      New Reservation
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border max-w-md">
                    <DialogHeader>
                      <DialogTitle>New Reservation</DialogTitle>
                      <DialogDescription>Create a new room reservation</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="guest">Guest Name</Label>
                        <Input id="guest" placeholder="Enter guest name" className="bg-input border-border" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="checkin">Check-in Date</Label>
                          <Input id="checkin" type="date" className="bg-input border-border" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="checkout">Check-out Date</Label>
                          <Input id="checkout" type="date" className="bg-input border-border" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="room">Room</Label>
                        <Select>
                          <SelectTrigger className="bg-input border-border">
                            <SelectValue placeholder="Select room" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {rooms.filter(r => r.status === "available").map((room) => (
                              <SelectItem key={room.id} value={room.id}>
                                Room {room.number} - {room.type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsNewReservationOpen(false)}>
                          Cancel
                        </Button>
                        <Button className="bg-primary text-primary-foreground" onClick={() => setIsNewReservationOpen(false)}>
                          Create Reservation
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by guest or room..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-input border-border"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px] bg-input border-border">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="checked-in">Checked In</SelectItem>
                    <SelectItem value="checked-out">Checked Out</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="text-muted-foreground">Guest</TableHead>
                      <TableHead className="text-muted-foreground">Room</TableHead>
                      <TableHead className="text-muted-foreground">Check-in</TableHead>
                      <TableHead className="text-muted-foreground">Check-out</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReservations.slice(0, 6).map((reservation) => (
                      <TableRow key={reservation.id} className="hover:bg-muted/20">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-medium text-primary">
                                {reservation.guestName.split(" ").map(n => n[0]).join("")}
                              </span>
                            </div>
                            <span className="font-medium text-foreground">{reservation.guestName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">{reservation.roomNumber}</TableCell>
                        <TableCell className="text-muted-foreground">{reservation.checkIn}</TableCell>
                        <TableCell className="text-muted-foreground">{reservation.checkOut}</TableCell>
                        <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Room Overview & Quick Actions */}
          <div className="space-y-6">
            {/* Room Overview */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Room Overview</CardTitle>
                <CardDescription>Current room status distribution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {["available", "occupied", "reserved", "maintenance", "cleaning", "blocked"].map((status) => {
                  const count = rooms.filter(r => r.status === status).length
                  const percentage = rooms.length ? Math.round((count / rooms.length) * 100) : 0
                  return (
                    <div key={status} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${getRoomStatusColor(status)}`} />
                          <span className="text-foreground capitalize">{status}</span>
                        </div>
                        <span className="text-muted-foreground">{count} rooms</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getRoomStatusColor(status)} transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-between bg-transparent border-border hover:bg-muted"
                  asChild
                >
                  <Link href="/admin/front-office/room-dashboard">
                    <span className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4" />
                      Room Dashboard
                    </span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between bg-transparent border-border hover:bg-muted"
                  asChild
                >
                  <Link href="/admin/front-office/rooms">
                    <span className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4" />
                      Manage Rooms
                    </span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between bg-transparent border-border hover:bg-muted"
                  asChild
                >
                  <Link href="/admin/front-office/guests">
                    <span className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4" />
                      View Guests
                    </span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between bg-transparent border-border hover:bg-muted"
                  asChild
                >
                  <Link href="/admin/front-office/reservations">
                    <span className="flex items-center gap-2">
                      <CalendarCheck className="h-4 w-4" />
                      All Reservations
                    </span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between bg-transparent border-border hover:bg-muted"
                  asChild
                >
                  <Link href="/admin/front-office/reception/check-out">
                    <span className="flex items-center gap-2 text-warning">
                      <LogOut className="h-4 w-4" />
                      Process Check-Out
                    </span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Recent Guests */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Recent Guests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentGuests.map((guest) => (
                  <div key={guest.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-sm font-medium text-muted-foreground">
                        {guest.name.split(" ").map(n => n[0]).join("")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{guest.name}</p>
                      <p className="text-xs text-muted-foreground">{guest.email || "No email"}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {guest.visits} stays
                    </Badge>
                  </div>
                ))}
                {recentGuests.length === 0 && (
                  <p className="text-sm text-muted-foreground">No guest activity found</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
