"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CalendarCheck,
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react"

// Mock reservations
const mockReservations = [
  { id: "RES-001", guest: "John Smith", room: "101", checkIn: "Jan 15", checkOut: "Jan 18", status: "confirmed", total: 360 },
  { id: "RES-002", guest: "Emma Wilson", room: "205", checkIn: "Jan 16", checkOut: "Jan 20", status: "checked-in", total: 720 },
  { id: "RES-003", guest: "Michael Brown", room: "302", checkIn: "Jan 17", checkOut: "Jan 19", status: "pending", total: 360 },
  { id: "RES-004", guest: "Sarah Davis", room: "118", checkIn: "Jan 18", checkOut: "Jan 22", status: "confirmed", total: 480 },
  { id: "RES-005", guest: "Robert Johnson", room: "401", checkIn: "Jan 14", checkOut: "Jan 16", status: "checked-out", total: 700 },
  { id: "RES-006", guest: "Lisa Anderson", room: "203", checkIn: "Jan 19", checkOut: "Jan 21", status: "cancelled", total: 360 },
]

export default function AdminReservationsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false)

  const filteredReservations = mockReservations.filter((res) => {
    const matchesSearch =
      res.guest.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.room.includes(searchQuery)
    const matchesStatus = filterStatus === "all" || res.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-primary/20 text-primary border-0">Confirmed</Badge>
      case "checked-in":
        return <Badge className="bg-chart-2/20 text-chart-2 border-0">Checked In</Badge>
      case "checked-out":
        return <Badge variant="secondary">Checked Out</Badge>
      case "pending":
        return <Badge className="bg-warning/20 text-warning border-0">Pending</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const stats = {
    total: mockReservations.length,
    confirmed: mockReservations.filter((r) => r.status === "confirmed").length,
    checkedIn: mockReservations.filter((r) => r.status === "checked-in").length,
    pending: mockReservations.filter((r) => r.status === "pending").length,
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reservations</h1>
            <p className="text-muted-foreground">Manage all hotel reservations</p>
          </div>
          <Dialog open={isNewReservationOpen} onOpenChange={setIsNewReservationOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Reservation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Reservation</DialogTitle>
                <DialogDescription>Book a room for a guest</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Guest Name</Label>
                  <Input placeholder="Full name" />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="guest@email.com" />
                </div>
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input placeholder="+1 234 567 8900" />
                </div>
                <div className="grid gap-2">
                  <Label>Room</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="101">Room 101 - Standard ($120/night)</SelectItem>
                      <SelectItem value="201">Room 201 - Deluxe ($180/night)</SelectItem>
                      <SelectItem value="301">Room 301 - Suite ($350/night)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Check In</Label>
                    <Input type="date" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Check Out</Label>
                    <Input type="date" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Number of Guests</Label>
                  <Input type="number" placeholder="1" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewReservationOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsNewReservationOpen(false)}>Create Reservation</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-chart-2/10">
                <CalendarCheck className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Reservations</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.confirmed}</p>
                <p className="text-xs text-muted-foreground">Confirmed</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-chart-2/10">
                <Calendar className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.checkedIn}</p>
                <p className="text-xs text-muted-foreground">Checked In</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-foreground">All Reservations</CardTitle>
                <CardDescription>View and manage bookings</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="pl-8 bg-background"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="checked-in">Checked In</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="checked-out">Checked Out</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Reservation ID</TableHead>
                  <TableHead className="text-muted-foreground">Guest</TableHead>
                  <TableHead className="text-muted-foreground">Room</TableHead>
                  <TableHead className="text-muted-foreground">Check In</TableHead>
                  <TableHead className="text-muted-foreground">Check Out</TableHead>
                  <TableHead className="text-muted-foreground">Total</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((res) => (
                  <TableRow key={res.id} className="border-border">
                    <TableCell className="font-medium text-foreground">{res.id}</TableCell>
                    <TableCell className="text-foreground">{res.guest}</TableCell>
                    <TableCell className="text-foreground">{res.room}</TableCell>
                    <TableCell className="text-muted-foreground">{res.checkIn}</TableCell>
                    <TableCell className="text-muted-foreground">{res.checkOut}</TableCell>
                    <TableCell className="text-foreground">${res.total}</TableCell>
                    <TableCell>{getStatusBadge(res.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {res.status === "confirmed" && (
                          <Button variant="outline" size="sm">
                            Check In
                          </Button>
                        )}
                        {res.status === "checked-in" && (
                          <Button variant="outline" size="sm">
                            Check Out
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
