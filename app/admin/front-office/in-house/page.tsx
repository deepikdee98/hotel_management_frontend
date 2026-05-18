"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Users, MoreHorizontal, User, FileText, CreditCard, LogOut, MessageSquare } from "lucide-react"
import { getInHouseGuests } from "@/lib/backend-api"

type InHouseGuest = {
  id: string
  reservationId: string
  folioId: string
  guestName: string
  guestEmail: string
  guestPhone: string
  roomNumber: string
  roomType: string
  checkIn: string
  checkOut: string
  status: "checked-in"
  totalAmount: number
  paidAmount: number
  totalNights: number
  nightsStayed: number
  balance: number
}

const normalizeDate = (value: unknown) => {
  if (!value) return ""
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().slice(0, 10)
}

const getRoomTypeName = (value: any) => {
  if (!value) return "standard"
  if (typeof value === "string") return value
  return String(value.name || value.code || "standard")
}

const normalizeInHouseGuest = (item: any): InHouseGuest => {
  const checkIn = normalizeDate(item.checkInDate || item.checkIn)
  const checkOut = normalizeDate(item.checkOutDate || item.checkOut)
  const checkInDate = checkIn ? new Date(checkIn) : null
  const today = new Date()
  const totalNights = Math.max(1, Number(item.nights || 1))
  const nightsStayed = checkInDate && !Number.isNaN(checkInDate.getTime())
    ? Math.max(1, Math.ceil((today.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 0
  const totalAmount = Number(item.totalAmount ?? (Number(item.planCharges || 0) * totalNights))
  const paidAmount = Number(item.paidAmount ?? item.advanceAmount ?? 0)

  return {
    id: String(item.checkinId || item.id || item.folioId || ""),
    reservationId: String(item.bookingNumber || item.bookingNo || item.bookingId || item.reservationId || ""),
    folioId: String(item.folioId || item.id || ""),
    guestName: String(item.guestName || item.name || ""),
    guestEmail: String(item.email || item.guestEmail || ""),
    guestPhone: String(item.mobileNo || item.guestPhone || item.phone || ""),
    roomNumber: String(item.roomNumber || item.room?.roomNumber || ""),
    roomType: getRoomTypeName(item.roomType || item.type),
    checkIn,
    checkOut,
    status: "checked-in",
    totalAmount,
    paidAmount,
    totalNights,
    nightsStayed,
    balance: totalAmount - paidAmount,
  }
}

const getGuestStayKey = (guest: InHouseGuest) =>
  [
    guest.guestName.trim().toLowerCase(),
    guest.guestPhone.trim(),
    guest.roomNumber.trim(),
    guest.checkIn,
    guest.checkOut,
  ].join("|")

const removeDuplicateStays = (guests: InHouseGuest[]) => {
  const uniqueGuests = new Map<string, InHouseGuest>()

  guests.forEach((guest) => {
    const key = getGuestStayKey(guest)
    if (!uniqueGuests.has(key)) {
      uniqueGuests.set(key, guest)
    }
  })

  return Array.from(uniqueGuests.values())
}

export default function InHouseGuestsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [guests, setGuests] = useState<InHouseGuest[]>([])

  const openCheckInEdit = (guest: InHouseGuest) => {
    const bookingId = guest.id || guest.reservationId || guest.folioId
    if (!bookingId) return
    router.push(`/admin/front-office/reception/check-in?id=${encodeURIComponent(bookingId)}&mode=edit`)
  }

  useEffect(() => {
    const load = async () => {
      try {
        const inHouse = await getInHouseGuests()
        const normalizedGuests = (inHouse.data.guests || []).map(normalizeInHouseGuest)
        setGuests(removeDuplicateStays(normalizedGuests))
      } catch {
        setGuests([])
      }
    }

    load()
  }, [])

  // Get all checked-in reservations with room details
  const inHouseGuests = guests.filter((guest) => {
    const matchesSearch =
      guest.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const totalBalance = inHouseGuests.reduce((sum, guest) => sum + guest.balance, 0)

  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
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
                    <TableRow
                      key={guest.id}
                      className="cursor-pointer"
                      onDoubleClick={() => openCheckInEdit(guest)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <button
                              type="button"
                              className="font-medium text-left hover:underline"
                              onDoubleClick={(event) => {
                                event.stopPropagation()
                                openCheckInEdit(guest)
                              }}
                            >
                              {guest.guestName}
                            </button>
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
                        {guest.totalAmount <= 0 ? (
                          <span className="text-muted-foreground">$0</span>
                        ) : guest.balance > 0 ? (
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
                              <Link href={`/admin/front-office/reception/check-out?room=${guest.roomNumber}`}>
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
