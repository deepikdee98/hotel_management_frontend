"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BedDouble, Info, CheckCircle2, AlertTriangle, Hammer, Eraser, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { DashboardLayout } from "@/components/dashboard-layout"
import { getFrontOfficeRooms } from "@/lib/backend-api"
import { Room } from "@/lib/types"

const statusLabels: Record<Room["status"], string> = {
  available: "Available",
  occupied: "Occupied",
  reserved: "Reserved",
  maintenance: "Maintenance",
  cleaning: "Cleaning",
  blocked: "Blocked",
}

const statusColors: Record<Room["status"], string> = {
  available: "#10B981",
  occupied: "#EF4444",
  reserved: "#3B82F6",
  maintenance: "#F59E0B",
  cleaning: "#8B5CF6",
  blocked: "#6B7280",
}

const getStatusIcon = (status: Room["status"]) => {
  switch (status) {
    case "available": return <CheckCircle2 className="h-4 w-4" />
    case "occupied": return <BedDouble className="h-4 w-4" />
    case "reserved": return <Info className="h-4 w-4" />
    case "maintenance": return <Hammer className="h-4 w-4" />
    case "cleaning": return <Eraser className="h-4 w-4" />
    case "blocked": return <AlertTriangle className="h-4 w-4" />
    default: return <AlertTriangle className="h-4 w-4" />
  }
}

