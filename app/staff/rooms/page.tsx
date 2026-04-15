"use client"

import { useEffect, useState } from "react"
import {
  BedDouble,
  Search,
  Filter,
  Wifi,
  Tv,
  Wind,
  Wine,
  Bath,
  UtensilsCrossed,
  Sofa,
  MoreHorizontal,
  User,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getFrontOfficeRooms, updateFrontOfficeRoomStatus } from "@/lib/backend-api"
import type { Room, RoomStatus, RoomType } from "@/lib/types"

const amenityIcons: Record<string, typeof Wifi> = {
  WiFi: Wifi,
  TV: Tv,
  AC: Wind,
  "Mini Bar": Wine,
  Jacuzzi: Bath,
  Kitchen: UtensilsCrossed,
  "Living Room": Sofa,
}

const statusColors: Record<RoomStatus, string> = {
  available: "bg-success/10 border-success/30 text-success",
  occupied: "bg-primary/10 border-primary/30 text-primary",
  reserved: "bg-warning/10 border-warning/30 text-warning",
  cleaning: "bg-muted border-border text-muted-foreground",
  maintenance: "bg-destructive/10 border-destructive/30 text-destructive",
}

const typeLabels: Record<RoomType, string> = {
  standard: "Standard Room",
  deluxe: "Deluxe Room",
  suite: "Suite",
  presidential: "Presidential Suite",
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const roomData = await getFrontOfficeRooms()
        setRooms(roomData)
      } catch {
        setRooms([])
      }
    }

    load()
  }, [])

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.number.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || room.status === statusFilter
    const matchesType = typeFilter === "all" || room.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const handleStatusChange = (roomId: string, newStatus: RoomStatus) => {
    updateFrontOfficeRoomStatus(roomId, newStatus).catch(() => {})
    setRooms(rooms.map(r => r.id === roomId ? { ...r, status: newStatus } : r))
  }

  const handleViewDetails = (room: Room) => {
    setSelectedRoom(room)
    setIsDetailOpen(true)
  }

  const roomStats = {
    available: rooms.filter(r => r.status === "available").length,
    occupied: rooms.filter(r => r.status === "occupied").length,
    reserved: rooms.filter(r => r.status === "reserved").length,
    cleaning: rooms.filter(r => r.status === "cleaning").length,
    maintenance: rooms.filter(r => r.status === "maintenance").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Room Management</h1>
        <p className="text-muted-foreground">View and manage room status and availability</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        {Object.entries(roomStats).map(([status, count]) => (
          <Card key={status} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">{count}</p>
                  <p className="text-sm text-muted-foreground capitalize">{status}</p>
                </div>
                <div className={`h-3 w-3 rounded-full ${
                  status === "available" ? "bg-success" :
                  status === "occupied" ? "bg-primary" :
                  status === "reserved" ? "bg-warning" :
                  status === "maintenance" ? "bg-destructive" : "bg-muted-foreground"
                }`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-64 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-input"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="occupied">Occupied</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
            <SelectItem value="cleaning">Cleaning</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <BedDouble className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="deluxe">Deluxe</SelectItem>
            <SelectItem value="suite">Suite</SelectItem>
            <SelectItem value="presidential">Presidential</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Room Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredRooms.map((room) => (
          <Card 
            key={room.id} 
            className={`bg-card border-2 transition-all hover:shadow-lg cursor-pointer ${statusColors[room.status]}`}
            onClick={() => handleViewDetails(room)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Room {room.number}</CardTitle>
                  <CardDescription>{typeLabels[room.type]}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(room.id, "available"); }}>
                      Mark Available
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(room.id, "cleaning"); }}>
                      Mark Cleaning
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(room.id, "maintenance"); }}>
                      Mark Maintenance
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[room.status]}`}>
                  {room.status}
                </span>
                <span className="text-lg font-bold">${room.price}/night</span>
              </div>
              
              {room.guestName && (
                <div className="p-3 rounded-lg bg-background/50 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-3.5 w-3.5" />
                    <span className="font-medium">{room.guestName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{room.checkIn} - {room.checkOut}</span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {room.amenities.slice(0, 4).map((amenity) => {
                  const Icon = amenityIcons[amenity] || Wifi
                  return (
                    <div 
                      key={amenity} 
                      className="p-1.5 rounded bg-background/50"
                      title={amenity}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                  )
                })}
                {room.amenities.length > 4 && (
                  <div className="p-1.5 rounded bg-background/50 text-xs">
                    +{room.amenities.length - 4}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Room Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Room {selectedRoom?.number} Details</DialogTitle>
            <DialogDescription>{selectedRoom && typeLabels[selectedRoom.type]}</DialogDescription>
          </DialogHeader>
          {selectedRoom && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize ${statusColors[selectedRoom.status]}`}>
                  {selectedRoom.status}
                </span>
                <span className="text-2xl font-bold">${selectedRoom.price}<span className="text-sm font-normal text-muted-foreground">/night</span></span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Floor</p>
                  <p className="font-medium">{selectedRoom.floor}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Room Type</p>
                  <p className="font-medium capitalize">{selectedRoom.type}</p>
                </div>
              </div>

              {selectedRoom.guestName && (
                <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Current Guest</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {selectedRoom.guestName.split(" ").map(n => n[0]).join("")}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{selectedRoom.guestName}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedRoom.checkIn} - {selectedRoom.checkOut}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {selectedRoom.amenities.map((amenity) => {
                    const Icon = amenityIcons[amenity] || Wifi
                    return (
                      <div 
                        key={amenity} 
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border"
                      >
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="text-sm">{amenity}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                {selectedRoom.status === "available" && (
                  <Button className="flex-1">Create Reservation</Button>
                )}
                {selectedRoom.status === "occupied" && (
                  <Button className="flex-1">Process Check-out</Button>
                )}
                {selectedRoom.status === "reserved" && (
                  <Button className="flex-1">Process Check-in</Button>
                )}
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
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
