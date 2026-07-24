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
import { getFrontOfficeReservations, getFrontOfficeRooms, getHousekeepingTasks } from "@/lib/backend-api"
import type { HousekeepingTask, Reservation, Room } from "@/lib/types"

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

const formatDate = (value?: string) => {
  if (!value) return "N/A"

  const date = new Date(value)
  return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString("en-GB")
}

const calculateRemainingDays = (checkOut?: string) => {
  if (!checkOut) return 0

  const checkOutDate = new Date(checkOut)
  if (isNaN(checkOutDate.getTime())) return 0

  return Math.max(
    0,
    Math.ceil((checkOutDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  )
}

const getCheckoutStayStatus = (checkOut?: string, fallbackRemainingDays?: number, planCharges?: number, foodCharges?: number, discount?: number) => {
  const checkOutDate = checkOut ? new Date(checkOut) : null
  const timeStr = checkOutDate && !isNaN(checkOutDate.getTime())
    ? checkOutDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
    : ""

  if (!checkOut || !checkOutDate || isNaN(checkOutDate.getTime())) {
    const remainingDays = Number.isFinite(fallbackRemainingDays) ? Number(fallbackRemainingDays) : 0
    return {
      remainingDays,
      isCheckoutToday: remainingDays === 0,
      isOverstay: false,
      label: remainingDays === 0 ? "Checkout Today" : `${remainingDays} ${remainingDays === 1 ? "Day" : "Days"} Left`,
      className: remainingDays === 0 ? "text-amber-600" : "text-primary",
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const checkOutDateNoTime = new Date(checkOutDate)
  checkOutDateNoTime.setHours(0, 0, 0, 0)

  const dayDifference = Math.ceil((checkOutDateNoTime.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (dayDifference < 0) {
    const overstayNights = Math.abs(dayDifference)
    const nightlyRate = (Number(planCharges || 0) + Number(foodCharges || 0)) - Number(discount || 0)
    const overstayCost = overstayNights * nightlyRate

    return {
      remainingDays: dayDifference,
      isCheckoutToday: false,
      isOverstay: true,
      label: `Overstay: ${overstayNights} ${overstayNights === 1 ? "Night" : "Nights"} (${overstayCost > 0 ? `₹${overstayCost.toLocaleString()}` : "N/A"})`,
      className: "text-destructive",
      overstayNights,
      overstayCost
    }
  }

  if (dayDifference === 0) {
    return {
      remainingDays: 0,
      isCheckoutToday: true,
      isOverstay: false,
      label: `Checkout Today ${timeStr ? `(${timeStr})` : ""}`,
      className: "text-amber-600",
    }
  }

  if (dayDifference === 1) {
    return {
      remainingDays: 1,
      isCheckoutToday: false,
      isOverstay: false,
      label: `1 Day Left ${timeStr ? `(${timeStr})` : ""}`,
      className: "text-primary",
    }
  }

  return {
    remainingDays: dayDifference,
    isCheckoutToday: false,
    isOverstay: false,
    label: `${dayDifference} Days Left`,
    className: "text-primary",
  }
}

const buildRoomGuestDetails = (room: Room, reservations: Reservation[]): Room => {
  const roomId = room.id || (room as any)._id
  const roomNumber = room.number || (room as any).roomNumber

  // 1. Check if occupied (has checked-in reservation)
  const activeCheckin = reservations.find(r => 
    r.status === "checked-in" && 
    ((roomId && String(r.roomId || (r as any).room?._id || "") === String(roomId)) || 
     (roomNumber && String(r.roomNumber) === String(roomNumber)))
  )

  if (activeCheckin) {
    const checkOut = room.checkOut || activeCheckin.checkOut
    return {
      ...room,
      status: "occupied",
      guestName: room.guestName || activeCheckin.guestName,
      checkIn: room.checkIn || activeCheckin.checkIn,
      checkOut,
      bookingId: room.bookingId || activeCheckin.bookingNumber || activeCheckin.reservationId,
      phone: room.phone || activeCheckin.guestPhone,
      adults: room.adults ?? activeCheckin.adults,
      children: room.children ?? activeCheckin.children,
      remainingDays: room.remainingDays ?? calculateRemainingDays(checkOut),
      guestDetails: {
        ...room.guestDetails,
        name: room.guestDetails?.name || room.guestName || activeCheckin.guestName,
        phone: room.guestDetails?.phone || room.phone || activeCheckin.guestPhone,
        checkIn: room.guestDetails?.checkIn || room.checkIn || activeCheckin.checkIn,
        checkOut: room.guestDetails?.checkOut || checkOut,
        adults: room.guestDetails?.adults ?? room.adults ?? activeCheckin.adults,
        children: room.guestDetails?.children ?? room.children ?? activeCheckin.children,
        bookingId: room.guestDetails?.bookingId || room.bookingId || activeCheckin.bookingNumber || activeCheckin.reservationId,
        checkinId: room.guestDetails?.checkinId || room.checkinId,
        folioId: room.guestDetails?.folioId || room.folioId,
      }
    }
  }

  // 2. Check if reserved (has confirmed/no-show reservation)
  const activeReservation = reservations.find(r => 
    (String(r.status) === "confirmed" || String(r.status) === "no-show") && 
    ((roomId && String(r.roomId || (r as any).room?._id || "") === String(roomId)) || 
     (roomNumber && String(r.roomNumber) === String(roomNumber)))
  )

  if (activeReservation) {
    const checkOut = room.checkOut || activeReservation.checkOut
    return {
      ...room,
      status: "reserved",
      guestName: room.guestName || activeReservation.guestName,
      checkIn: room.checkIn || activeReservation.checkIn,
      checkOut,
      bookingId: room.bookingId || activeReservation.bookingNumber || activeReservation.reservationId,
      phone: room.phone || activeReservation.guestPhone,
      adults: room.adults ?? activeReservation.adults,
      children: room.children ?? activeReservation.children,
      guestDetails: {
        ...room.guestDetails,
        name: room.guestDetails?.name || room.guestName || activeReservation.guestName,
        phone: room.guestDetails?.phone || room.phone || activeReservation.guestPhone,
        checkIn: room.guestDetails?.checkIn || room.checkIn || activeReservation.checkIn,
        checkOut: room.guestDetails?.checkOut || checkOut,
        adults: room.guestDetails?.adults ?? room.adults ?? activeReservation.adults,
        children: room.guestDetails?.children ?? room.children ?? activeReservation.children,
        bookingId: room.guestDetails?.bookingId || room.bookingId || activeReservation.bookingNumber || activeReservation.reservationId,
        checkinId: room.guestDetails?.checkinId || room.checkinId,
        folioId: room.guestDetails?.folioId || room.folioId,
      }
    }
  }

  return room
}

const getDisplayStatus = (room: Room): Room["status"] =>
  room.hkStatus === "dirty" && room.status === "available" ? "cleaning" : room.status

export default function RoomDashboardPage() {
  const router = useRouter()
  const [rooms, setRooms] = useState<Room[]>([])
  const [housekeepingTasks, setHousekeepingTasks] = useState<HousekeepingTask[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const loadRooms = async (status = "all", search = "") => {
    setLoading(true)
    try {
      const [roomData, confirmedReservations, noShowReservations, checkedInReservations, taskData] = await Promise.all([
        getFrontOfficeRooms({ status, search }),
        getFrontOfficeReservations({ status: "confirmed" }),
        getFrontOfficeReservations({ status: "no-show" }),
        getFrontOfficeReservations({ status: "checked-in" }),
        getHousekeepingTasks().catch(() => [] as HousekeepingTask[]),
      ])

      const reservationData = [...confirmedReservations, ...noShowReservations, ...checkedInReservations]
      setRooms(roomData.map((room) => buildRoomGuestDetails(room, reservationData)))
      setHousekeepingTasks(taskData)
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
    const displayStatus = getDisplayStatus(room)

    if (displayStatus === "cleaning" || displayStatus === "maintenance") {
      router.push("/admin/housekeeping")
      return
    }

    if (room.status === "available" || room.status === "blocked") {
      router.push(`/admin/front-office/reception/check-in?roomId=${room.id}&roomNo=${room.number}`)

      return
    }
    if (room.status === "reserved") {
      router.push(`/admin/front-office/reception/check-in?reservationId=${room.guestDetails?.bookingId || room.bookingId}&roomNo=${room.number}`)
      return
    }
    if (room.status === "occupied") {
      const params = new URLSearchParams({ room: room.number })
      const folioId = room.guestDetails?.folioId || room.folioId
      const checkinId = room.guestDetails?.checkinId || room.checkinId
      const bookingId = room.guestDetails?.bookingId || room.bookingId
      if (folioId) params.set("folioId", folioId)
      if (checkinId) params.set("checkinId", checkinId)
      if (bookingId) params.set("bookingId", bookingId)
      router.push(`/admin/front-office/reception/check-out?${params.toString()}`)
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
          getDisplayStatus(room).toLowerCase().includes(query)
      )
    }

    if (filterStatus !== "all") {
      result.sort((a, b) => {
        const aStatus = getDisplayStatus(a)
        const bStatus = getDisplayStatus(b)

        if (aStatus === filterStatus && bStatus !== filterStatus) return -1
        if (aStatus !== filterStatus && bStatus === filterStatus) return 1
        return 0
      })
    }

    return result
  }, [rooms, searchQuery, filterStatus])

  const activeTaskByRoom = useMemo(() => {
    const lookup = new Map<string, HousekeepingTask>()

    housekeepingTasks
      .filter((task) => task.status !== "completed" && task.status !== "cancelled")
      .forEach((task) => {
        const keys = [task.room.id, task.room.roomNumber].filter(Boolean)

        keys.forEach((key) => {
          if (!lookup.has(key)) {
            lookup.set(key, task)
          }
        })
      })

    return lookup
  }, [housekeepingTasks])

  const roomCounts = rooms.reduce(
    (acc, room) => {
      const status = getDisplayStatus(room)
      acc[status] = (acc[status] || 0) + 1
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
                const displayStatus = getDisplayStatus(room)
                const activeTask = activeTaskByRoom.get(room.id) || activeTaskByRoom.get(room.number)
                const roomNote = activeTask?.notes?.trim()
                const checkoutStayStatus = getCheckoutStayStatus(
                  room.guestDetails?.checkOut || room.checkOut,
                  room.remainingDays,
                  room.planCharges,
                  room.foodCharges,
                  room.discount
                )
                const card = (
                  <Card
                    key={room.id}
                    className={`border-0 shadow-sm hover:shadow-md transition-all ${(displayStatus === "available" || displayStatus === "blocked" || displayStatus === "occupied" || displayStatus === "reserved" || displayStatus === "maintenance") ? "cursor-pointer" : ""}`}
                    onDoubleClick={() => handleRoomDoubleClick(room)}
                    style={{
                      backgroundColor: `${statusColors[displayStatus]}15`,
                      borderLeft: `5px solid ${statusColors[displayStatus]}`,
                    }}
                  >
                    <CardHeader className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">Room {room.number}</CardTitle>
                          <p className="text-sm text-muted-foreground">{room.type}</p>
                        </div>
                        <Badge className="capitalize" style={{ backgroundColor: statusColors[displayStatus], color: "white" }}>
                          {statusLabels[displayStatus] || displayStatus}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                      {(room.status === "occupied" || room.status === "reserved") && (
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-foreground truncate">
                            {room.guestName || room.guestDetails?.name || "Guest"}
                          </p>
                          {room.status === "occupied" ? (
                            <p className={`text-xs font-medium ${checkoutStayStatus.className}`}>
                              {checkoutStayStatus.label}
                            </p>
                          ) : (
                            <p className="text-xs font-medium text-blue-600">
                              Reserved
                            </p>
                          )}
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
                      {(displayStatus === "cleaning" || displayStatus === "maintenance") && roomNote && (
                        <div className="mt-3 rounded-md border border-border bg-background/70 px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Notes
                          </p>
                          <p className="mt-1 max-h-12 overflow-hidden whitespace-pre-wrap text-xs font-medium text-foreground">
                            {roomNote}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )

                if (room.status === "occupied" || room.status === "reserved") {
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
                              {room.status === "occupied" ? "Guest Details" : "Reserved Room"}
                            </p>

                            <p className="text-sm font-bold mt-1 text-gray-900">
                              Guest: {room.guestDetails?.name || room.guestName || "Guest"}
                            </p>

                            <p className="text-xs text-gray-500 mt-1">
                              {room.guestDetails?.phone || room.phone || "No phone provided"}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">

                            <div>
                              <p className="text-gray-500 font-medium">
                                {room.status === "occupied" ? "Check-In" : "From"}
                              </p>

                              <p className="font-semibold text-gray-900 mt-1">
                                {formatDate(room.guestDetails?.checkIn || room.checkIn)}
                              </p>
                            </div>

                            <div>
                              <p className="text-gray-500 font-medium">
                                {room.status === "occupied" ? "Check-Out" : "To"}
                              </p>

                              <p className="font-semibold text-gray-900 mt-1">
                                {formatDate(room.guestDetails?.checkOut || room.checkOut)}
                              </p>
                            </div>

                            <div>
                              <p className="text-gray-500 font-medium">
                                {room.status === "occupied" ? "Adults / Children" : "Guests"}
                              </p>

                              <p className="font-semibold text-gray-900 mt-1">
                                {room.guestDetails?.adults ?? room.adults ?? 0}
                                {" / "}
                                {room.guestDetails?.children ?? room.children ?? 0}
                              </p>
                            </div>

                            {room.status === "occupied" && (
                              <div>
                                <p className="text-gray-500 font-medium">
                                  Remaining
                                </p>

                                <p className={`font-bold mt-1 ${checkoutStayStatus.className}`}>
                                  {checkoutStayStatus.label}
                                </p>
                              </div>
                            )}

                          </div>

                          {/* Booking ID */}
                          <div className="pt-3 border-t border-gray-200">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                              {room.status === "occupied" ? "Booking ID" : "Reservation ID"}
                            </p>

                            <p className="text-xs font-mono font-semibold text-blue-600 mt-1">
                              {room.guestDetails?.bookingId || room.bookingId || "N/A"}
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