const getStatusImage = (status: Room["status"], roomNumber: string) => {
  const color = statusColors[status] || "#9CA3AF"
  const label = statusLabels[status] || status
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='160' viewBox='0 0 240 160'>
    <rect x='8' y='8' width='224' height='144' rx='20' fill='${color}' fill-opacity='0.15' stroke='${color}' stroke-width='4' />
    <rect x='24' y='32' width='80' height='48' rx='12' fill='${color}' />
    <rect x='118' y='32' width='98' height='48' rx='12' fill='#FFFFFF' fill-opacity='0.92' />
    <text x='64' y='26' text-anchor='middle' font-family='Inter, sans-serif' font-size='24' fill='${color}' font-weight='700'>Room</text>
    <text x='64' y='60' text-anchor='middle' font-family='Inter, sans-serif' font-size='36' fill='#FFFFFF' font-weight='700'>${roomNumber}</text>
    <text x='175' y='80' text-anchor='middle' font-family='Inter, sans-serif' font-size='18' fill='${color}' font-weight='700'>${label}</text>
    <circle cx='175' cy='115' r='16' fill='${color}' />
    <text x='175' y='120' text-anchor='middle' font-family='Inter, sans-serif' font-size='12' fill='#FFFFFF' font-weight='700'>${label[0]}</text>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export default function RoomDashboardPage() {
  const router = useRouter()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const loadRooms = async (status = "all", search = "") => {
    setLoading(true)
    try {
      const data = await getFrontOfficeRooms({ status, search })
      setRooms(data)
    } catch (error) {
      console.error("Failed to load room dashboard", error)
      setRooms([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRooms(filterStatus, searchQuery)
  }, [filterStatus, searchQuery])

  const handleRoomDoubleClick = (room: Room) => {
    if (room.status === "available" || room.status === "blocked") {
      router.push(`/admin/front-office/reception/check-in?roomId=${room.id}&roomNo=${room.number}`)

      return
    }
    if(room.status === "occupied") {
      router.push(`/admin/front-office/reception/check-out?room=${room.number}`)
    }
  }

  const filteredAndSortedRooms = useMemo(() => {
    let result = [...rooms]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (room) =>
          room.number.toLowerCase().includes(query) ||
          room.type.toLowerCase().includes(query) ||
          room.status.toLowerCase().includes(query)
      )
    }

    if (filterStatus !== "all") {
      result.sort((a, b) => {
        if (a.status === filterStatus && b.status !== filterStatus) return -1
        if (a.status !== filterStatus && b.status === filterStatus) return 1
        return 0
      })
    }

    return result
  }, [rooms, searchQuery, filterStatus])

  const roomCounts = rooms.reduce(
    (acc, room) => {
      acc[room.status] = (acc[room.status] || 0) + 1
      return acc
    },
    {} as Record<Room["status"], number>
  )

  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
      <TooltipProvider>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Room Dashboard</h1>
              <p className="text-muted-foreground">
                Visual room status overview with a status image for every room.
              </p>
            </div>
            <Button variant="outline" className="w-full md:w-auto" asChild>
              <Link href="/admin/front-office">
                <span className="flex items-center gap-2">
                  <BedDouble className="h-4 w-4" />
                  Back to Front Office
                </span>
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            {Object.entries(statusLabels).map(([status, label]) => (
              <Card
                key={status}
                className="border-0 shadow-sm hover:shadow-md transition-all"
                style={{
                  backgroundColor: `${statusColors[status as Room["status"]]}15`,
                  borderLeft: `${statusColors[status as Room["status"]]}`,
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground uppercase">{label}</p>
                      <p className="text-2xl font-bold text-foreground">{roomCounts[status as Room["status"]] || 0}</p>
                    </div>
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl text-white"
                      style={{
                        backgroundColor: statusColors[status as Room["status"]],
                      }}
                    >
                      {getStatusIcon(status as Room["status"])}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search and Filter Section */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by room number or type..."
                className="pl-10 bg-muted/50 border-border focus:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Filter Status:</span>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-[180px] bg-muted/50 border-border">
                  <SelectValue placeholder="All Rooms" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">All Rooms</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-6">
            {loading ? (
              <Card className="col-span-full bg-card border-border">
                <CardContent className="text-center text-muted-foreground">Loading rooms...</CardContent>
              </Card>
            ) : filteredAndSortedRooms.length === 0 ? (
              <Card className="col-span-full bg-card border-border">
                <CardContent className="text-center text-muted-foreground py-10">
                  No rooms found matching your criteria.
                </CardContent>
              </Card>
            ) : (
              filteredAndSortedRooms.map((room) => {
                const card = (
                  <Card
                    key={room.id}
                    className={`border-0 shadow-sm hover:shadow-md transition-all ${(room.status === "available" || room.status === "blocked" || room.status === "occupied") ? "cursor-pointer" : ""}`}
                    onDoubleClick={() => handleRoomDoubleClick(room)}
                    style={{
                      backgroundColor: `${statusColors[room.status]}15`,
                      borderLeft: `5px solid ${statusColors[room.status]}`,
                    }}
                  >
                    <CardHeader className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">Room {room.number}</CardTitle>
                          <p className="text-sm text-muted-foreground">{room.type}</p>
                        </div>
                        <Badge className="capitalize" style={{ backgroundColor: statusColors[room.status], color: "white" }}>
                          {statusLabels[room.status]}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                      {room.status === "occupied" && (
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-foreground truncate">{room.guestName}</p>
                          <p className="text-xs font-medium text-primary">
                            {room.remainingDays} {room.remainingDays === 1 ? "Day" : "Days"} Left
                          </p>
                        </div>
                      )}
                      {room.status === "blocked" && room.blockDetails && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Block Period
                          </p>

                          <p className="mt-1 text-xs font-semibold text-foreground">
                            {new Date(room.blockDetails.from).toLocaleDateString("en-GB")}
                            {" → "}
                            {new Date(room.blockDetails.to).toLocaleDateString("en-GB")}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )

                if (room.status === "occupied" && room.guestDetails) {
                  return (
                    <Tooltip key={room.id}>
                      <TooltipTrigger asChild>
                        {card}
                      </TooltipTrigger>

                      <TooltipContent
                        side="top"
                        className="
          p-4
          bg-white
          border
          border-gray-200
          shadow-2xl
          rounded-2xl
          min-w-[260px]
          text-gray-900
          animate-in
          fade-in-0
          zoom-in-95
        "
                      >
                        <div className="space-y-3">
                          <div className="pb-2 border-b border-gray-200">
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                              Guest Details
                            </p>

                            <p className="text-sm font-bold mt-1 text-gray-900">
                              {room.guestDetails?.name || "Guest"}
                            </p>

                            <p className="text-xs text-gray-500 mt-1">
                              {room.guestDetails?.phone || "No phone provided"}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">

                            <div>
                              <p className="text-gray-500 font-medium">
                                Check-In
                              </p>

                              <p className="font-semibold text-gray-900 mt-1">
                                {room.guestDetails?.checkIn && !isNaN(new Date(room.guestDetails.checkIn).getTime())
                                  ? new Date(room.guestDetails.checkIn).toLocaleDateString("en-GB")
                                  : "N/A"}
                              </p>
                            </div>

                            <div>
                              <p className="text-gray-500 font-medium">
                                Check-Out
                              </p>

                              <p className="font-semibold text-gray-900 mt-1">
                                {room.guestDetails?.checkOut && !isNaN(new Date(room.guestDetails.checkOut).getTime())
                                  ? new Date(room.guestDetails.checkOut).toLocaleDateString("en-GB")
                                  : "N/A"}
                              </p>
                            </div>

                            <div>
                              <p className="text-gray-500 font-medium">
                                Adults / Children
                              </p>

                              <p className="font-semibold text-gray-900 mt-1">
                                {room.guestDetails?.adults || 0}
                                {" / "}
                                {room.guestDetails?.children || 0}
                              </p>
                            </div>

                            <div>
                              <p className="text-gray-500 font-medium">
                                Remaining
                              </p>

                              <p className="font-bold text-green-600 mt-1">
                                {room.remainingDays !== undefined && !isNaN(room.remainingDays) ? room.remainingDays : (
                                  room.guestDetails?.checkOut && !isNaN(new Date(room.guestDetails.checkOut).getTime()) ? Math.max(
                                    0,
                                    Math.ceil(
                                      (
                                        new Date(
                                          room.guestDetails.checkOut
                                        ).getTime() - Date.now()
                                      ) /
                                      (1000 * 60 * 60 * 24)
                                    )
                                  ) : 0
                                )}{" "}
                                Days
                              </p>
                            </div>

                          </div>

                          {/* Booking ID */}
                          <div className="pt-3 border-t border-gray-200">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                              Booking ID
                            </p>

                            <p className="text-xs font-mono font-semibold text-gray-900 mt-1">
                              {room.guestDetails?.bookingId || "N/A"}
                            </p>
                          </div>

                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                if (room.status === "blocked" && room.blockDetails) {
                  return (
                    <Tooltip key={room.id}>
                      <TooltipTrigger asChild>
                        {card}
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="p-4 bg-white border border-gray-200 shadow-2xl rounded-xl max-w-xs text-gray-900"
                      >
                        <div className="space-y-3">

                          <p className="text-sm font-bold text-red-500 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Room Blocked
                          </p>

                          <div className="space-y-2 text-xs">

                            <div className="flex justify-between gap-4">
                              <span className="text-gray-500 font-medium">
                                From:
                              </span>

                              <span className="font-semibold text-gray-900">
                                {new Date(room.blockDetails.from).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="flex justify-between gap-4">
                              <span className="text-gray-500 font-medium">
                                To:
                              </span>

                              <span className="font-semibold text-gray-900">
                                {new Date(room.blockDetails.to).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="pt-2 border-t border-gray-200">
                              <p className="text-gray-500 mb-1">
                                Reason:
                              </p>

                              <p className="text-gray-800 italic font-medium">
                                {room.blockDetails.reason || "No reason provided"}
                              </p>
                            </div>

                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return card
              })
            )}
          </div>
        </div>
      </TooltipProvider>
    </DashboardLayout>
  )
}
