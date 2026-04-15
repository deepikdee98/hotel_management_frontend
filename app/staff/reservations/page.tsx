"use client"

import { useEffect, useState } from "react"
import {
  CalendarCheck,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  User,
  Phone,
  Mail,
  Calendar,
  BedDouble,
  DollarSign,
  LogIn,
  LogOut,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { createStaffReservation, getFrontOfficeRooms, getStaffReservations, updateStaffReservationStatus } from "@/lib/backend-api"
import type { Reservation } from "@/lib/types"

const statusColors = {
  confirmed: "bg-primary/10 text-primary",
  "checked-in": "bg-success/10 text-success",
  "checked-out": "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [rooms, setRooms] = useState<Awaited<ReturnType<typeof getFrontOfficeRooms>>>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [formData, setFormData] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    roomId: "",
    checkIn: "",
    checkOut: "",
  })

  useEffect(() => {
    const load = async () => {
      try {
        const [staffReservationResponse, roomData] = await Promise.all([
          getStaffReservations(),
          getFrontOfficeRooms(),
        ])

        if (staffReservationResponse && staffReservationResponse.data) {
          const liveReservations = staffReservationResponse.data.reservations.map((item) => ({
            id: String(item.id || item._id || ""),
            reservationId: String(item.reservationId || item.bookingNo || item.id || item._id || ""),
            guestName: String(item.guestName || ""),
            guestEmail: String(item.email || ""),
            guestPhone: String(item.phone || ""),
            roomId: String(item.room_id || item.room || ""),
            roomNumber: String(item.room || item.roomNumber || ""),
            checkIn: item.checkIn ? new Date(String(item.checkIn)).toISOString().slice(0, 10) : "",
            checkOut: item.checkOut ? new Date(String(item.checkOut)).toISOString().slice(0, 10) : "",
            status: (String(item.status || "confirmed") as Reservation["status"]),
            totalAmount: Number(item.totalAmount || 0),
            paidAmount: Number(item.paidAmount || 0),
            createdAt: "",
          }))
          setReservations(liveReservations)
        }

        setRooms(roomData)
      } catch (error: any) {
        console.error("Failed to load staff reservations data:", error)
        setReservations([])
        setRooms([])
      }
    }

    load()
  }, [])

  const filteredReservations = reservations.filter((res) => {
    const matchesSearch = res.guestName.toLowerCase().includes(search.toLowerCase()) ||
      res.roomNumber.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || res.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const availableRooms = rooms.filter(r => r.status === "available")

  const handleAddReservation = async () => {
    const room = rooms.find(r => r.id === formData.roomId)
    if (!room) return

    const checkInDate = new Date(formData.checkIn)
    const checkOutDate = new Date(formData.checkOut)
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    const totalAmount = nights * room.price

    try {
      await createStaffReservation({
        guestName: formData.guestName,
        phone: formData.guestPhone,
        email: formData.guestEmail,
        checkInDate: formData.checkIn,
        checkOutDate: formData.checkOut,
        room: room.id,
        totalAmount,
      });
      const [staffReservationResponse, roomData] = await Promise.all([
        getStaffReservations(),
        getFrontOfficeRooms(),
      ])

      const liveReservations = staffReservationResponse.data.reservations.map((item) => ({
        id: String(item.id || ""),
        reservationId: String(item.reservationId || item.bookingNo || item.id || item._id || ""),
        guestName: String(item.guestName || ""),
        guestEmail: "",
        guestPhone: "",
        roomId: "",
        roomNumber: String(item.room || item.roomNumber || ""),
        checkIn: item.checkIn ? new Date(String(item.checkIn)).toISOString().slice(0, 10) : "",
        checkOut: item.checkOut ? new Date(String(item.checkOut)).toISOString().slice(0, 10) : "",
        status: (String(item.status || "confirmed") as Reservation["status"]),
        totalAmount: Number(item.totalAmount || 0),
        paidAmount: Number(item.paidAmount || 0),
        createdAt: "",
      }))

      setReservations(liveReservations)
      setRooms(roomData)
    } catch {
      return
    }

    setIsAddDialogOpen(false)
    setFormData({ guestName: "", guestEmail: "", guestPhone: "", roomId: "", checkIn: "", checkOut: "" })
  }

  const handleStatusChange = async (id: string, newStatus: Reservation["status"]) => {
    try {

      if (newStatus === "checked-out") {
        const reservation = reservations.find(r => r.id === id)

        if (reservation && reservation.paidAmount < reservation.totalAmount) {
          alert("Please clear pending payment before checkout")
          return
        }
      }

      await updateStaffReservationStatus(id, newStatus)
      const staffReservationResponse = await getStaffReservations()
      if (staffReservationResponse && staffReservationResponse.data) {
        const liveReservations = staffReservationResponse.data.reservations.map((item) => ({
          id: String(item.id || item._id || ""),
          reservationId: String(item.reservationId || item.bookingNo || item.id || item._id || ""),
          guestName: String(item.guestName || ""),
          guestEmail: String(item.email || ""),
          guestPhone: String(item.phone || ""),
          roomId: String(item.room_id || item.room || ""),
          roomNumber: String(item.room || item.roomNumber || ""),
          checkIn: item.checkIn ? new Date(String(item.checkIn)).toISOString().slice(0, 10) : "",
          checkOut: item.checkOut ? new Date(String(item.checkOut)).toISOString().slice(0, 10) : "",
          status: (String(item.status || "confirmed") as Reservation["status"]),
          totalAmount: Number(item.totalAmount || 0),
          paidAmount: Number(item.paidAmount || 0),
          createdAt: "",
        }))
        setReservations(liveReservations)
      }
    } catch (error) {
      console.error("Failed to update reservation status:", error)
    }
  }

  const stats = {
    confirmed: reservations.filter(r => r.status === "confirmed").length,
    checkedIn: reservations.filter(r => r.status === "checked-in").length,
    checkedOut: reservations.filter(r => r.status === "checked-out").length,
    totalRevenue: reservations.reduce((acc, r) => acc + r.paidAmount, 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reservations</h1>
          <p className="text-muted-foreground">Manage guest reservations and bookings</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Reservation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Reservation</DialogTitle>
              <DialogDescription>Book a room for a guest</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="guestName">Guest Name</Label>
                <Input
                  id="guestName"
                  value={formData.guestName}
                  onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guestEmail">Email</Label>
                  <Input
                    id="guestEmail"
                    type="email"
                    value={formData.guestEmail}
                    onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                    placeholder="john@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guestPhone">Phone</Label>
                  <Input
                    id="guestPhone"
                    value={formData.guestPhone}
                    onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
                    placeholder="+1 555 0100"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Select Room</Label>
                <Select
                  value={formData.roomId}
                  onValueChange={(value) => setFormData({ ...formData, roomId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a room" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRooms.length > 0 ? availableRooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        Room {room.number} - {room.type} (₹{room.price}/night)
                      </SelectItem>
                    )) : <SelectItem value="none" disabled>No available rooms</SelectItem>}
                  </SelectContent>
                </Select>
                {availableRooms.length === 0 && (
                  <p className="text-sm text-destructive mt-1">No available rooms. Check room setup.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkIn">Check-in Date</Label>
                  <Input
                    id="checkIn"
                    type="date"
                    value={formData.checkIn}
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkOut">Check-out Date</Label>
                  <Input
                    id="checkOut"
                    type="date"
                    value={formData.checkOut}
                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddReservation}
                  disabled={!formData.guestName || !formData.roomId || !formData.checkIn || !formData.checkOut}
                >
                  Create Reservation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <CalendarCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.confirmed}</p>
                <p className="text-sm text-muted-foreground">Pending Check-in</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-lg">
                <LogIn className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.checkedIn}</p>
                <p className="text-sm text-muted-foreground">Checked In</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <LogOut className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.checkedOut}</p>
                <p className="text-sm text-muted-foreground">Checked Out</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">${stats.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Revenue Collected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reservations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-input"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="checked-in">Checked In</SelectItem>
            <SelectItem value="checked-out">Checked Out</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reservations List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>All Reservations</CardTitle>
          <CardDescription>{filteredReservations.length} reservations found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {reservation.guestName.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{reservation.guestName}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BedDouble className="h-3 w-3" />
                        Room {reservation.roomNumber}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {reservation.checkIn} - {reservation.checkOut}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium text-foreground">${reservation.totalAmount}</p>
                    <p className="text-xs text-muted-foreground">
                      ${reservation.paidAmount} paid
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[reservation.status]}`}>
                    {reservation.status.replace("-", " ")}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedReservation(reservation)}>
                        <User className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {reservation.status === "confirmed" && (
                        <DropdownMenuItem onClick={() => handleStatusChange(reservation.id, "checked-in")}>
                          <LogIn className="mr-2 h-4 w-4" />
                          Check In
                        </DropdownMenuItem>
                      )}
                      {reservation.status === "checked-in" && (
                        <DropdownMenuItem onClick={() => handleStatusChange(reservation.id, "checked-out")}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Check Out
                        </DropdownMenuItem>
                      )}
                      {reservation.status !== "cancelled" && reservation.status !== "checked-out" && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleStatusChange(reservation.id, "cancelled")}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reservation Detail Dialog */}
      <Dialog open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reservation Details</DialogTitle>
            <DialogDescription>Booking #{selectedReservation?.id}</DialogDescription>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-medium text-primary">
                    {selectedReservation.guestName.split(" ").map(n => n[0]).join("")}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-medium">{selectedReservation.guestName}</p>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[selectedReservation.status]}`}>
                    {selectedReservation.status.replace("-", " ")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium">{selectedReservation.guestEmail || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium">{selectedReservation.guestPhone || 'N/A'}</p>
                      </div>
                    </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <BedDouble className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Room</p>
                    <p className="text-sm font-medium">Room {selectedReservation.roomNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Dates</p>
                    <p className="text-sm font-medium">{selectedReservation.checkIn} - {selectedReservation.checkOut}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="text-xl font-bold">${selectedReservation.totalAmount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-medium text-success">${selectedReservation.paidAmount}</span>
                </div>
                {selectedReservation.totalAmount > selectedReservation.paidAmount && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                    <span className="text-muted-foreground">Balance Due</span>
                    <span className="font-medium text-destructive">
                      {/* ${selectedReservation.totalAmount - selectedReservation.paidAmount} */}
                      {selectedReservation.totalAmount > selectedReservation.paidAmount && (
                        <p className="text-red-500 text-sm font-medium">
                          Payment Pending: ₹{selectedReservation.totalAmount - selectedReservation.paidAmount}
                        </p>
                      )}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                {selectedReservation.status === "confirmed" && (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      handleStatusChange(selectedReservation.id, "checked-in")
                      setSelectedReservation(null)
                    }}
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Process Check-in
                  </Button>
                )}
                {selectedReservation.status === "checked-in" && (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      handleStatusChange(selectedReservation.id, "checked-out")
                      setSelectedReservation(null)
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Process Check-out
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedReservation(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
