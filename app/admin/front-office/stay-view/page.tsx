"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash, 
  Check, 
  X, 
  Info, 
  Printer, 
  Loader2,
  RefreshCw,
  MoreVertical,
  LogIn,
  LogOut,
  CalendarDays,
  Settings
} from "lucide-react"
import { 
  getStayViewData, 
  updateFrontOfficeReservation, 
  createFrontOfficeReservation, 
  updateFrontOfficeReservationStatus, 
  getSetupRoomTypes, 
  getSetupRatePlans, 
  getGRCard,
  getSetupOptions
} from "@/lib/backend-api"
import { saveGRCardPrintData } from "@/lib/gr-card-utils"
import { format } from "date-fns"

// Helper functions for date calculations
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

const differenceInDays = (d1: Date, d2: Date): number => {
  const t1 = new Date(d1).setHours(0,0,0,0)
  const t2 = new Date(d2).setHours(0,0,0,0)
  const timeDiff = t1 - t2
  return Math.round(timeDiff / (1000 * 3600 * 24))
}

const formatLocalDate = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const parseSafeDate = (val: any): Date => {
  if (!val) return new Date()
  if (val instanceof Date) return val
  
  const valStr = String(val)
  const match = valStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    const y = Number(match[1])
    const m = Number(match[2])
    const d = Number(match[3])
    return new Date(y, m - 1, d, 0, 0, 0, 0)
  }
  
  return new Date(valStr)
}

const parseLocalDate = (dateStr: string): Date => {
  return parseSafeDate(dateStr)
}

const formatDayHeader = (date: Date): { dayName: string; dayNum: string; isWeekend: boolean } => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  return {
    dayName: days[date.getDay()],
    dayNum: String(date.getDate()).padStart(2, '0'),
    isWeekend: date.getDay() === 0 || date.getDay() === 6
  }
}

