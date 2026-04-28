"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  BedDouble,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Sparkles,
  Wrench,
} from "lucide-react"

// Mock rooms data
const mockRooms = [
  { id: "101", type: "Standard", floor: 1, status: "available", price: 120, beds: 1 },
  { id: "102", type: "Standard", floor: 1, status: "occupied", price: 120, beds: 1, guest: "John Smith" },
  { id: "103", type: "Deluxe", floor: 1, status: "cleaning", price: 180, beds: 2 },
  { id: "201", type: "Deluxe", floor: 2, status: "available", price: 180, beds: 2 },
  { id: "202", type: "Suite", floor: 2, status: "occupied", price: 350, beds: 2, guest: "Emma Wilson" },
  { id: "203", type: "Standard", floor: 2, status: "maintenance", price: 120, beds: 1 },
  { id: "301", type: "Suite", floor: 3, status: "available", price: 350, beds: 2 },
  { id: "302", type: "Deluxe", floor: 3, status: "occupied", price: 180, beds: 2, guest: "Michael Brown" },
]

const roomTypes = ["All", "Standard", "Deluxe", "Suite"]
const statusTypes = ["All", "available", "occupied", "cleaning", "maintenance"]

export default function AdminRoomsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("All")
  const [filterStatus, setFilterStatus] = useState("All")
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false)

  const filteredRooms = mockRooms.filter((room) => {
    const matchesSearch = room.id.includes(searchQuery) || room.type.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "All" || room.type === filterType
    const matchesStatus = filterStatus === "All" || room.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return <CheckCircle2 className="h-4 w-4 text-primary" />
      case "occupied":
        return <XCircle className="h-4 w-4 text-destructive" />
      case "cleaning":
        return <Sparkles className="h-4 w-4 text-warning" />
      case "maintenance":
        return <Wrench className="h-4 w-4 text-muted-foreground" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-primary/20 text-primary border-0">Available</Badge>
      case "occupied":
        return <Badge variant="destructive">Occupied</Badge>
      case "cleaning":
        return <Badge className="bg-warning/20 text-warning border-0">Cleaning</Badge>
      case "maintenance":
        return <Badge variant="secondary">Maintenance</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const stats = {
    total: mockRooms.length,
    available: mockRooms.filter((r) => r.status === "available").length,
    occupied: mockRooms.filter((r) => r.status === "occupied").length,
    cleaning: mockRooms.filter((r) => r.status === "cleaning").length,
  }

  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Room Management</h1>
            <p className="text-muted-foreground">Manage all hotel rooms and their status</p>
          </div>
          <Dialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Room</DialogTitle>
                <DialogDescription>Add a new room to the hotel inventory</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Room Number</Label>
                  <Input placeholder="e.g., 101" />
                </div>
                <div className="grid gap-2">
                  <Label>Room Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="deluxe">Deluxe</SelectItem>
                      <SelectItem value="suite">Suite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Floor</Label>
                    <Input type="number" placeholder="1" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Beds</Label>
                    <Input type="number" placeholder="1" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Price per Night</Label>
                  <Input type="number" placeholder="0.00" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddRoomOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddRoomOpen(false)}>Add Room</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-chart-2/10">
                <BedDouble className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Rooms</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.available}</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-destructive/10">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.occupied}</p>
                <p className="text-xs text-muted-foreground">Occupied</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-warning/10">
                <Sparkles className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.cleaning}</p>
                <p className="text-xs text-muted-foreground">Cleaning</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-foreground">All Rooms</CardTitle>
                <CardDescription>View and manage room inventory</CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search rooms..."
                    className="pl-8 bg-background"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusTypes.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status === "All" ? "All Status" : status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredRooms.map((room) => (
                <Card key={room.id} className="bg-secondary/30 border-border hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(room.status)}
                        <span className="font-bold text-lg text-foreground">Room {room.id}</span>
                      </div>
                      {getStatusBadge(room.status)}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type</span>
                        <span className="text-foreground">{room.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Floor</span>
                        <span className="text-foreground">{room.floor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Beds</span>
                        <span className="text-foreground">{room.beds}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price</span>
                        <span className="text-foreground font-medium">${room.price}/night</span>
                      </div>
                      {room.guest && (
                        <div className="pt-2 border-t border-border">
                          <span className="text-muted-foreground">Guest: </span>
                          <span className="text-foreground">{room.guest}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1">
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
