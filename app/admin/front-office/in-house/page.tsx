"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Users, MoreHorizontal, User, FileText, CreditCard, LogOut, MessageSquare } from "lucide-react"
import { getFrontOfficeReservations, getFrontOfficeRooms, getInHouseGuests } from "@/lib/backend-api"

export default function InHouseGuestsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [reservations, setReservations] = useState<Awaited<ReturnType<typeof getFrontOfficeReservations>>>([])
  const [rooms, setRooms] = useState<Awaited<ReturnType<typeof getFrontOfficeRooms>>>([])

  useEffect(() => {
    const load = async () => {
      try {
        const [inHouse, reservationData, roomData] = await Promise.all([
          getInHouseGuests(),
          getFrontOfficeReservations({ status: "checked-in" }),
          getFrontOfficeRooms(),
        ])

        setRooms(roomData)
        setReservations(reservationData)

        const inHouseGuests = inHouse.data.guests || []
        if (inHouseGuests.length && !reservationData.length) {
          setReservations(
            inHouseGuests.map((item) => ({
              id: String(item.folioId || ""),
              reservationId: String(item.bookingNo || item.folioId || ""),
              guestName: String(item.guestName || ""),
              guestEmail: "",
              guestPhone: "",
              roomId: "",
              roomNumber: String(item.roomNumber || ""),
              checkIn: item.checkInDate ? new Date(String(item.checkInDate)).toISOString().slice(0, 10) : "",
              checkOut: "",
              status: "checked-in" as const,
              totalAmount: 0,
              paidAmount: 0,
              createdAt: "",
            }))
          )
        }
      } catch {
        setReservations([])
        setRooms([])
      }
    }

    load()
  }, [])

  // Get all checked-in reservations with room details
  const inHouseGuests = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
    return reservation.status === "checked-in" && matchesSearch
  }).map((reservation) => {
    const room = rooms.find((r) => r.number === reservation.roomNumber)
    const checkInDate = new Date(reservation.checkIn)
    const checkOutDate = new Date(reservation.checkOut)
    const today = new Date()
    const totalNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    const nightsStayed = Math.ceil((today.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    const balance = reservation.totalAmount - reservation.paidAmount

    return {
      ...reservation,
      roomType: room?.type || "standard",
      totalNights,
      nightsStayed,
      balance,
    }
  })

  const totalBalance = inHouseGuests.reduce((sum, guest) => sum + guest.balance, 0)

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">In-House Guests</h1>
          <p className="text-muted-foreground">View all currently staying guests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Guests</p>
                  <p className="text-2xl font-bold">{inHouseGuests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                  <CreditCard className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                  <p className="text-2xl font-bold">${totalBalance}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                  <LogOut className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due for Checkout</p>
                  <p className="text-2xl font-bold">2</p>
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
                placeholder="Search by guest name or room number..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* In-House Guests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Currently Staying</CardTitle>
            <CardDescription>{inHouseGuests.length} guests in-house</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest Name</TableHead>
                  <TableHead>Room No</TableHead>
                  <TableHead>Room Type</TableHead>
                  <TableHead>Check-in Date</TableHead>
                  <TableHead>Nights</TableHead>
                  <TableHead>Check-out Date</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inHouseGuests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No in-house guests found
                    </TableCell>
                  </TableRow>
                ) : (
                  inHouseGuests.map((guest) => (
                    <TableRow key={guest.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{guest.guestName}</p>
                            <p className="text-sm text-muted-foreground">{guest.guestPhone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {guest.roomNumber}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{guest.roomType}</TableCell>
                      <TableCell>{guest.checkIn}</TableCell>
                      <TableCell>
                        {guest.nightsStayed} / {guest.totalNights}
                      </TableCell>
                      <TableCell>{guest.checkOut}</TableCell>
                      <TableCell>
                        {guest.balance > 0 ? (
                          <span className="text-warning font-medium">${guest.balance}</span>
                        ) : (
                          <span className="text-success">Paid</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-success/10 text-success border-success/20">In-House</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/front-office/guest-profile/${guest.id}`}>
                                <User className="h-4 w-4 mr-2" />
                                View Profile
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/front-office/billing?guest=${guest.id}`}>
                                <FileText className="h-4 w-4 mr-2" />
                                View Folio
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Add Charge
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/front-office/check-out?reservation=${guest.id}`}>
                                <LogOut className="h-4 w-4 mr-2" />
                                Check Out
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