export default function StayViewPage() {
  const router = useRouter()
  
  // Timeline dates state
  const [timelineStartStr, setTimelineStartStr] = useState<string>(() => formatLocalDate(new Date()))
  const [visibleDays, setVisibleDays] = useState<number>(15)
  
  // Data state
  const [rooms, setRooms] = useState<any[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [blocks, setBlocks] = useState<any[]>([])
  const [dailyStats, setDailyStats] = useState<Record<string, any>>({})
  
  const [roomTypes, setRoomTypes] = useState<any[]>([])
  const [ratePlans, setRatePlans] = useState<any[]>([])
  
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)

  // Filters
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>("all")
  const [ratePlanFilter, setRatePlanFilter] = useState<string>("all")

  // Collapsible room type sections tracking
  const [collapsedTypes, setCollapsedTypes] = useState<Record<string, boolean>>({})

  // Setup Options for Forms
  const [paymentModeOptions, setPaymentModeOptions] = useState<any[]>([])
  const [idProofOptions, setIdProofOptions] = useState<any[]>([])
  const [businessSourceOptions, setBusinessSourceOptions] = useState<any[]>([])

  // Selection/Dialog States
  const [selectedReservation, setSelectedReservation] = useState<any>(null)
  const [isViewOpen, setIsViewOpen] = useState<boolean>(false)
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false)
  const [isNewOpen, setIsNewOpen] = useState<boolean>(false)
  const [newResDetails, setNewResDetails] = useState<any>(null) // Stores { roomId, checkIn, checkOut } if slot clicked

  // Drag and drop states
  const [dragState, setDragState] = useState<{
    resId: string
    dragType: "left" | "right" | "move"
    originalCheckIn: Date
    originalCheckOut: Date
    roomId: string
    startX: number
    startY: number
    deltaDays: number
    deltaRooms: number
  } | null>(null)

  const [ghostOverlay, setGhostOverlay] = useState<{
    resId: string
    dragType: "left" | "right" | "move"
    checkIn: string
    checkOut: string
    roomId: string
  } | null>(null)

  // Rich Hover Tooltip State
  const [hoveredRes, setHoveredRes] = useState<any>(null)
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null)

  // Right-click context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    reservation: any
  } | null>(null)

  // Form inputs state
  const [editFormData, setEditFormData] = useState<any>({
    id: "",
    guestName: "",
    phone: "",
    email: "",
    checkInDate: "",
    checkOutDate: "",
    adults: "1",
    children: "0",
    extraBeds: "0",
    roomType: "",
    roomNumber: "",
    room: "",
    ratePlan: "",
    bookingSource: "",
    advanceAmount: "",
    paymentMode: "",
    totalAmount: ""
  })

  const [newFormData, setNewFormData] = useState<any>({
    guestName: "",
    phone: "",
    email: "",
    idProofType: "",
    idProofNumber: "",
    checkInDate: "",
    checkOutDate: "",
    adults: "1",
    children: "0",
    extraBeds: "0",
    roomType: "",
    roomNumber: "",
    room: "",
    ratePlan: "",
    bookingSource: "",
    advanceAmount: "0",
    paymentMode: "",
    totalAmount: "0"
  })

  // Size configurations
  const colWidth = 72 // Pixels per column day
  const rowHeight = 64 // Pixels per room row

  // Parse visible dates range
  const timelineStartDate = useMemo(() => parseLocalDate(timelineStartStr), [timelineStartStr])
  
  const visibleDates = useMemo(() => {
    const dates: Date[] = []
    for (let i = 0; i < visibleDays; i++) {
      dates.push(addDays(timelineStartDate, i))
    }
    return dates
  }, [timelineStartDate, visibleDays])

  const timelineEndDate = useMemo(() => {
    return addDays(timelineStartDate, visibleDays)
  }, [timelineStartDate, visibleDays])

  // Load setup data
  useEffect(() => {
    const loadSetup = async () => {
      try {
        const [rtData, rpData, pmData, idData, bsData] = await Promise.all([
          getSetupRoomTypes(),
          getSetupRatePlans(),
          getSetupOptions("paymentMode").catch(() => []),
          getSetupOptions("idProof").catch(() => []),
          getSetupOptions("businessSource").catch(() => [])
        ])
        setRoomTypes(rtData || [])
        setRatePlans(rpData || [])
        setPaymentModeOptions(pmData || [])
        setIdProofOptions(idData || [])
        setBusinessSourceOptions(bsData || [])
      } catch (err) {
        console.error("Failed to load setup options:", err)
      }
    }
    loadSetup()
  }, [])

  // Load Stay View timeline data
  const fetchData = async () => {
    setIsLoading(true)
    try {
      const endStr = formatLocalDate(timelineEndDate)
      const res = await getStayViewData(timelineStartStr, endStr, roomTypeFilter, searchQuery)
      if (res.success && res.data) {
        setRooms(res.data.rooms || [])
        setReservations(res.data.reservations || [])
        setBlocks(res.data.blocks || [])
        setDailyStats(res.data.dailyStats || {})
      } else {
        toast.error("Failed to fetch timeline data")
      }
    } catch (err) {
      console.error(err)
      toast.error("Error fetching stay view timeline data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [timelineStartStr, visibleDays, roomTypeFilter, searchQuery])

  // Status pills live calculations
  const statusCounts = useMemo(() => {
    const todayStr = formatLocalDate(new Date())

    // Count how many rooms have active check-ins today
    const occupiedRoomIds = new Set(
      reservations
        .filter(r => r.status === "checked-in")
        .map(r => String(r.roomId || r.room?._id || r.room || ""))
        .filter(Boolean)
    )

    // Count how many rooms have confirmed/no-show reservations in the visible range
    const reservedRoomIds = new Set(
      reservations
        .filter(r => r.status === "confirmed" || r.status === "no-show")
        .map(r => String(r.roomId || r.room?._id || r.room || ""))
        .filter(Boolean)
    )

    // Count blocked rooms in visible range
    const blockedRoomIds = new Set(
      blocks
        .filter(b => b.isActive)
        .map(b => String(b.room))
        .filter(Boolean)
    )

    const dirtyRoomsCount = rooms.filter(r => 
      String(r.hkStatus).toLowerCase() === "dirty" || 
      String(r.hkStatus).toLowerCase() === "cleaning"
    ).length

    return {
      total: rooms.length,
      vacant: Math.max(0, rooms.length - occupiedRoomIds.size - blockedRoomIds.size),
      occupied: occupiedRoomIds.size,
      reserved: reservedRoomIds.size,
      blocked: blockedRoomIds.size,
      dueOut: reservations.filter(r => r.status === "checked-in" && (r.checkOut || r.checkOutDate) === todayStr).length,
      dirty: dirtyRoomsCount
    }
  }, [rooms, reservations, blocks])

  // Filtered rooms based on Room Type, Search AND Top Status Pill Selected
  const filteredRooms = useMemo(() => {
    const todayStr = formatLocalDate(new Date())
    
    return rooms.filter(room => {
      const matchesType = roomTypeFilter === "all" || String(room.roomType?._id || room.roomType || "") === roomTypeFilter
      const matchesSearch = !searchQuery || room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
      
      if (!matchesType || !matchesSearch) return false

      const roomId = String(room._id)

      // Status Pill Filter logic
      if (activeStatusFilter === "vacant") {
        const isOccupied = reservations.some(r => 
          String(r.roomId || r.room?._id || r.room || "") === roomId && 
          r.status === "checked-in"
        )
        const isBlocked = blocks.some(b => 
          String(b.room) === roomId && 
          b.isActive
        )
        return !isOccupied && !isBlocked
      }
      
      if (activeStatusFilter === "occupied") {
        return reservations.some(r => 
          String(r.roomId || r.room?._id || r.room || "") === roomId && 
          r.status === "checked-in"
        )
      }
      
      if (activeStatusFilter === "reserved") {
        return reservations.some(r => 
          String(r.roomId || r.room?._id || r.room || "") === roomId && 
          (r.status === "confirmed" || r.status === "no-show")
        )
      }
      
      if (activeStatusFilter === "blocked") {
        return blocks.some(b => 
          String(b.room) === roomId && 
          b.isActive
        )
      }
      
      if (activeStatusFilter === "dirty") {
        return String(room.hkStatus).toLowerCase() === "dirty" || String(room.hkStatus).toLowerCase() === "cleaning"
      }
      
      if (activeStatusFilter === "due-out") {
        return reservations.some(r => 
          String(r.roomId || r.room?._id || r.room || "") === roomId && 
          r.status === "checked-in" && 
          (r.checkOut || r.checkOutDate) === todayStr
        )
      }

      return true
    })
  }, [rooms, reservations, blocks, roomTypeFilter, searchQuery, activeStatusFilter])

  // Group rooms by Room Type
  const roomGroups = useMemo(() => {
    const groups: Array<{ typeId: string; typeName: string; rooms: any[] }> = []
    
    filteredRooms.forEach(room => {
      const typeId = String(room.roomType?._id || room.roomType || "other")
      const typeName = room.roomType?.name || room.type || "Other Rooms"
      
      let group = groups.find(g => g.typeId === typeId)
      if (!group) {
        group = { typeId, typeName, rooms: [] }
        groups.push(group)
      }
      group.rooms.push(room)
    })
    
    return groups
  }, [filteredRooms])

  // Flattened expanded rooms for calculating row height offsets
  const expandedRooms = useMemo(() => {
    const list: any[] = []
    roomGroups.forEach(group => {
      if (!collapsedTypes[group.typeId]) {
        list.push(...group.rooms)
      }
    })
    return list
  }, [roomGroups, collapsedTypes])

  // Map room _id to vertical cumulative top pixel coordinates (group headers: 40px, room rows: 64px)
  const roomTopOffsets = useMemo(() => {
    const map = new Map<string, number>()
    let currentTop = 0
    
    roomGroups.forEach(group => {
      // Group header height: 40px
      currentTop += 40
      
      if (!collapsedTypes[group.typeId]) {
        group.rooms.forEach(room => {
          map.set(String(room._id), currentTop)
          // Room row height: 64px
          currentTop += 64
        })
      }
    })
    
    return map
  }, [roomGroups, collapsedTypes])

  // Map rooms to row indexes for quick drag checks
  const roomRowIndexMap = useMemo(() => {
    const map = new Map<string, number>()
    expandedRooms.forEach((r, idx) => {
      map.set(String(r._id), idx)
    })
    return map
  }, [expandedRooms])

  // Filtered reservations for client-side search overlay (guest names search highlight)
  const guestSearchMatchIds = useMemo(() => {
    if (!searchQuery) return new Set<string>()
    const query = searchQuery.toLowerCase()
    const matches = reservations.filter(r => 
      r.guestName.toLowerCase().includes(query) ||
      (r.bookingNumber && r.bookingNumber.toLowerCase().includes(query)) ||
      (r.roomNumber && r.roomNumber.toLowerCase().includes(query))
    )
    return new Set<string>(matches.map(m => String(m.id || m._id || '')))
  }, [reservations, searchQuery])

  const toggleTypeCollapse = (typeId: string) => {
    setCollapsedTypes((prev: any) => ({
      ...prev,
      [typeId]: !prev[typeId]
    }))
  }

  // Horizontal navigate timeline helpers
  const handleShiftTimeline = (days: number) => {
    const start = parseLocalDate(timelineStartStr)
    const newStart = addDays(start, days)
    setTimelineStartStr(formatLocalDate(newStart))
  }

  // Calculate pricing estimates on reservation form check
  const calculateEstimates = (checkInStr: string, checkOutStr: string, roomTypeId: string) => {
    if (!checkInStr || !checkOutStr || !roomTypeId) return { roomCharges: 0, taxes: 0, total: 0 }
    
    const dIn = parseLocalDate(checkInStr)
    const dOut = parseLocalDate(checkOutStr)
    const nights = differenceInDays(dOut, dIn)
    
    if (nights <= 0) return { roomCharges: 0, taxes: 0, total: 0 }
    
    const rType = roomTypes.find(rt => String(rt._id || rt.id) === roomTypeId)
    const rate = Number(rType?.baseRate || rType?.rate || 0)
    
    const roomCharges = rate * nights
    const taxes = (roomCharges * 12) / 100
    const total = roomCharges + taxes
    
    return { roomCharges, taxes, total }
  }

  // Calculate rate based on room type and selected rate plan filter
  const getRateForDate = (roomTypeId: string) => {
    const rType = roomTypes.find(rt => String(rt._id || rt.id) === roomTypeId)
    if (!rType) return 3499
    
    let rate = Number(rType.baseRate || rType.rate || 3499)
    if (ratePlanFilter && ratePlanFilter !== "all") {
      const plan = ratePlans.find(rp => String(rp._id || rp.id) === ratePlanFilter)
      if (plan) {
        const planName = String(plan.name || "").toUpperCase()
        if (planName.includes("CP")) rate += 250
        else if (planName.includes("MAP")) rate += 600
        else if (planName.includes("AP")) rate += 1000
      }
    }
    return rate
  }

  // Calculate dynamic stats per room type group for date column header cells
  const getGroupStatForDate = (typeId: string, date: Date) => {
    const groupRooms = rooms.filter(r => String(r.roomType?._id || r.roomType || "") === typeId)
    const groupRoomIds = new Set(groupRooms.map(r => String(r._id)))
    
    if (groupRooms.length === 0) return { available: 0, price: 3499 }

    const busyRooms = new Set<string>()
    const dateStr = formatLocalDate(date)
    
    reservations.forEach(resv => {
      if (!resv.roomId && !resv.room?._id && !resv.room) return
      const resRoomId = String(resv.roomId || resv.room?._id || resv.room || "")
      if (!groupRoomIds.has(resRoomId)) return

      const checkIn = parseSafeDate(resv.checkIn || resv.checkInDate)
      const checkOut = parseSafeDate(resv.checkOut || resv.checkOutDate)
      
      const dTime = date.getTime()
      if (dTime >= checkIn.getTime() && dTime < checkOut.getTime()) {
        busyRooms.add(resRoomId)
      }
    })

    blocks.forEach(blk => {
      const blkRoomId = String(blk.room)
      if (!groupRoomIds.has(blkRoomId) || !blk.isActive) return

      const bFrom = parseSafeDate(blk.from)
      const bTo = parseSafeDate(blk.to)
      
      const dTime = date.getTime()
      if (dTime >= bFrom.getTime() && dTime < bTo.getTime()) {
        busyRooms.add(blkRoomId)
      }
    })

    const available = Math.max(0, groupRooms.length - busyRooms.size)
    const price = getRateForDate(typeId)

    return { available, price }
  }

  // Handle slot click (prefill creation dialog)
  const handleCellClick = (room: any, date: Date) => {
    const checkIn = formatLocalDate(date)
    const checkOut = formatLocalDate(addDays(date, 1))
    
    setNewResDetails({ roomId: room._id, roomNo: room.roomNumber, roomTypeId: room.roomType?._id })
    
    const roomType = String(room.roomType?._id || "")
    const estimates = calculateEstimates(checkIn, checkOut, roomType)
    
    setNewFormData({
      guestName: "",
      phone: "",
      email: "",
      idProofType: idProofOptions[0]?.value || "Aadhaar Card",
      idProofNumber: "",
      checkInDate: checkIn,
      checkOutDate: checkOut,
      adults: "1",
      children: "0",
      extraBeds: "0",
      roomType: roomType,
      roomNumber: room.roomNumber,
      room: room._id,
      ratePlan: ratePlans[0]?._id || "",
      bookingSource: businessSourceOptions[0]?.value || "Walk-in",
      advanceAmount: "0",
      paymentMode: paymentModeOptions[0]?.value || "Cash",
      totalAmount: String(estimates.total)
    })
    setIsNewOpen(true)
  }

  // Create reservation action
  const handleCreateReservation = async () => {
    if (!newFormData.guestName.trim() || !newFormData.phone.trim() || !newFormData.checkInDate || !newFormData.checkOutDate) {
      toast.error("Please fill in all required fields")
      return
    }
    
    setIsSaving(true)
    try {
      const payload = {
        ...newFormData,
        adults: Number(newFormData.adults || 1),
        children: Number(newFormData.children || 0),
        extraBeds: Number(newFormData.extraBeds || 0),
        advanceAmount: Number(newFormData.advanceAmount || 0),
        totalAmount: Number(newFormData.totalAmount || 0)
      }
      
      const res = (await createFrontOfficeReservation(payload)) as any
      if (res && (res.reservation || (res.message && res.message.includes("success")))) {
        toast.success("Reservation created successfully")
        setIsNewOpen(false)
        fetchData()
      } else {
        toast.error(res.message || "Failed to create reservation")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to create reservation")
    } finally {
      setIsSaving(false)
    }
  }

  // Edit action
  const handleEditOpen = (res: any) => {
    setSelectedReservation(res)
    setEditFormData({
      id: res.id || res._id,
      guestName: res.guestName,
      phone: res.guestPhone,
      email: res.guestEmail,
      checkInDate: res.checkIn,
      checkOutDate: res.checkOut,
      adults: String(res.adults || 1),
      children: String(res.children || 0),
      extraBeds: String(res.extraBeds || 0),
      roomType: String(res.roomType?._id || res.roomType || ""),
      roomNumber: res.roomNumber,
      room: String(res.roomId || res.room?._id || res.room || ""),
      ratePlan: String(res.ratePlan || ""),
      bookingSource: String(res.bookingSource || ""),
      advanceAmount: String(res.paidAmount || 0),
      paymentMode: String(res.paymentMode || ""),
      totalAmount: String(res.totalAmount || 0)
    })
    setIsViewOpen(false)
    setIsEditOpen(true)
  }

  // Save edited details
  const handleSaveEdit = async () => {
    if (!editFormData.guestName.trim() || !editFormData.phone.trim() || !editFormData.checkInDate || !editFormData.checkOutDate) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        ...editFormData,
        adults: Number(editFormData.adults || 1),
        children: Number(editFormData.children || 0),
        extraBeds: Number(editFormData.extraBeds || 0),
        advanceAmount: Number(editFormData.advanceAmount || 0),
        totalAmount: Number(editFormData.totalAmount || 0)
      }
      
      const res = (await updateFrontOfficeReservation(editFormData.id, payload)) as any
      if (res && res.reservation) {
        toast.success("Reservation details updated")
        setIsEditOpen(false)
        fetchData()
      } else {
        toast.error(res.message || "Failed to update reservation")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to update reservation")
    } finally {
      setIsSaving(false)
    }
  }

  // Cancel reservation
  const handleCancelReservation = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel this reservation?")) return
    try {
      const res = (await updateFrontOfficeReservationStatus(id, "cancelled")) as any
      if (res && (res.reservation || (res.message && res.message.includes("success")))) {
        toast.success("Reservation cancelled successfully")
        setContextMenu(null)
        setIsViewOpen(false)
        fetchData()
      } else {
        toast.error(res.message || "Failed to cancel reservation")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel reservation")
    }
  }

  // Extend checkout by 1 night quickly
  const handleQuickExtendStay = async (resv: any) => {
    try {
      const currentOut = parseSafeDate(resv.checkOut || resv.checkOutDate)
      const extendedOut = formatLocalDate(addDays(currentOut, 1))
      const currentNights = differenceInDays(parseSafeDate(resv.checkOut || resv.checkOutDate), parseSafeDate(resv.checkIn || resv.checkInDate))
      const nightRate = resv.totalAmount / currentNights
      
      const payload = {
        checkOutDate: extendedOut,
        totalAmount: resv.totalAmount + nightRate
      }
      
      const res = (await updateFrontOfficeReservation(resv.id, payload)) as any
      if (res && res.reservation) {
        toast.success(`Extended stay for ${resv.guestName} to ${extendedOut}`)
        fetchData()
      } else {
        toast.error(res.message || "Failed to extend stay")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to extend stay")
    } finally {
      setContextMenu(null)
    }
  }

  // Print Guest Registration Card helper
  const handlePrintGRCard = async (resv: any) => {
    const rId = resv.roomId || resv.room?._id || resv.room
    if (!rId) {
      toast.error("Room ID not found for this guest")
      return
    }
    
    try {
      const grCard = await getGRCard(rId)
      if (grCard) {
        saveGRCardPrintData(grCard)
        window.open("/admin/front-office/reception/gr-card", "_blank")
      } else {
        toast.error("Failed to load registration card details")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to load registration card")
    } finally {
      setContextMenu(null)
    }
  }

  // Drag and Drop validation check helper (client-side)
  const validateMoveLocal = (resvId: string, roomId: string, checkInDate: Date, checkOutDate: Date, status: string): { valid: boolean; message?: string } => {
    // 1. Validate target dates
    if (checkInDate >= checkOutDate) {
      return { valid: false, message: "Check-out date must be after check-in date" }
    }

    // 2. Checked-in guests checkout constraints (prevent setting checkout in past)
    if (status === "checked-in") {
      const today = new Date()
      today.setHours(0,0,0,0)
      if (checkOutDate < today) {
        return { valid: false, message: "For in-house checked-in guests, checkout date cannot be set in the past." }
      }
    }

    // 3. Validate blocks overlap
    const blockOverlap = blocks.some(b => {
      if (String(b.room) !== roomId || !b.isActive) return false
      return parseSafeDate(b.from) < checkOutDate && parseSafeDate(b.to) > checkInDate
    })
    if (blockOverlap) {
      return { valid: false, message: "Room is blocked for maintenance or special hold during these dates." }
    }

    // 4. Validate reservation overlap
    const resvOverlap = reservations.some(r => {
      const rId = r.id || r._id
      if (String(rId) === String(resvId)) return false // exclude self
      
      const rRoomId = String(r.roomId || r.room?._id || r.room || '')
      if (rRoomId !== roomId) return false
      
      return parseSafeDate(r.checkIn || r.checkInDate) < checkOutDate && parseSafeDate(r.checkOut || r.checkOutDate) > checkInDate
    })
    if (resvOverlap) {
      return { valid: false, message: "This room is already reserved for the selected date range." }
    }

    return { valid: true }
  }

  // Hover Tooltip Position Calculations
  const handleMouseEnter = (e: React.MouseEvent, resv: any) => {
    const barElement = e.currentTarget as HTMLElement
    const rect = barElement.getBoundingClientRect()
    const parentContainer = barElement.parentElement as HTMLElement
    const parentRect = parentContainer.getBoundingClientRect()

    // Position it at the horizontal center, above the reservation bar
    setHoverPosition({
      x: rect.left - parentRect.left + rect.width / 2,
      y: rect.top - parentRect.top - 58 // Position 58px above the bar
    })
    setHoveredRes(resv)
  }

  const handleMouseLeave = () => {
    setHoveredRes(null)
    setHoverPosition(null)
  }

  // Drag handles mouse events
  const handleDragStart = (e: React.MouseEvent, resv: any, type: "left" | "right" | "move") => {
    e.preventDefault()
    e.stopPropagation()

    setDragState({
      resId: resv.id,
      dragType: type,
      originalCheckIn: parseSafeDate(resv.checkIn || resv.checkInDate),
      originalCheckOut: parseSafeDate(resv.checkOut || resv.checkOutDate),
      roomId: String(resv.roomId || resv.room?._id || resv.room || ""),
      startX: e.clientX,
      startY: e.clientY,
      deltaDays: 0,
      deltaRooms: 0
    })

    setGhostOverlay({
      resId: resv.id,
      dragType: type,
      checkIn: formatLocalDate(parseSafeDate(resv.checkIn || resv.checkInDate)),
      checkOut: formatLocalDate(parseSafeDate(resv.checkOut || resv.checkOutDate)),
      roomId: String(resv.roomId || resv.room?._id || resv.room || "")
    })

    window.addEventListener("mousemove", handleDragMove)
    window.addEventListener("mouseup", handleDragEnd)
  }

  const handleDragMove = (e: MouseEvent) => {
    if (!dragState) return

    const deltaX = e.clientX - dragState.startX
    const deltaY = e.clientY - dragState.startY

    const days = Math.round(deltaX / colWidth)
    const roomsDelta = Math.round(deltaY / rowHeight)

    let nextCheckIn = dragState.originalCheckIn
    let nextCheckOut = dragState.originalCheckOut
    let nextRoomId = dragState.roomId

    const originalRes = reservations.find(r => String(r.id || r._id) === String(dragState.resId))
    const status = originalRes ? originalRes.status : "confirmed"

    if (dragState.dragType === "left") {
      nextCheckIn = addDays(dragState.originalCheckIn, days)
      if (nextCheckIn >= dragState.originalCheckOut) {
        nextCheckIn = addDays(dragState.originalCheckOut, -1)
      }
    } else if (dragState.dragType === "right") {
      nextCheckOut = addDays(dragState.originalCheckOut, days)
      if (nextCheckOut <= dragState.originalCheckIn) {
        nextCheckOut = addDays(dragState.originalCheckIn, 1)
      }
    } else if (dragState.dragType === "move") {
      nextCheckIn = addDays(dragState.originalCheckIn, days)
      nextCheckOut = addDays(dragState.originalCheckOut, days)
      
      // Determine vertical room row change
      const currentIdx = roomRowIndexMap.get(dragState.roomId) ?? 0
      const targetIdx = Math.max(0, Math.min(expandedRooms.length - 1, currentIdx + roomsDelta))
      const targetRoom = expandedRooms[targetIdx]
      if (targetRoom) {
        nextRoomId = String(targetRoom._id)
      }
    }

    setDragState((prev: any) => prev ? {
      ...prev,
      deltaDays: days,
      deltaRooms: roomsDelta
    } : null)

    setGhostOverlay((prev: any) => prev ? {
      ...prev,
      checkIn: formatLocalDate(nextCheckIn),
      checkOut: formatLocalDate(nextCheckOut),
      roomId: nextRoomId
    } : null)
  }

  const handleDragEnd = async () => {
    window.removeEventListener("mousemove", handleDragMove)
    window.removeEventListener("mouseup", handleDragEnd)

    if (!dragState || !ghostOverlay) {
      setDragState(null)
      setGhostOverlay(null)
      return
    }

    const resId = dragState.resId
    const targetRoomId = ghostOverlay.roomId
    const targetCheckIn = ghostOverlay.checkIn
    const targetCheckOut = ghostOverlay.checkOut
    
    // Find target room number
    const targetRoom = rooms.find(r => String(r._id) === targetRoomId)
    const targetRoomNo = targetRoom ? targetRoom.roomNumber : ""

    setDragState(null)
    setGhostOverlay(null)

    // Check if anything actually changed
    const originalRes = reservations.find(r => String(r.id || r._id) === String(resId))
    const unchanged = originalRes && 
      (originalRes.checkIn || originalRes.checkInDate) === targetCheckIn && 
      (originalRes.checkOut || originalRes.checkOutDate) === targetCheckOut && 
      String(originalRes.roomId || originalRes.room?._id || originalRes.room || '') === targetRoomId

    if (unchanged) return

    const status = originalRes ? originalRes.status : "confirmed"

    // 1. Local validation (enforce early checkout check)
    const validation = validateMoveLocal(resId, targetRoomId, parseLocalDate(targetCheckIn), parseLocalDate(targetCheckOut), status)
    if (!validation.valid) {
      toast.error(validation.message || "Invalid dates or room move operation")
      return
    }

    // 2. Perform optimistic update on client UI
    const originalReservations = [...reservations]
    setReservations((prev: any[]) => prev.map(r => {
      if (String(r.id || r._id) === String(resId)) {
        return {
          ...r,
          checkIn: targetCheckIn,
          checkOut: targetCheckOut,
          roomId: targetRoomId,
          roomNumber: targetRoomNo,
          room: targetRoom
        }
      }
      return r
    }))

    // 3. Make API request to save
    try {
      const payload: any = {
        checkInDate: targetCheckIn,
        checkOutDate: targetCheckOut,
        room: targetRoomId,
        roomNumber: targetRoomNo
      }
      
      const res = (await updateFrontOfficeReservation(resId, payload)) as any
      if (res && res.reservation) {
        toast.success("Stay timeline updated successfully")
        fetchData() // silent reload to sync statuses
      } else {
        // Rollback
        setReservations(originalReservations)
        toast.error(res.message || "Failed to update stay timeline")
      }
    } catch (err: any) {
      // Rollback
      setReservations(originalReservations)
      toast.error(err.message || "Failed to save drag modifications")
    }
  }

  // Right-click action handler triggers
  const handleAction = (action: string, resv: any) => {
    setContextMenu(null)
    switch (action) {
      case "open":
        setSelectedReservation(resv)
        setIsViewOpen(true)
        break
      case "edit":
        handleEditOpen(resv)
        break
      case "extend":
        handleQuickExtendStay(resv)
        break
      case "move":
        handleEditOpen(resv)
        break
      case "checkin":
        router.push(`/admin/front-office/reception/check-in?reservationId=${resv.id || resv._id}`)
        break
      case "checkout":
        router.push(`/admin/front-office/reception/check-out?room=${resv.roomNumber}`)
        break
      case "cancel":
        handleCancelReservation(resv.id || resv._id)
        break
      case "print":
        handlePrintGRCard(resv)
        break
    }
  }

  // Auto-close context menu
  useEffect(() => {
    const handleOutsideClick = () => {
      setContextMenu(null)
    }
    window.addEventListener("click", handleOutsideClick)
    return () => window.removeEventListener("click", handleOutsideClick)
  }, [])

  // Calculate status colors helper
  const getStatusColor = (status: string, checkOutStr: string) => {
    const isDueOut = status === "checked-in" && checkOutStr === formatLocalDate(new Date())
    
    if (isDueOut) return "bg-purple-500/80 border-purple-600 text-white hover:bg-purple-500 animate-in fade-in"
    
    switch (status) {
      case "confirmed":
        return "bg-amber-500/85 border-amber-600 text-white hover:bg-amber-500" // Reserved
      case "checked-in":
        return "bg-green-600/80 border-green-700 text-white hover:bg-green-600" // Checked In
      case "checked-out":
        return "bg-gray-400/80 border-gray-500 text-white hover:bg-gray-400"
      default:
        return "bg-blue-500/80 border-blue-600 text-white hover:bg-blue-500"
    }
  }

  // Status indicators count pills lists
  const statusPills = [
    { id: "all", label: "All", count: statusCounts.total, color: "bg-muted text-muted-foreground border-muted-foreground/30 hover:bg-muted/80" },
    { id: "vacant", label: "Vacant", count: statusCounts.vacant, color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20" },
    { id: "occupied", label: "Occupied", count: statusCounts.occupied, color: "bg-green-600/10 text-green-700 border-green-600/30 hover:bg-green-600/20" },
    { id: "reserved", label: "Reserved", count: statusCounts.reserved, color: "bg-amber-500/10 text-amber-700 border-amber-500/30 hover:bg-amber-500/20" },
    { id: "blocked", label: "Blocked", count: statusCounts.blocked, color: "bg-rose-500/10 text-rose-700 border-rose-500/30 hover:bg-rose-500/20" },
    { id: "due-out", label: "Due Out", count: statusCounts.dueOut, color: "bg-purple-500/10 text-purple-700 border-purple-500/30 hover:bg-purple-500/20" },
    { id: "dirty", label: "Dirty", count: statusCounts.dirty, color: "bg-slate-500/10 text-slate-700 border-slate-500/30 hover:bg-slate-500/20" }
  ]

  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
      <div className="space-y-4">
        
        {/* Header Controls */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Stay View</h1>
            <p className="text-sm text-muted-foreground">Enterprise PMS Timeline & Reservations Scheduler</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Pickers */}
            <div className="flex items-center gap-1 bg-card border rounded-lg p-1 shadow-sm">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleShiftTimeline(-7)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1 px-2 text-xs font-semibold">
                <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <input 
                  type="date" 
                  value={timelineStartStr} 
                  onChange={(e) => setTimelineStartStr(e.target.value)} 
                  className="bg-transparent border-none text-xs focus:ring-0 cursor-pointer w-[110px]"
                />
              </div>

              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleShiftTimeline(7)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Visible Days Selection */}
            <Select value={String(visibleDays)} onValueChange={(val) => setVisibleDays(Number(val))}>
              <SelectTrigger className="h-10 text-xs w-[100px] bg-card">
                <SelectValue placeholder="Scale" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 Days</SelectItem>
                <SelectItem value="20">20 Days</SelectItem>
                <SelectItem value="25">25 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
              </SelectContent>
            </Select>

            {/* Room Type Filter */}
            <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
              <SelectTrigger className="h-10 text-xs w-[140px] bg-card">
                <SelectValue placeholder="Room Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Room Types</SelectItem>
                {roomTypes.map(rt => (
                  <SelectItem key={rt._id || rt.id} value={rt._id || rt.id}>{rt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search Room / Guest..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 w-[180px] text-xs bg-card"
              />
              {searchQuery && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 hover:bg-transparent"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Rate Plan Filter */}
            <Select value={ratePlanFilter} onValueChange={setRatePlanFilter}>
              <SelectTrigger className="h-10 text-xs w-[120px] bg-card">
                <SelectValue placeholder="Rate Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Room Only</SelectItem>
                {ratePlans.map(rp => (
                  <SelectItem key={rp._id || rp.id} value={rp._id || rp.id}>{rp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button size="default" className="h-10 gap-1.5" onClick={() => {
              setNewResDetails(null)
              setNewFormData((prev: any) => ({
                ...prev,
                checkInDate: formatLocalDate(new Date()),
                checkOutDate: formatLocalDate(addDays(new Date(), 1)),
                roomNumber: "",
                room: ""
              }))
              setIsNewOpen(true)
            }}>
              <Plus className="h-4 w-4" /> New Booking
            </Button>
          </div>
        </div>

        {/* Status Indicators Pills (Interactive Filter Bar) */}
        <div className="flex flex-wrap items-center gap-2 bg-muted/40 border p-2 rounded-lg shadow-sm">
          {statusPills.map(pill => (
            <button
              key={pill.id}
              onClick={() => setActiveStatusFilter(pill.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all shadow-sm ${
                activeStatusFilter === pill.id 
                  ? "ring-2 ring-primary bg-primary text-primary-foreground border-primary" 
                  : pill.color
              }`}
            >
              <span>{pill.label}</span>
              <span className="bg-black/10 text-[10px] px-1.5 py-0.5 rounded-full font-extrabold">{pill.count}</span>
            </button>
          ))}
          <div className="flex items-center gap-1.5 ml-auto text-muted-foreground text-[10px]">
            <Settings className="h-3.5 w-3.5" />
            <span>Interactive Timeline Scheduler</span>
          </div>
        </div>

        {/* Timeline Grid container */}
        <div className="rounded-xl border border-border shadow-lg overflow-hidden bg-card/65 glass-morphism">
          <div className="p-0">
            
            {isLoading ? (
              <div className="flex h-96 items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground font-semibold">Loading timeline scheduler data...</p>
                </div>
              </div>
            ) : roomGroups.length === 0 ? (
              <div className="flex h-96 items-center justify-center text-muted-foreground">
                <div className="text-center space-y-2">
                  <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground/50" />
                  <p className="text-sm font-semibold">No rooms match the current search or filters.</p>
                </div>
              </div>
            ) : (
              <div className="relative flex overflow-auto select-none border rounded-lg shadow-sm" style={{ maxHeight: "calc(100vh - 235px)" }}>
                
                {/* 1. Sticky Room Numbers Panel (Y-Axis) */}
                <div className="sticky left-0 z-20 flex-shrink-0 w-48 bg-card border-r border-border">
                  {/* Top corner cell spacer */}
                  <div className="h-[76px] bg-muted/50 border-b border-border flex items-center px-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rooms Panel</span>
                  </div>

                  {/* Room rows headers grouped by Room Type */}
                  <div>
                    {roomGroups.map((group) => (
                      <div key={group.typeId}>
                        {/* Group Header Row */}
                        <div 
                          onClick={() => toggleTypeCollapse(group.typeId)}
                          className="h-10 bg-muted/65 border-b border-border flex items-center px-4 cursor-pointer font-bold text-xs hover:bg-muted transition-colors text-muted-foreground uppercase tracking-wider justify-between"
                        >
                          <span>{group.typeName}</span>
                          <span className="text-[10px]">{collapsedTypes[group.typeId] ? "Expand +" : "Collapse -"}</span>
                        </div>

                        {/* Room Headers under group */}
                        {!collapsedTypes[group.typeId] && group.rooms.map((room) => {
                          const isDirty = String(room.hkStatus).toLowerCase() === "dirty" || String(room.hkStatus).toLowerCase() === "cleaning"
                          return (
                            <div 
                              key={room._id} 
                              className="h-[64px] border-b border-border flex flex-col justify-center px-4 bg-card/85 relative group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-foreground flex items-center gap-1">
                                  Room {room.roomNumber}
                                  {isDirty && (
                                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" title="Dirty" />
                                  )}
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className={`text-[9px] px-1 py-0 font-bold uppercase ${
                                    room.status === "available" ? "border-green-500 text-green-600 bg-green-50/50" :
                                    room.status === "occupied" ? "border-blue-500 text-blue-600 bg-blue-50/50" :
                                    room.status === "blocked" ? "border-rose-500 text-rose-600 bg-rose-50/50" : "border-amber-500 text-amber-600"
                                  }`}
                                >
                                  {room.status}
                                </Badge>
                              </div>
                              <span className="text-[10px] text-muted-foreground">Floor {room.floor || 1} • {room.acType}</span>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Sticky summaries side headers */}
                  <div className="sticky bottom-11 z-30 h-11 bg-slate-50 border-t border-b border-border flex items-center px-4 font-bold text-xs text-muted-foreground">
                    Available Inventory
                  </div>
                  <div className="sticky bottom-0 z-30 h-11 bg-slate-50 border-b border-border flex items-center px-4 font-bold text-xs text-muted-foreground">
                    Occupancy (%)
                  </div>
                </div>

                {/* 2. Scrollable Timeline (X-Axis) */}
                <div className="flex-grow min-w-max relative" style={{ width: `${visibleDays * colWidth}px` }}>
                  
                  {/* Date headers sticky row with pricing details */}
                  <div className="sticky top-0 z-10 flex h-[76px] bg-muted/40 border-b border-border min-w-max">
                    {visibleDates.map((date, idx) => {
                      const { dayName, dayNum, isWeekend } = formatDayHeader(date)
                      const isCurrToday = formatLocalDate(date) === formatLocalDate(new Date())
                      
                      return (
                        <div 
                          key={idx} 
                          className={`w-[72px] flex-shrink-0 flex flex-col items-center justify-center border-r border-border/60 py-2 transition-colors text-center ${
                            isCurrToday ? "bg-primary/10 text-primary" : isWeekend ? "bg-muted/10 text-muted-foreground" : ""
                          }`}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">{dayName}</span>
                          <span className="text-xs font-extrabold tracking-tighter mt-0.5">{dayNum} {format(date, "MMM")}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Grid Cells grouped by room types */}
                  <div className="relative">
                    {roomGroups.map((group) => (
                      <div key={group.typeId}>
                        {/* Group Header Row Spacer Bar with dynamic availability counts and daily rates */}
                        <div 
                          className="h-10 bg-muted/20 border-b border-border min-w-max flex"
                          style={{ width: `${visibleDays * colWidth}px` }}
                        >
                          {visibleDates.map((date, idx) => {
                            const { available, price } = getGroupStatForDate(group.typeId, date)
                            const isCurrToday = formatLocalDate(date) === formatLocalDate(new Date())

                            return (
                              <div 
                                key={idx}
                                className={`w-[72px] flex-shrink-0 border-r border-border/40 flex flex-col items-center justify-center text-center py-1 bg-slate-50/60 ${
                                  isCurrToday ? "bg-primary/5" : ""
                                }`}
                              >
                                <span className="text-[11px] font-extrabold text-foreground">{available}</span>
                                <span className="text-[9px] font-bold text-muted-foreground/80">₹{Math.round(price)}</span>
                              </div>
                            )
                          })}
                        </div>

                        {/* Room Grid Rows */}
                        {!collapsedTypes[group.typeId] && group.rooms.map((room) => (
                          <div key={room._id} className="flex h-[64px] border-b border-border/50 min-w-max bg-card/10 relative">
                            {visibleDates.map((date, idx) => {
                              const dateStr = formatLocalDate(date)
                              const isWeekend = date.getDay() === 0 || date.getDay() === 6
                              const isTodayCell = dateStr === formatLocalDate(new Date())

                              // Check if this cell overlaps a room block
                              const isBlocked = blocks.some(b => 
                                String(b.room) === String(room._id) && 
                                b.isActive &&
                                dateStr >= formatLocalDate(parseSafeDate(b.from)) && 
                                dateStr < formatLocalDate(parseSafeDate(b.to))
                              )

                              return (
                                <div 
                                  key={idx} 
                                  onClick={() => {
                                    if (!isBlocked) handleCellClick(room, date)
                                  }}
                                  className={`w-[72px] flex-shrink-0 border-r border-border/40 hover:bg-primary/5 transition-colors cursor-crosshair relative ${
                                    isBlocked ? "bg-rose-50/40 cursor-not-allowed dark:bg-rose-950/20" : isTodayCell ? "bg-primary/5" : isWeekend ? "bg-muted/5" : ""
                                  }`}
                                >
                                  {isBlocked && (
                                    <div className="absolute inset-0 flex items-center justify-center text-rose-500/30 font-bold text-[8px] uppercase tracking-wider rotate-[-15deg] select-none">
                                      Blocked
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    ))}

                    {/* 3. Render Overlapping Room Blocks as Bars using exact topOffsets */}
                    {expandedRooms.map((room, roomIdx) => {
                      const roomBlocks = blocks.filter(b => String(b.room) === String(room._id) && b.isActive)
                      return roomBlocks.map((block) => {
                        const bFrom = parseSafeDate(block.from)
                        const bTo = parseSafeDate(block.to)
                        
                        if (bTo <= timelineStartDate || bFrom >= timelineEndDate) return null

                        const startOffset = differenceInDays(bFrom, timelineStartDate)
                        const duration = differenceInDays(bTo, bFrom)

                        const rStart = Math.max(0, startOffset)
                        const rEnd = Math.min(visibleDays, startOffset + duration)
                        
                        const left = rStart * colWidth
                        const width = (rEnd - rStart) * colWidth
                        const topOffset = roomTopOffsets.get(String(room._id))
                        if (topOffset === undefined) return null
                        
                        const top = topOffset + 8
                        const height = rowHeight - 16

                        return (
                          <div
                            key={block._id}
                            className="absolute z-10 bg-rose-500/20 border border-rose-500/80 rounded-md flex items-center px-2 select-none overflow-hidden pointer-events-none"
                            style={{
                              left: `${left}px`,
                              width: `${width}px`,
                              top: `${top}px`,
                              height: `${height}px`
                            }}
                          >
                            <span className="text-[10px] font-extrabold text-rose-700 dark:text-rose-400 truncate">
                              Blocked: {block.remark || "Maintenance"}
                            </span>
                          </div>
                        )
                      })
                    })}

                    {/* 4. Render Active Reservation Bars using exact topOffsets */}
                    {expandedRooms.map((room, roomIdx) => {
                      const roomResvs = reservations.filter(r => String(r.roomId || r.room?._id || r.room || '') === String(room._id))
                      return roomResvs.map((resv) => {
                        const checkIn = parseSafeDate(resv.checkIn || resv.checkInDate)
                        const checkOut = parseSafeDate(resv.checkOut || resv.checkOutDate)
                        
                        if (checkOut <= timelineStartDate || checkIn >= timelineEndDate) return null

                        const startOffset = differenceInDays(checkIn, timelineStartDate)
                        const duration = differenceInDays(checkOut, checkIn)

                        const rStart = Math.max(0, startOffset)
                        const rEnd = Math.min(visibleDays, startOffset + duration)
                        
                        const topOffset = roomTopOffsets.get(String(room._id))
                        if (topOffset === undefined) return null

                        const left = rStart * colWidth
                        const width = (rEnd - rStart) * colWidth
                        const top = topOffset + 8
                        const height = rowHeight - 16

                        const isCutLeft = startOffset < 0
                        const isCutRight = startOffset + duration > visibleDays
                        
                        const isSelected = selectedReservation && String(selectedReservation.id || selectedReservation._id) === String(resv.id || resv._id)
                        const isSearchMatch = guestSearchMatchIds.has(String(resv.id || resv._id))

                        return (
                          <div
                            key={resv.id || resv._id}
                            onContextMenu={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setContextMenu({
                                x: e.clientX,
                                y: e.clientY,
                                reservation: resv
                              })
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedReservation(resv)
                              setIsViewOpen(true)
                            }}
                            onMouseEnter={(e) => handleMouseEnter(e, resv)}
                            onMouseLeave={handleMouseLeave}
                            onDoubleClick={(e) => {
                              e.stopPropagation()
                              handleEditOpen(resv)
                            }}
                            className={`absolute z-10 border rounded-md shadow-sm transition-shadow flex items-center justify-between pl-3 pr-2 group cursor-grab active:cursor-grabbing hover:shadow-md select-none overflow-hidden ${
                              getStatusColor(resv.status, resv.checkOut)
                            } ${
                              isCutLeft ? "rounded-l-none border-l-dashed" : ""
                            } ${
                              isCutRight ? "rounded-r-none border-r-dashed" : ""
                            } ${
                              isSelected ? "ring-2 ring-primary ring-offset-1" : ""
                            } ${
                              isSearchMatch ? "ring-2 ring-yellow-400 animate-pulse" : ""
                            }`}
                            style={{
                              left: `${left}px`,
                              width: `${width}px`,
                              top: `${top}px`,
                              height: `${height}px`
                            }}
                          >
                            {/* Drag Left Handle (Check-In Resize / Early Checkin Adjustment) */}
                            {!isCutLeft && resv.status === "confirmed" && (
                              <div
                                onMouseDown={(e) => handleDragStart(e, resv, "left")}
                                className="absolute left-0 top-0 w-1.5 h-full cursor-w-resize bg-black/10 hover:bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity rounded-l"
                              />
                            )}

                            {/* Main Title Bar */}
                            <div 
                              onMouseDown={(e) => handleDragStart(e, resv, "move")}
                              className="flex-grow truncate py-1 select-none flex flex-col justify-center h-full pr-1.5"
                            >
                              <span className="text-[11px] font-bold truncate block">{resv.guestName}</span>
                              <span className="text-[9px] opacity-75 truncate block">
                                {resv.status === "checked-in" ? "In-House" : 
                                 resv.status === "checked-out" ? "Checked Out" : "Reserved"} • {differenceInDays(parseSafeDate(resv.checkOut || resv.checkOutDate), parseSafeDate(resv.checkIn || resv.checkInDate))} N
                              </span>
                            </div>

                            {/* Fast Options Button */}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={(e) => {
                                e.stopPropagation()
                                setContextMenu({
                                  x: e.clientX,
                                  y: e.clientY,
                                  reservation: resv
                                })
                              }}
                              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-white/20 text-white flex-shrink-0"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>

                            {/* Drag Right Handle (Check-Out Resize / Extend stay / Early checkout) */}
                            {!isCutRight && resv.status !== "checked-out" && (
                              <div
                                onMouseDown={(e) => handleDragStart(e, resv, "right")}
                                className="absolute right-0 top-0 w-1.5 h-full cursor-e-resize bg-black/10 hover:bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity rounded-r"
                              />
                            )}
                          </div>
                        )
                      })
                    })}

                    {/* 5. Render Drag Snapping Ghost Overlay */}
                    {ghostOverlay && (() => {
                      const gCheckIn = parseSafeDate(ghostOverlay.checkIn)
                      const gCheckOut = parseSafeDate(ghostOverlay.checkOut)

                      const startOffset = differenceInDays(gCheckIn, timelineStartDate)
                      const duration = differenceInDays(gCheckOut, gCheckIn)

                      const rStart = Math.max(0, startOffset)
                      const rEnd = Math.min(visibleDays, startOffset + duration)

                      const left = rStart * colWidth
                      const width = (rEnd - rStart) * colWidth
                      const topOffset = roomTopOffsets.get(ghostOverlay.roomId)
                      if (topOffset === undefined) return null

                      const top = topOffset + 8
                      const height = rowHeight - 16

                      const originalRes = reservations.find(r => String(r.id || r._id) === String(ghostOverlay.resId))
                      const status = originalRes ? originalRes.status : "confirmed"

                      const validation = validateMoveLocal(ghostOverlay.resId, ghostOverlay.roomId, gCheckIn, gCheckOut, status)
                      
                      const room = rooms.find(r => String(r._id) === ghostOverlay.roomId)
                      const roomTypeId = room ? String(room.roomType?._id || room.roomType || "") : ""
                      const estimates = calculateEstimates(ghostOverlay.checkIn, ghostOverlay.checkOut, roomTypeId)

                      return (
                        <div
                          className={`absolute z-30 border-2 border-dashed pointer-events-none rounded-md flex flex-col justify-center px-3 shadow-lg select-none text-[10px] leading-tight ${
                            validation.valid 
                              ? "border-primary bg-primary/25 text-primary-foreground" 
                              : "border-rose-500 bg-rose-500/30 text-rose-950 dark:text-rose-200"
                          }`}
                          style={{
                            left: `${left}px`,
                            width: `${width}px`,
                            top: `${top}px`,
                            height: `${height}px`
                          }}
                        >
                          {validation.valid ? (
                            <>
                              <span className="font-extrabold truncate">Room {room?.roomNumber} • {duration} N</span>
                              <span className="opacity-95 truncate mt-0.5">{ghostOverlay.checkIn} to {ghostOverlay.checkOut}</span>
                              <span className="font-bold opacity-90 truncate mt-0.5">Est. Total: ₹{Math.round(estimates.total)}</span>
                            </>
                          ) : (
                            <span className="font-extrabold truncate text-center text-rose-600 dark:text-rose-400">CONFLICT: OVERLAP</span>
                          )}
                        </div>
                      )
                    })()}

                    {/* 6. Styled Hover Card Tooltip (mirrors the reference image) */}
                    {hoveredRes && hoverPosition && (
                      <div 
                        className="absolute z-40 bg-card border border-border/80 rounded-lg shadow-xl p-2.5 flex items-center gap-3 pointer-events-none transition-all duration-75 animate-in fade-in zoom-in-95"
                        style={{
                          left: `${hoverPosition.x}px`,
                          top: `${hoverPosition.y}px`,
                          transform: 'translateX(-50%)',
                        }}
                      >
                        {/* Circle badge with guest name initials */}
                        <div className="h-8 w-8 rounded-full bg-orange-500/90 text-white flex items-center justify-center font-extrabold text-xs uppercase shadow-sm">
                          {hoveredRes.guestName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </div>
                        
                        {/* Guest name and reservation status tag */}
                        <div className="flex flex-col text-left">
                          <span className="font-extrabold text-foreground capitalize text-[11px] leading-tight">
                            {hoveredRes.guestName}
                          </span>
                          
                          <Badge 
                            variant="secondary" 
                            className={`text-[9px] px-1.5 py-0 mt-1 font-bold w-fit uppercase ${
                              hoveredRes.status === "checked-in" ? "bg-green-600/10 text-green-700 border border-green-600/20" :
                              hoveredRes.status === "checked-out" ? "bg-gray-500/10 text-gray-700 border border-gray-500/20" :
                              "bg-amber-500/10 text-amber-700 border border-amber-500/20"
                            }`}
                          >
                            {hoveredRes.status === "checked-in" ? "Checked In" : 
                             hoveredRes.status === "checked-out" ? "Checked Out" : "Reserved"}
                          </Badge>
                        </div>
                        
                        {/* Down pointing tooltip arrow */}
                        <div className="absolute bottom-[-5px] left-1/2 translate-x-[-50%] w-2.5 h-2.5 bg-card border-r border-b border-border/70 rotate-45" />
                      </div>
                    )}

                  </div>

                  {/* Summary Rows at the bottom of dates grid */}
                  {/* Available Inventory Row */}
                  <div className="sticky bottom-11 z-10 flex h-11 border-t border-b border-border bg-slate-50 min-w-max">
                    {visibleDates.map((date, idx) => {
                      const dateStr = formatLocalDate(date)
                      const stat = dailyStats[dateStr] || { occupancyRate: 0, availableCount: rooms.length }
                      return (
                        <div 
                          key={idx} 
                          className="w-[72px] flex-shrink-0 border-r border-border/40 flex items-center justify-center font-extrabold text-xs text-foreground bg-slate-100/40"
                        >
                          {stat.availableCount}
                        </div>
                      )
                    })}
                  </div>

                  {/* Occupancy (%) Row */}
                  <div className="sticky bottom-0 z-10 flex h-11 border-b border-border bg-slate-50 min-w-max animate-in fade-in">
                    {visibleDates.map((date, idx) => {
                      const dateStr = formatLocalDate(date)
                      const stat = dailyStats[dateStr] || { occupancyRate: 0, availableCount: rooms.length }
                      return (
                        <div 
                          key={idx} 
                          className="w-[72px] flex-shrink-0 border-r border-border/40 flex flex-col items-center justify-center text-[10px] px-1 bg-slate-100/40"
                        >
                          <span className="font-extrabold text-foreground">{stat.occupancyRate}%</span>
                          <div className="w-10 h-1 bg-muted rounded-full overflow-hidden mt-1">
                            <div 
                              className="h-full bg-emerald-500 rounded-full" 
                              style={{ width: `${stat.occupancyRate}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                </div>

              </div>
            )}
            
          </div>
        </div>
      </div>

      {/* Right-click custom context menu overlay */}
      {contextMenu && (
        <div 
          className="fixed z-50 min-w-[170px] bg-card border rounded-lg shadow-xl p-1 text-xs text-foreground divide-y divide-border/60 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          style={{ 
            left: `${contextMenu.x}px`, 
            top: `${contextMenu.y}px` 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-1 px-2.5 font-semibold text-[10px] uppercase text-muted-foreground bg-muted/20">
            Booking Actions
          </div>
          
          <div className="py-1">
            <button 
              onClick={() => handleAction("open", contextMenu.reservation)}
              className="w-full text-left py-1.5 px-3 hover:bg-primary hover:text-primary-foreground rounded flex items-center gap-2"
            >
              <Info className="h-3.5 w-3.5" /> View Details
            </button>
            <button 
              onClick={() => handleAction("edit", contextMenu.reservation)}
              className="w-full text-left py-1.5 px-3 hover:bg-primary hover:text-primary-foreground rounded flex items-center gap-2"
            >
              <Edit3 className="h-3.5 w-3.5" /> Edit Reservation
            </button>
          </div>

          <div className="py-1">
            {contextMenu.reservation.status === "confirmed" && (
              <button 
                onClick={() => handleAction("extend", contextMenu.reservation)}
                className="w-full text-left py-1.5 px-3 hover:bg-primary hover:text-primary-foreground rounded flex items-center gap-2"
              >
                <Plus className="h-3.5 w-3.5" /> Extend Stay (+1 Day)
              </button>
            )}
            <button 
              onClick={() => handleAction("move", contextMenu.reservation)}
              className="w-full text-left py-1.5 px-3 hover:bg-primary hover:text-primary-foreground rounded flex items-center gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Change Room / Shift
            </button>
          </div>

          <div className="py-1">
            {contextMenu.reservation.status === "confirmed" && (
              <button 
                onClick={() => handleAction("checkin", contextMenu.reservation)}
                className="w-full text-left py-1.5 px-3 hover:bg-green-600 hover:text-white rounded flex items-center gap-2 font-semibold text-green-600"
              >
                <LogIn className="h-3.5 w-3.5" /> Check In
              </button>
            )}
            {contextMenu.reservation.status === "checked-in" && (
              <button 
                onClick={() => handleAction("checkout", contextMenu.reservation)}
                className="w-full text-left py-1.5 px-3 hover:bg-blue-600 hover:text-white rounded flex items-center gap-2 font-semibold text-blue-600"
              >
                <LogOut className="h-3.5 w-3.5" /> Check Out
              </button>
            )}
            {contextMenu.reservation.status === "checked-in" && (
              <button 
                onClick={() => handleAction("print", contextMenu.reservation)}
                className="w-full text-left py-1.5 px-3 hover:bg-primary hover:text-primary-foreground rounded flex items-center gap-2"
              >
                <Printer className="h-3.5 w-3.5" /> Print GR Card
              </button>
            )}
          </div>

          <div className="py-1">
            {contextMenu.reservation.status !== "cancelled" && (
              <button 
                onClick={() => handleAction("cancel", contextMenu.reservation)}
                className="w-full text-left py-1.5 px-3 hover:bg-destructive hover:text-destructive-foreground rounded flex items-center gap-2 text-destructive font-semibold"
              >
                <Trash className="h-3.5 w-3.5" /> Cancel Reservation
              </button>
            )}
          </div>
        </div>
      )}

      {/* dialog 1: READ ONLY View reservation Details */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Reservation Info</DialogTitle>
            <DialogDescription>Overview details of reservation stay</DialogDescription>
          </DialogHeader>
          
          {selectedReservation && (
            <div className="space-y-4 py-2 text-sm">
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Guest Name</span>
                <span className="font-bold text-foreground">{selectedReservation.guestName}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Phone Number</span>
                <span className="font-medium text-foreground">{selectedReservation.guestPhone || "-"}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Email Address</span>
                <span className="text-foreground">{selectedReservation.guestEmail || "-"}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Room Assigned</span>
                 <span className="font-bold text-foreground">Room {selectedReservation.roomNumber} ({typeof selectedReservation.roomType === 'object' ? (selectedReservation.roomType?.name || selectedReservation.roomType?.code || "") : selectedReservation.roomType})</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Stay Dates</span>
                <span className="font-semibold text-foreground">{(selectedReservation.checkIn || selectedReservation.checkInDate)} to {(selectedReservation.checkOut || selectedReservation.checkOutDate)}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Length of Stay</span>
                <span className="text-foreground">{differenceInDays(parseSafeDate(selectedReservation.checkOut || selectedReservation.checkOutDate), parseSafeDate(selectedReservation.checkIn || selectedReservation.checkInDate))} Nights</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Booking Status</span>
                <Badge className={
                  selectedReservation.status === "confirmed" ? "bg-amber-500 text-white" : 
                  selectedReservation.status === "checked-in" ? "bg-green-600 text-white" : "bg-gray-400 text-white"
                }>
                  {selectedReservation.status.toUpperCase()}
                </Badge>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Booking ID</span>
                <span className="font-mono text-xs">{selectedReservation.id || selectedReservation._id}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Billing Total</span>
                <span className="font-bold text-primary">${selectedReservation.totalAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Advance Paid</span>
                <span className="font-bold text-green-600">${selectedReservation.paidAmount?.toFixed(2)}</span>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            {selectedReservation && selectedReservation.status !== "cancelled" && (
              <Button variant="destructive" size="sm" onClick={() => handleCancelReservation(selectedReservation.id || selectedReservation._id)} className="mr-auto">
                Cancel Booking
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setIsViewOpen(false)}>
              Close
            </Button>
            {selectedReservation && (
              <Button size="sm" onClick={() => handleEditOpen(selectedReservation)}>
                Edit Details
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* dialog 2: Edit Reservation form */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Reservation</DialogTitle>
            <DialogDescription>Modify reservation dates, room, or guest details</DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4 text-xs">
            <div className="space-y-2">
              <Label>Guest Name *</Label>
              <Input 
                value={editFormData.guestName} 
                onChange={(e) => setEditFormData((prev: any) => ({ ...prev, guestName: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input 
                value={editFormData.phone} 
                onChange={(e) => setEditFormData((prev: any) => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Email</Label>
              <Input 
                type="email"
                value={editFormData.email} 
                onChange={(e) => setEditFormData((prev: any) => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Check-in Date *</Label>
              <Input 
                type="date"
                value={editFormData.checkInDate} 
                onChange={(e) => {
                  const val = e.target.value
                  const estimates = calculateEstimates(val, editFormData.checkOutDate, editFormData.roomType)
                  setEditFormData((prev: any) => ({ 
                    ...prev, 
                    checkInDate: val,
                    totalAmount: String(estimates.total)
                  }))
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Check-out Date *</Label>
              <Input 
                type="date"
                value={editFormData.checkOutDate} 
                onChange={(e) => {
                  const val = e.target.value
                  const estimates = calculateEstimates(editFormData.checkInDate, val, editFormData.roomType)
                  setEditFormData((prev: any) => ({ 
                    ...prev, 
                    checkOutDate: val,
                    totalAmount: String(estimates.total)
                  }))
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Adults</Label>
              <Input 
                type="number"
                min="1"
                value={editFormData.adults} 
                onChange={(e) => setEditFormData((prev: any) => ({ ...prev, adults: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Children</Label>
              <Input 
                type="number"
                min="0"
                value={editFormData.children} 
                onChange={(e) => setEditFormData((prev: any) => ({ ...prev, children: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Room Type *</Label>
              <Select 
                value={editFormData.roomType} 
                onValueChange={(val) => {
                  const estimates = calculateEstimates(editFormData.checkInDate, editFormData.checkOutDate, val)
                  setEditFormData((prev: any) => ({ 
                    ...prev, 
                    roomType: val,
                    room: "",
                    roomNumber: "",
                    totalAmount: String(estimates.total)
                  }))
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {roomTypes.map(rt => (
                    <SelectItem key={rt._id || rt.id} value={rt._id || rt.id}>{rt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assign Room *</Label>
              <Select 
                value={editFormData.room} 
                onValueChange={(val) => {
                  const r = rooms.find(rm => String(rm._id) === val)
                  setEditFormData((prev: any) => ({ 
                    ...prev, 
                    room: val, 
                    roomNumber: r ? r.roomNumber : "" 
                  }))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={editFormData.roomNumber ? `Room ${editFormData.roomNumber}` : "Select Room"} />
                </SelectTrigger>
                <SelectContent>
                  {rooms
                    .filter(r => !editFormData.roomType || String(r.roomType?._id || r.roomType || "") === editFormData.roomType)
                    .map(r => (
                      <SelectItem key={r._id} value={String(r._id)}>
                        Room {r.roomNumber} - {r.roomType?.name || r.type || ""} ({r.acType === "AC" ? "AC" : "Non AC"})
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rate Plan</Label>
              <Select 
                value={editFormData.ratePlan} 
                onValueChange={(val) => setEditFormData((prev: any) => ({ ...prev, ratePlan: val }))}
              >
                <SelectTrigger><SelectValue placeholder="Select rate plan" /></SelectTrigger>
                <SelectContent>
                  {ratePlans.map(rp => (
                    <SelectItem key={rp._id || rp.id} value={rp._id || rp.id}>{rp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Booking Source</Label>
              <Select 
                value={editFormData.bookingSource} 
                onValueChange={(val) => setEditFormData((prev: any) => ({ ...prev, bookingSource: val }))}
              >
                <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                <SelectContent>
                  {businessSourceOptions.map(o => (
                    <SelectItem key={o._id} value={o.value}>{o.value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <Select 
                value={editFormData.paymentMode} 
                onValueChange={(val) => setEditFormData((prev: any) => ({ ...prev, paymentMode: val }))}
              >
                <SelectTrigger><SelectValue placeholder="Select payment" /></SelectTrigger>
                <SelectContent>
                  {paymentModeOptions.map(o => (
                    <SelectItem key={o._id} value={o.value}>{o.value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Advance Amount</Label>
              <Input 
                type="number"
                value={editFormData.advanceAmount} 
                onChange={(e) => setEditFormData((prev: any) => ({ ...prev, advanceAmount: e.target.value }))}
              />
            </div>

            <div className="col-span-2 space-y-2 border-t pt-3 mt-1 text-sm">
              <div className="flex justify-between font-bold text-foreground">
                <span>Estimated Total Bill (with 12% tax)</span>
                <span className="text-primary">${Number(editFormData.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* dialog 3: Create New Reservation Form */}
      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle>New Reservation</DialogTitle>
            <DialogDescription>Create a new hotel room reservation booking</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4 text-xs">
            <div className="space-y-2">
              <Label>Guest Name *</Label>
              <Input 
                placeholder="Enter guest full name"
                value={newFormData.guestName} 
                onChange={(e) => setNewFormData((prev: any) => ({ ...prev, guestName: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input 
                placeholder="Enter phone number"
                value={newFormData.phone} 
                onChange={(e) => setNewFormData((prev: any) => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email"
                placeholder="guest@domain.com"
                value={newFormData.email} 
                onChange={(e) => setNewFormData((prev: any) => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>ID Proof Type *</Label>
              <Select 
                value={newFormData.idProofType} 
                onValueChange={(val) => setNewFormData((prev: any) => ({ ...prev, idProofType: val }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {idProofOptions.map(o => (
                    <SelectItem key={o._id} value={o.value}>{o.value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label>ID Proof Number *</Label>
              <Input 
                placeholder="Enter proof number"
                value={newFormData.idProofNumber} 
                onChange={(e) => setNewFormData((prev: any) => ({ ...prev, idProofNumber: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Check-in Date *</Label>
              <Input 
                type="date"
                value={newFormData.checkInDate} 
                onChange={(e) => {
                  const val = e.target.value
                  const estimates = calculateEstimates(val, newFormData.checkOutDate, newFormData.roomType)
                  setNewFormData((prev: any) => ({ 
                    ...prev, 
                    checkInDate: val,
                    totalAmount: String(estimates.total)
                  }))
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Check-out Date *</Label>
              <Input 
                type="date"
                value={newFormData.checkOutDate} 
                onChange={(e) => {
                  const val = e.target.value
                  const estimates = calculateEstimates(newFormData.checkInDate, val, newFormData.roomType)
                  setNewFormData((prev: any) => ({ 
                    ...prev, 
                    checkOutDate: val,
                    totalAmount: String(estimates.total)
                  }))
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Adults</Label>
              <Input 
                type="number"
                min="1"
                value={newFormData.adults} 
                onChange={(e) => setNewFormData((prev: any) => ({ ...prev, adults: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Children</Label>
              <Input 
                type="number"
                min="0"
                value={newFormData.children} 
                onChange={(e) => setNewFormData((prev: any) => ({ ...prev, children: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Room Type *</Label>
              <Select 
                value={newFormData.roomType} 
                onValueChange={(val) => {
                  const estimates = calculateEstimates(newFormData.checkInDate, newFormData.checkOutDate, val)
                  setNewFormData((prev: any) => ({ 
                    ...prev, 
                    roomType: val,
                    room: "",
                    roomNumber: "",
                    totalAmount: String(estimates.total)
                  }))
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {roomTypes.map(rt => (
                    <SelectItem key={rt._id || rt.id} value={rt._id || rt.id}>{rt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assign Room *</Label>
              <Select 
                value={newFormData.room} 
                onValueChange={(val) => {
                  const r = rooms.find(rm => String(rm._id) === val)
                  setNewFormData((prev: any) => ({ 
                    ...prev, 
                    room: val, 
                    roomNumber: r ? r.roomNumber : "" 
                  }))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={newFormData.roomNumber ? `Room ${newFormData.roomNumber}` : "Select Room"} />
                </SelectTrigger>
                <SelectContent>
                  {rooms
                    .filter(r => !newFormData.roomType || String(r.roomType?._id || r.roomType || "") === newFormData.roomType)
                    .map(r => (
                      <SelectItem key={r._id} value={String(r._id)}>
                        Room {r.roomNumber} - {r.roomType?.name || r.type || ""} ({r.acType === "AC" ? "AC" : "Non AC"})
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rate Plan</Label>
              <Select 
                value={newFormData.ratePlan} 
                onValueChange={(val) => setNewFormData((prev: any) => ({ ...prev, ratePlan: val }))}
              >
                <SelectTrigger><SelectValue placeholder="Select rate plan" /></SelectTrigger>
                <SelectContent>
                  {ratePlans.map(rp => (
                    <SelectItem key={rp._id || rp.id} value={rp._id || rp.id}>{rp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Booking Source</Label>
              <Select 
                value={newFormData.bookingSource} 
                onValueChange={(val) => setNewFormData((prev: any) => ({ ...prev, bookingSource: val }))}
              >
                <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                <SelectContent>
                  {businessSourceOptions.map(o => (
                    <SelectItem key={o._id} value={o.value}>{o.value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <Select 
                value={newFormData.paymentMode} 
                onValueChange={(val) => setNewFormData((prev: any) => ({ ...prev, paymentMode: val }))}
              >
                <SelectTrigger><SelectValue placeholder="Select payment" /></SelectTrigger>
                <SelectContent>
                  {paymentModeOptions.map(o => (
                    <SelectItem key={o._id} value={o.value}>{o.value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Advance Amount</Label>
              <Input 
                type="number"
                value={newFormData.advanceAmount} 
                onChange={(e) => setNewFormData((prev: any) => ({ ...prev, advanceAmount: e.target.value }))}
              />
            </div>

            <div className="col-span-2 space-y-2 border-t pt-3 mt-1 text-sm">
              <div className="flex justify-between font-bold text-foreground">
                <span>Estimated Total Bill (with 12% tax)</span>
                <span className="text-primary">${Number(newFormData.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateReservation} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  )
}
