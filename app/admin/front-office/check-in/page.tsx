"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, UserCheck, Clock, Key, CreditCard, Upload, ArrowRight } from "lucide-react"
import { createCheckIn, getBookingNumberPreview, getFrontOfficeReservations, getFrontOfficeRooms } from "@/lib/backend-api"
import type { Reservation } from "@/lib/types"

export default function CheckInPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [reservations, setReservations] = useState<Awaited<ReturnType<typeof getFrontOfficeReservations>>>([])
  const [rooms, setRooms] = useState<Awaited<ReturnType<typeof getFrontOfficeRooms>>>([])
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false)
  const [bookingPreview, setBookingPreview] = useState("Loading...")

  useEffect(() => {
    let cancelled = false
    getBookingNumberPreview()
      .then((preview) => {
        if (!cancelled) setBookingPreview(preview)
      })
      .catch(() => {
        if (!cancelled) setBookingPreview("Pending")
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const [reservationData, roomData] = await Promise.all([
          getFrontOfficeReservations(),
          getFrontOfficeRooms(),
        ])

        setReservations(reservationData)
        setRooms(roomData)
      } catch {
        setReservations([])
        setRooms([])
      }
    }

    load()
  }, [])

  // Check-in form state
  const [checkInForm, setCheckInForm] = useState({
    arrivalTime: "",
    assignedRoom: "",
    idUploaded: false,
    keyIssued: false,
    advanceCollected: "",
    address: "",
  })

  // Filter only confirmed reservations that are due for check-in today
  const pendingCheckIns = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.id.toLowerCase().includes(searchQuery.toLowerCase())
    return reservation.status === "confirmed" && matchesSearch
  })

  const availableRooms = rooms.filter((room) => room.status === "available")

  const handleStartCheckIn = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setCheckInForm({
      arrivalTime: new Date().toTimeString().slice(0, 5),
      assignedRoom: reservation.roomNumber,
      idUploaded: false,
      keyIssued: false,
      advanceCollected: reservation.paidAmount.toString(),
      address: "",
    })
    setIsCheckInDialogOpen(true)
  }

  const handleCompleteCheckIn = async () => {
    if (!selectedReservation) return

    try {
      await createCheckIn({
        reservationId: selectedReservation.id,
        bookingNo: selectedReservation.bookingNumber || selectedReservation.reservationId || selectedReservation.id,
        guestName: selectedReservation.guestName,
        mobileNo: selectedReservation.guestPhone,
        email: selectedReservation.guestEmail,
        roomNumber: checkInForm.assignedRoom,
        checkInDate: selectedReservation.checkIn,
        advanceAmount: Number(checkInForm.advanceCollected),
        address: checkInForm.address,
        nights: Math.max(
          1,
          Math.ceil(
            (new Date(selectedReservation.checkOut).getTime() - new Date(selectedReservation.checkIn).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        ),
      })
      const [reservationData, roomData] = await Promise.all([
        getFrontOfficeReservations(),
        getFrontOfficeRooms(),
      ])
      setReservations(reservationData)
      setRooms(roomData)
    } catch (error: any) {
      console.error("Check-in failed:", error)
      return
    }

    setIsCheckInDialogOpen(false)
    setSelectedReservation(null)
  }

  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Guest Check-In</h1>
            <p className="text-muted-foreground">Process guest arrivals and complete check-in formalities</p>
          </div>
          <Badge variant="outline" className="w-fit text-xs font-semibold">Booking ID: {bookingPreview}</Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expected Today</p>
                  <p className="text-2xl font-bold">{pendingCheckIns.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                  <UserCheck className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Checked In Today</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                  <Key className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rooms Ready</p>
                  <p className="text-2xl font-bold">{availableRooms.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by guest name or reservation ID..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pending Check-ins Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Check-Ins</CardTitle>
            <CardDescription>Guests with confirmed reservations awaiting check-in</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reservation ID</TableHead>
                  <TableHead>Guest Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Check-in Date</TableHead>
                  <TableHead>Nights</TableHead>
                  <TableHead>Advance Paid</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingCheckIns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No pending check-ins found
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingCheckIns.map((reservation) => {
                    const nights = Math.ceil(
                      (new Date(reservation.checkOut).getTime() - new Date(reservation.checkIn).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                    return (
                      <TableRow key={reservation.id}>
                        <TableCell className="font-medium">{reservation.id}</TableCell>
                        <TableCell className="font-medium">{reservation.guestName}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{reservation.guestPhone}</p>
                            <p className="text-muted-foreground">{reservation.guestEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{reservation.roomNumber}</Badge>
                        </TableCell>
                        <TableCell>{reservation.checkIn}</TableCell>
                        <TableCell>{nights}</TableCell>
                        <TableCell>
                          <span className="text-success">${reservation.paidAmount}</span>
                          <span className="text-muted-foreground"> / ${reservation.totalAmount}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => handleStartCheckIn(reservation)} className="gap-2">
                            <UserCheck className="h-4 w-4" />
                            Check In
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Check-In Dialog */}
        <Dialog open={isCheckInDialogOpen} onOpenChange={setIsCheckInDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <DialogTitle>Complete Check-In</DialogTitle>
                <Badge variant="outline" className="w-fit text-xs font-semibold">
                  Booking ID: {selectedReservation?.bookingNumber || bookingPreview}
                </Badge>
              </div>
              <DialogDescription>
                Processing check-in for {selectedReservation?.guestName} - Reservation #{selectedReservation?.id}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Reservation Summary */}
              <Card className="bg-secondary/50">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Guest Name</p>
                      <p className="font-medium">{selectedReservation?.guestName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Contact</p>
                      <p className="font-medium">{selectedReservation?.guestPhone}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Check-in Date</p>
                      <p className="font-medium">{selectedReservation?.checkIn}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Check-out Date</p>
                      <p className="font-medium">{selectedReservation?.checkOut}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Check-In Form */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="arrivalTime">Arrival Time</Label>
                  <Input
                    id="arrivalTime"
                    type="time"
                    value={checkInForm.arrivalTime}
                    onChange={(e) => setCheckInForm({ ...checkInForm, arrivalTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedRoom">Assigned Room</Label>
                  <Select
                    value={checkInForm.assignedRoom}
                    onValueChange={(v) => setCheckInForm({ ...checkInForm, assignedRoom: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedReservation?.roomNumber && (
                        <SelectItem value={selectedReservation.roomNumber}>
                          {selectedReservation.roomNumber} (Reserved)
                        </SelectItem>
                      )}
                      {availableRooms.map((room) => (
                        <SelectItem key={room.id} value={room.number}>
                          {room.number} - {room.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="address">Guest Address</Label>
                  <Input
                    id="address"
                    placeholder="Enter guest address"
                    value={checkInForm.address}
                    onChange={(e) => setCheckInForm({ ...checkInForm, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="advanceCollected">Advance Collected</Label>
                  <Input
                    id="advanceCollected"
                    type="number"
                    value={checkInForm.advanceCollected}
                    onChange={(e) => setCheckInForm({ ...checkInForm, advanceCollected: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>ID Proof Upload</Label>
                  <Button variant="outline" className="w-full gap-2 bg-transparent">
                    <Upload className="h-4 w-4" />
                    Upload ID Document
                  </Button>
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-3">
                <Label>Check-In Checklist</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="idVerified"
                      checked={checkInForm.idUploaded}
                      onCheckedChange={(c) => setCheckInForm({ ...checkInForm, idUploaded: !!c })}
                    />
                    <label htmlFor="idVerified" className="text-sm">
                      ID proof verified and uploaded
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="keyIssued"
                      checked={checkInForm.keyIssued}
                      onCheckedChange={(c) => setCheckInForm({ ...checkInForm, keyIssued: !!c })}
                    />
                    <label htmlFor="keyIssued" className="text-sm">
                      Room key issued to guest
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCheckInDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent">
                <ArrowRight className="h-4 w-4" />
                Change Room
              </Button>
              <Button onClick={handleCompleteCheckIn} className="gap-2">
                <UserCheck className="h-4 w-4" />
                Complete Check-In
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
