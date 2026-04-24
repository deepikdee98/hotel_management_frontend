"use client"


import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, BedDouble, Users, CalendarCheck, FileText } from "lucide-react"
import { getRoomLookup, getGuestLookup } from "@/lib/backend-api"

export default function LookupsPage() {
  const [roomSearch, setRoomSearch] = useState("")
  const [guestSearch, setGuestSearch] = useState("")
  const [roomStatusFilter, setRoomStatusFilter] = useState("all")
  
  const [rooms, setRooms] = useState<any[]>([])
  const [guests, setGuests] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const loadRooms = async () => {
    try {
      const data = await getRoomLookup({ search: roomSearch, status: roomStatusFilter })
      setRooms(data)
    } catch (error) {
      console.error("Failed to load rooms", error)
    }
  }

  const loadGuests = async () => {
    try {
      const data = await getGuestLookup(guestSearch)
      setGuests(data)
    } catch (error) {
      console.error("Failed to load guests", error)
    }
  }

  useEffect(() => {
    loadRooms()
  }, [roomSearch, roomStatusFilter])

  useEffect(() => {
    loadGuests()
  }, [guestSearch])

  const getRoomStatusBadge = (status: string) => {
    const s = status.toLowerCase()
    switch (s) {
      case "available": return <Badge className="bg-primary/10 text-primary border-primary/20">Available</Badge>
      case "occupied": return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Occupied</Badge>
      case "maintenance": return <Badge variant="destructive">Maintenance</Badge>
      case "reserved": return <Badge variant="secondary">Reserved</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lookups</h1>
          <p className="text-sm text-muted-foreground">Quick lookup for rooms, guests, reservations and folios</p>
        </div>

        <Tabs defaultValue="rooms" className="w-full">
          <TabsList>
            <TabsTrigger value="rooms"><BedDouble className="h-4 w-4 mr-1.5" />Room Lookup</TabsTrigger>
            <TabsTrigger value="guests"><Users className="h-4 w-4 mr-1.5" />Guest Lookup</TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="space-y-3 mt-3">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by room number..." value={roomSearch} onChange={(e) => setRoomSearch(e.target.value)} className="pl-9" />
                  </div>
                  <Select value={roomStatusFilter} onValueChange={setRoomStatusFilter}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room No</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Floor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>HK Status</TableHead>
                      <TableHead>Guest</TableHead>
                      <TableHead>Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map((r) => (
                      <TableRow key={r.roomNo}>
                        <TableCell className="font-medium">{r.roomNo}</TableCell>
                        <TableCell>{r.type}</TableCell>
                        <TableCell>{r.floor}</TableCell>
                        <TableCell>{getRoomStatusBadge(r.status)}</TableCell>
                        <TableCell>
                          {r.hkStatus === "clean" ? (
                            <Badge variant="outline" className="text-primary border-primary/30">Clean</Badge>
                          ) : r.hkStatus === "dirty" ? (
                            <Badge variant="outline" className="text-destructive border-destructive/30">Dirty</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{r.guest}</TableCell>
                        <TableCell>${r.rate.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {rooms.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          No rooms found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guests" className="space-y-3 mt-3">
            <Card>
              <CardHeader className="pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by guest name or phone..." value={guestSearch} onChange={(e) => setGuestSearch(e.target.value)} className="pl-9" />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest Name</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Check-In</TableHead>
                      <TableHead>Check-Out</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guests.map((g, index) => (
                      <TableRow key={g.reservationId || index}>
                        <TableCell className="font-medium">{g.guestName}</TableCell>
                        <TableCell>{g.room}</TableCell>
                        <TableCell>{g.phone}</TableCell>
                        <TableCell>{g.email || "-"}</TableCell>
                        <TableCell>{g.checkIn ? new Date(g.checkIn).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>{g.checkOut ? new Date(g.checkOut).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>
                          <Badge variant={g.status === "In-House" ? "default" : "secondary"}>
                            {g.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {guests.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          No guests found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  )
}

