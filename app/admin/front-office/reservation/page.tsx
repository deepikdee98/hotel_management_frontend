"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createFrontOfficeReservation, getBookingNumberPreview, getFrontOfficeReservations, getFrontOfficeRooms, getInHouseGuests, getSetupRoomTypes, getSetupRatePlans, getStayViewData, updateFrontOfficeReservation } from "@/lib/backend-api"
import type { Reservation, Room } from "@/lib/types"
import EditDetailsModal from "@/components/common/EditDetailsModal"
import { useSetupOptions } from "@/hooks/use-setup-options"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { usePagination } from "@/hooks/use-pagination"
import { CreateReservationDialog } from "@/features/reservations/components/create-reservation-dialog"
import {
  Building2,
  CalendarCheck,
  CalendarDays,
  FileUp,
  MoreVertical,
  Printer,
  Search,
  UserRound,
  Users,
} from "lucide-react"

type ReservationRow = Reservation & {
  rowKey?: string
  bookingNumber?: string
  registerNo?: string
  groupId?: string
  bookingGroupId?: string
  parentGuestCheckin?: string | null
  source?: "reservation" | "in-house"
  totalNights?: number
  nightsStayed?: number
}

type ReservationStage = "reservations" | "arrivals" | "departures" | "in-house"
type ReservationScope = "individual" | "group"

const statusTabs: Array<{ value: ReservationStage; label: string }> = [
  { value: "reservations", label: "Reservations" },
  { value: "arrivals", label: "Arrivals" },
  { value: "departures", label: "Departures" },
  { value: "in-house", label: "In-house" },
]

const formatReservation = (r: Reservation): ReservationRow => ({
  ...r,
  rowKey: `reservation:${r.id || r.bookingNumber || r.reservationId}:${r.roomNumber || ""}:${r.checkIn || ""}:${r.checkOut || ""}`,
  id: r.id,
  reservationId: r.reservationId,
  bookingNumber: r.bookingNumber,
  guestName: r.guestName,
  guestPhone: r.guestPhone,
  guestEmail: r.guestEmail,
  roomNumber: r.roomNumber,
  checkIn: r.checkIn,
  checkOut: r.checkOut,
  totalAmount: r.totalAmount,
  paidAmount: r.paidAmount,
  status: r.status,
  extraBeds: r.extraBeds || 0,
  source: "reservation",
})

const normalizeDate = (value: unknown) => {
  if (!value) return ""
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? String(value).slice(0, 10) : date.toISOString().slice(0, 10)
}

const getRoomTypeName = (value: any) => {
  if (!value) return "Room Only"
  if (typeof value === "string") return value
  return String(value.name || value.code || "Room Only")
}

const formatInHouseGuest = (item: any): ReservationRow => {
  const checkIn = normalizeDate(item.checkInDate || item.checkIn)
  const checkOut = normalizeDate(item.checkOutDate || item.checkOut)
  const totalNights = Math.max(1, Number(item.nights || 1))
  const checkInDate = checkIn ? new Date(checkIn) : null
  const today = new Date()
  const nightsStayed = checkInDate && !Number.isNaN(checkInDate.getTime())
    ? Math.max(1, Math.ceil((today.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 0
  const planCharges = Number(item.planCharges || 0)
  const foodCharges = Number(item.foodCharges || 0)
  const totalAmount = Number(item.totalAmount ?? ((planCharges + foodCharges) * totalNights))
  const paidAmount = Number(item.paidAmount ?? item.advanceAmount ?? 0)
  const bookingNumber = String(item.bookingNumber || item.bookingNo || item.bookingId || "")

  const id = String(item.checkinId || item.id || item.folioId || bookingNumber)

  return {
    rowKey: `in-house:${id}:${String(item.roomNumber || item.room?.roomNumber || "")}:${checkIn}:${checkOut}`,
    id,
    reservationId: bookingNumber || String(item.reservationId || item.id || ""),
    bookingNumber,
    guestName: String(item.guestName || item.name || ""),
    guestEmail: String(item.email || item.guestEmail || ""),
    guestPhone: String(item.mobileNo || item.guestPhone || item.phone || ""),
    guestPhotoUrl: String(item.guestPhotoUrl || item.avatar || ""),
    roomId: String(item.roomId || item.room?._id || ""),
    roomNumber: String(item.roomNumber || item.room?.roomNumber || ""),
    roomType: getRoomTypeName(item.roomType || item.type),
    checkIn,
    checkOut,
    status: "checked-in",
    adults: Number(item.adults || item.adultMale || item.adultFemale || 0),
    children: Number(item.children || 0),
    extraBeds: Number(item.noOfBeds || item.extraBeds || 0),
    totalAmount,
    paidAmount,
    paymentMode: item.paymentMode ? String(item.paymentMode) : undefined,
    ratePlan: item.planType ? String(item.planType) : undefined,
    bookingSource: item.guestType ? String(item.guestType) : undefined,
    referredByName: undefined,
    amount: planCharges || totalAmount,
    createdAt: checkIn,
    groupId: undefined,
    bookingGroupId: item.bookingGroupId ? String(item.bookingGroupId) : undefined,
    parentGuestCheckin: item.parentGuestCheckin ? String(item.parentGuestCheckin) : null,
    source: "in-house",
    totalNights,
    nightsStayed,
  }
}

const formatStayViewReservation = (item: any): ReservationRow => {
  const room = item.room || {}
  const checkIn = normalizeDate(item.checkInDate || item.checkIn)
  const checkOut = normalizeDate(item.checkOutDate || item.checkOut)
  const status = String(item.status || "confirmed") as Reservation["status"]
  const bookingNumber = String(item.bookingNumber || item.bookingNo || item.bookingId || item.reservationId || "")

  const id = String(item._id || item.id || item.checkinId || bookingNumber)

  return {
    rowKey: `stay-view:${status}:${id}:${String(item.roomNumber || room.roomNumber || room.number || "")}:${checkIn}:${checkOut}`,
    id,
    reservationId: bookingNumber || String(item.reservationId || item._id || item.id || ""),
    bookingNumber,
    guestName: String(item.guestName || item.name || ""),
    guestEmail: String(item.email || item.guestEmail || ""),
    guestPhone: String(item.phone || item.mobileNo || item.guestPhone || ""),
    guestPhotoUrl: String(item.guestPhotoUrl || item.avatar || ""),
    roomId: String(item.roomId || room._id || room.id || item.room || ""),
    roomNumber: String(item.roomNumber || room.roomNumber || room.number || ""),
    roomType: getRoomTypeName(item.roomType || item.type),
    checkIn,
    checkOut,
    status,
    adults: Number(item.adults || item.adultMale || item.adultFemale || 0),
    children: Number(item.children || 0),
    extraBeds: Number(item.extraBeds || item.noOfBeds || 0),
    totalAmount: Number(item.totalAmount || 0),
    paidAmount: Number(item.paidAmount || item.advanceAmount || 0),
    paymentMode: item.paymentMode ? String(item.paymentMode) : undefined,
    ratePlan: item.ratePlan || item.planType ? String(item.ratePlan || item.planType) : undefined,
    bookingSource: item.bookingSource || item.guestType ? String(item.bookingSource || item.guestType) : undefined,
    referredByType: item.referredByType ? String(item.referredByType) : undefined,
    referredById: item.referredById ? String(item.referredById) : undefined,
    referredByName: item.referredByName ? String(item.referredByName) : undefined,
    amount: Number(item.planCharges || item.amount || item.totalAmount || 0),
    createdAt: normalizeDate(item.createdAt || checkIn),
    groupId: item.groupId ? String(item.groupId) : undefined,
    bookingGroupId: item.bookingGroupId ? String(item.bookingGroupId) : undefined,
    parentGuestCheckin: item.parentGuestCheckin ? String(item.parentGuestCheckin) : null,
    source: status === "checked-in" || item.isDirectCheckIn ? "in-house" : "reservation",
    totalNights: getNights(checkIn, checkOut),
    nightsStayed: status === "checked-in" ? getNights(checkIn, normalizeDate(new Date())) : undefined,
  }
}

const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const getStayKey = (reservation: ReservationRow) =>
  reservation.status === "checked-in"
    ? [
        "checked-in",
        reservation.guestName.trim().toLowerCase(),
        reservation.roomNumber.trim(),
      ].join("|")
    : [
        reservation.bookingNumber || reservation.reservationId || reservation.id,
        reservation.guestName.trim().toLowerCase(),
        reservation.roomNumber.trim(),
        reservation.checkIn,
        reservation.checkOut,
      ].join("|")

const removeDuplicateRows = (rows: ReservationRow[]) => {
  const unique = new Map<string, ReservationRow>()
  rows.forEach((row) => {
    const key = getStayKey(row)
    const existing = unique.get(key)
    if (
      !existing ||
      (row.status === "checked-in" && row.rowKey?.startsWith("in-house:")) ||
      (existing.source !== row.source && row.rowKey?.startsWith("stay-view:") && existing.status !== "checked-in")
    ) {
      unique.set(key, row)
    }
  })
  return Array.from(unique.values())
}

const toDateKey = (value?: string) => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 10)
  return date.toISOString().slice(0, 10)
}

const formatDate = (value?: string) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("en-GB")
}

const formatMoney = (value?: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0))

const getNights = (checkIn?: string, checkOut?: string) => {
  const start = checkIn ? new Date(checkIn) : null
  const end = checkOut ? new Date(checkOut) : null
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
}

const isGroupReservation = (reservation: ReservationRow, groupCounts?: Map<string, number>) => {
  const referredByType = String(reservation.referredByType || "").toLowerCase()
  const source = String(reservation.bookingSource || "").toLowerCase()
  const bookingGroupId = String(reservation.bookingGroupId || reservation.groupId || "").trim()
  return Boolean(
    reservation.parentGuestCheckin ||
    (bookingGroupId && (groupCounts?.get(bookingGroupId) || 0) > 1) ||
    referredByType.includes("company") ||
    referredByType.includes("travel") ||
    source.includes("company") ||
    source.includes("corporate") ||
    source.includes("travel")
  )
}

const isInStage = (reservation: ReservationRow, stage: ReservationStage, todayKey: string) => {
  const isReserved = reservation.status === "confirmed" || String(reservation.status) === "no-show"
  if (stage === "reservations") return isReserved
  if (stage === "arrivals") return isReserved && toDateKey(reservation.checkIn) === todayKey
  if (stage === "departures") return toDateKey(reservation.checkOut) === todayKey || reservation.status === "checked-out"
  return reservation.status === "checked-in"
}

export default function ReservationPage() {
  const router = useRouter()
  const paymentModeOptions = useSetupOptions("paymentMode")
  const idProofOptions = useSetupOptions("idProof")
  const businessSourceOptions = useSetupOptions("businessSource")
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 250)
  const [activeStage, setActiveStage] = useState<ReservationStage>("reservations")
  const [activeScope, setActiveScope] = useState<ReservationScope>("individual")
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false)
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
    if (isNewReservationOpen) {
      setFormData(prev => ({ ...prev, adults: "", children: "", ratePlan: "" }));
    }
  }, [isNewReservationOpen]);

  const [reservations, setReservations] = useState<ReservationRow[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomTypes, setRoomTypes] = useState<any[]>([])
  const [ratePlans, setRatePlans] = useState<any[]>([])
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editData, setEditData] = useState<any>({})

  const renderSetupItems = useCallback((options: { data: Array<{ _id: string; value: string }>; loading: boolean }) => {
    if (options.loading) return <SelectItem value="__loading__" disabled>Loading...</SelectItem>
    if (!options.data.length) return <SelectItem value="__empty__" disabled>No data available</SelectItem>
    return options.data.map((option) => <SelectItem key={option._id} value={option.value}>{option.value}</SelectItem>)
  }, [])

  const loadReservationWorkspace = useCallback(async () => {
    const today = normalizeDate(new Date())
    const endDate = normalizeDate(addDays(new Date(), 45))
    const [stayViewResult, reservationResult, inHouseResult, roomResult, roomTypeResult, ratePlanResult] = await Promise.allSettled([
      getStayViewData(today, endDate, "all"),
      getFrontOfficeReservations(),
      getInHouseGuests(),
      getFrontOfficeRooms(),
      getSetupRoomTypes(),
      getSetupRatePlans(),
    ])
    const stayViewReservations = stayViewResult.status === "fulfilled" ? stayViewResult.value.data?.reservations || [] : []
    const reservationData = reservationResult.status === "fulfilled" ? reservationResult.value : []
    const inHouseData = inHouseResult.status === "fulfilled" ? inHouseResult.value.data?.guests || [] : []
    const roomData = roomResult.status === "fulfilled"
      ? roomResult.value
      : stayViewResult.status === "fulfilled"
        ? (stayViewResult.value.data?.rooms || []).map((room: any) => ({
            id: String(room._id || room.id || ""),
            number: String(room.roomNumber || room.number || ""),
            floor: Number(room.floor || 0),
            type: getRoomTypeName(room.roomType),
            roomTypeId: String(room.roomType?._id || room.roomType || ""),
            status: String(room.status || "available") as Room["status"],
            price: Number(room.price || room.roomType?.baseRate || 0),
            amenities: [],
          }))
        : []
    const roomTypeData = roomTypeResult.status === "fulfilled" ? roomTypeResult.value : []
    const ratePlanData = ratePlanResult.status === "fulfilled" ? ratePlanResult.value : []

    const stayViewRows = stayViewReservations.map(formatStayViewReservation)
    const reservationRows = reservationData.map(formatReservation)
    const inHouseRows = inHouseData.map(formatInHouseGuest)

    setReservations(removeDuplicateRows([...stayViewRows, ...reservationRows, ...inHouseRows]))
    setRooms(roomData)
    setRoomTypes(roomTypeData)
    setRatePlans(ratePlanData)
  }, [])

  const refreshReservationsOnly = useCallback(async () => {
    const today = normalizeDate(new Date())
    const endDate = normalizeDate(addDays(new Date(), 45))
    const [stayViewResult, reservationResult, inHouseResult] = await Promise.allSettled([
      getStayViewData(today, endDate, "all"),
      getFrontOfficeReservations(),
      getInHouseGuests(),
    ])
    const stayViewReservations = stayViewResult.status === "fulfilled" ? stayViewResult.value.data?.reservations || [] : []
    const reservationData = reservationResult.status === "fulfilled" ? reservationResult.value : []
    const inHouseData = inHouseResult.status === "fulfilled" ? inHouseResult.value.data?.guests || [] : []

    setReservations(removeDuplicateRows([
      ...stayViewReservations.map(formatStayViewReservation),
      ...reservationData.map(formatReservation),
      ...inHouseData.map(formatInHouseGuest),
    ]))
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        await loadReservationWorkspace()
      } catch {
        setReservations([])
      }
    }

    load()
  }, [loadReservationWorkspace])

  // Form state for new reservation
  const [formData, setFormData] = useState({
    guestName: "",
    phone: "",
    email: "",
    idProofType: "",
    idProofNumber: "",
    checkInDate: "",
    checkOutDate: "",
    adults: "",
    children: "",
    roomType: "",
    roomNumber: "",
    ratePlan: "",
    bookingSource: "",
    advanceAmount: "",
    paymentMode: "",
    specialRequests: "",
    extraBeds: "0",
  })

  type TabType = "guest" | "booking" | "payment";
  const [activeTab, setActiveTab] = useState<TabType>("guest");
  const tabOrder = ["guest", "booking", "payment"] as const;
  const currentTabIndex = tabOrder.indexOf(activeTab);

  const validateGuestTab = () => formData.guestName.trim() && formData.phone.trim();
  const validateBookingTab = () => formData.checkInDate && formData.checkOutDate && formData.roomNumber !== "";
  const validatePaymentTab = () => true;

  const validateCurrentTab = () => {
    switch (activeTab) {
      case "guest": return validateGuestTab();
      case "booking": return validateBookingTab();
      case "payment": return validatePaymentTab();
      default: return false;
    }
  };

  const handleNextTab = () => {
    if (validateCurrentTab()) {
      const nextIndex = Math.min(currentTabIndex + 1, tabOrder.length - 1);
      setActiveTab(tabOrder[nextIndex]);
    } else {
      toast({
        title: "Validation Error",
        description: "Please fill required fields before continuing",
        variant: "destructive",
      });
    }
  };

  const handlePrevTab = () => {
    const prevIndex = Math.max(currentTabIndex - 1, 0);
    setActiveTab(tabOrder[prevIndex]);
  };

  const todayKey = useMemo(() => toDateKey(new Date().toISOString()), [])

  const groupCounts = useMemo(() => {
    const counts = new Map<string, number>()
    reservations.forEach((reservation) => {
      const bookingGroupId = String(reservation.bookingGroupId || reservation.groupId || "").trim()
      if (!bookingGroupId) return
      counts.set(bookingGroupId, (counts.get(bookingGroupId) || 0) + 1)
    })
    return counts
  }, [reservations])

  const scopeReservations = useMemo(
    () => reservations.filter((reservation) => activeScope === "group" ? isGroupReservation(reservation, groupCounts) : !isGroupReservation(reservation, groupCounts)),
    [activeScope, groupCounts, reservations]
  )

  const tabCounts = useMemo(
    () => statusTabs.reduce<Record<ReservationStage, number>>((acc, tab) => {
      acc[tab.value] = scopeReservations.filter((reservation) => isInStage(reservation, tab.value, todayKey)).length
      return acc
    }, {
      reservations: 0,
      arrivals: 0,
      departures: 0,
      "in-house": 0,
    }),
    [scopeReservations, todayKey]
  )

  const filteredReservations = useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase()
    return scopeReservations.filter((reservation) => {
      const bookingId = reservation.bookingNumber || reservation.registerNo || reservation.reservationId || ""
      const matchesSearch =
        !query ||
        reservation.guestName.toLowerCase().includes(query) ||
        reservation.roomNumber.toLowerCase().includes(query) ||
        bookingId.toLowerCase().includes(query) ||
        (reservation.referredByName || "").toLowerCase().includes(query)
      return matchesSearch && isInStage(reservation, activeStage, todayKey)
    })
  }, [activeStage, debouncedSearchQuery, scopeReservations, todayKey])

  const reservationPagination = usePagination(filteredReservations, 10)

  useEffect(() => {
    if (activeStage === "reservations" && tabCounts.reservations === 0 && tabCounts["in-house"] > 0) {
      setActiveStage("in-house")
      reservationPagination.setPage(1)
    }
  }, [activeStage, reservationPagination, tabCounts])

  const availableRooms = useMemo(() => rooms.filter((room) => room.status === "available"), [rooms])
  const paginatedReservations = reservationPagination.paginatedItems

  const estimates = useMemo(() => {
    if (!formData.checkInDate || !formData.checkOutDate) return { roomCharges: 0, taxes: 0, total: 0 }

    const checkIn = new Date(formData.checkInDate)
    const checkOut = new Date(formData.checkOutDate)
    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)))

    let baseRate = 0
    const selectedRoomType = roomTypes.find(t => (t._id || t.id) === formData.roomType)
    if (selectedRoomType) {
      const room = rooms.find(r => r.number === formData.roomNumber || r.id === formData.roomNumber)
      const acType = room?.acType || "NON_AC"
      let roomRate = 0
      let extraBedRate = 0
      if (acType === "AC") {
        roomRate = typeof selectedRoomType.acRate === "number" && selectedRoomType.acRate > 0 ? selectedRoomType.acRate : (room?.price || selectedRoomType.baseRate || 0)
        extraBedRate = typeof selectedRoomType.extraBedAcRate === "number" ? selectedRoomType.extraBedAcRate : 0
      } else {
        roomRate = typeof selectedRoomType.nonAcRate === "number" && selectedRoomType.nonAcRate > 0 ? selectedRoomType.nonAcRate : (room?.price || selectedRoomType.baseRate || 0)
        extraBedRate = typeof selectedRoomType.extraBedNonAcRate === "number" ? selectedRoomType.extraBedNonAcRate : 0
      }
      baseRate = roomRate + (Number(formData.extraBeds || 0) * extraBedRate)
    }

    // Apply rate plan logic if applicable
    const selectedRatePlan = ratePlans.find(p => (p._id || p.id) === formData.ratePlan)
    let rateModifier = 1
    if (selectedRatePlan) {
      if (selectedRatePlan.type === "percentage") {
        rateModifier = 1 + (selectedRatePlan.value / 100)
      } else if (selectedRatePlan.type === "fixed") {
        baseRate = selectedRatePlan.value
      }
    }

    const roomCharges = nights * baseRate * rateModifier
    const taxes = roomCharges * 0.12 // 12% tax
    const total = roomCharges + taxes

    return { roomCharges, taxes, total }
  }, [formData.checkInDate, formData.checkOutDate, formData.ratePlan, formData.roomType, formData.roomNumber, formData.extraBeds, ratePlans, roomTypes, rooms])

  const handleFormChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleSaveReservation = async () => {
    try {
      let selectedRoomId = ""

      if (formData.roomNumber === "auto") {
        const autoRoom = availableRooms.find(r => r.roomTypeId === formData.roomType)
        if (autoRoom) {
          selectedRoomId = autoRoom.id
        } else {
          const roomTypeObj = roomTypes.find(t => (t._id || t.id) === formData.roomType)
          toast({
            title: "No Rooms Available",
            description: `No available rooms found for type: ${roomTypeObj?.name || formData.roomType}`,
            variant: "destructive",
          })
          return
        }
      } else {
        const manualRoom = rooms.find((room) => room.number === formData.roomNumber)
        if (manualRoom) {
          selectedRoomId = manualRoom.id
        }
      }

      if (selectedRoomId) {
        await createFrontOfficeReservation({
          guestName: formData.guestName,
          phone: formData.phone,
          email: formData.email,
          idProofType: formData.idProofType,
          idProofNumber: formData.idProofNumber,
          checkInDate: formData.checkInDate,
          checkOutDate: formData.checkOutDate,
          adults: Number(formData.adults),
          children: Number(formData.children),
          roomType: formData.roomType,
          room: selectedRoomId,
          ratePlan: formData.ratePlan,
          bookingSource: formData.bookingSource,
          advanceAmount: Number(formData.advanceAmount || 0),
          paymentMode: formData.paymentMode,
          totalAmount: estimates.total,
          extraBeds: Number(formData.extraBeds || 0),
        })

        await refreshReservationsOnly()

        toast({
          title: "Success",
          description: "Reservation created successfully",
        })

        setIsNewReservationOpen(false)
        setFormData({
          guestName: "",
          phone: "",
          email: "",
          idProofType: "",
          idProofNumber: "",
          checkInDate: "",
          checkOutDate: "",
          adults: "",
          children: "",
          roomType: "",
          roomNumber: "",
          ratePlan: "",
          bookingSource: "",
          advanceAmount: "",
          paymentMode: "",
          specialRequests: "",
          extraBeds: "0",
        })
      } else {
        toast({
          title: "Selection Error",
          description: "Please select a room or use auto-assign",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: error.message || "An error occurred while creating the reservation",
        variant: "destructive",
      })
    }
  }

  const handleUpdateReservation = async () => {
    try {
      if (!editData?.id) return

      // Map back to backend field names
      const payload = {
        guestName: editData.guestName,
        phone: editData.guestPhone,
        email: editData.guestEmail,
        roomNumber: editData.roomNumber,
        checkInDate: editData.checkIn,
        checkOutDate: editData.checkOut,
        totalAmount: editData.totalAmount,
        advanceAmount: editData.paidAmount,
        extraBeds: Number(editData.extraBeds || 0),
      }

      await updateFrontOfficeReservation(editData.id, payload)

      await refreshReservationsOnly()
      setIsEditOpen(false)

      toast({
        title: "Success",
        description: "Reservation updated successfully",
      })
    } catch (error: any) {
      console.error("Update failed:", error)
      toast({
        title: "Update Failed",
        description: error.message || "An error occurred while updating the reservation",
        variant: "destructive",
      })
    }
  }

  const editFields = [
    { name: "guestName", label: "Guest Name" },
    { name: "guestPhone", label: "Phone" },
    { name: "guestEmail", label: "Email" },
    { name: "roomNumber", label: "Room Number" },
    { name: "checkIn", label: "Check-in", type: "date" },
    { name: "checkOut", label: "Check-out", type: "date" },
    { name: "extraBeds", label: "Extra Beds", type: "number" },
  ]

  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
      <TooltipProvider>
        <div className="min-h-[calc(100vh-6rem)] bg-slate-50/80 -m-3 sm:-m-5 lg:-m-6">
          <div className="border-b border-border bg-background px-4 py-3 sm:px-6">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">Reservations</h1>
                <p className="text-xs text-muted-foreground">Create and manage hotel bookings</p>
              </div>
              <div className="relative w-full xl:w-[400px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search reservations, guests and more"
                  className="h-9 rounded-sm bg-background pl-9"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="h-8 rounded-sm text-xs font-semibold">Booking ID: {bookingPreview}</Badge>
                <CreateReservationDialog
                  open={isNewReservationOpen}
                  bookingPreview={bookingPreview}
                  activeTab={activeTab}
                  currentTabIndex={currentTabIndex}
                  formData={formData}
                  idProofOptions={idProofOptions}
                  businessSourceOptions={businessSourceOptions}
                  paymentModeOptions={paymentModeOptions}
                  roomTypes={roomTypes}
                  ratePlans={ratePlans}
                  availableRooms={availableRooms}
                  estimates={estimates}
                  onOpenChange={setIsNewReservationOpen}
                  onTabChange={setActiveTab}
                  onFormChange={handleFormChange}
                  onPrevious={handlePrevTab}
                  onNext={handleNextTab}
                  onSave={handleSaveReservation}
                  canContinue={Boolean(validateCurrentTab())}
                  renderSetupItems={renderSetupItems}
                />
              </div>
            </div>
          </div>

          <div className="border-b border-border bg-background px-4 shadow-sm sm:px-6">
            <div className="flex flex-col gap-3 py-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 flex-wrap gap-1">
                {statusTabs.map((tab) => (
                  <button
                    key={tab.value}
                    className={`flex h-10 items-center gap-2 border-b-2 px-3 text-sm transition-colors ${
                      activeStage === tab.value
                        ? "border-foreground text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => {
                      setActiveStage(tab.value)
                      reservationPagination.setPage(1)
                    }}
                  >
                    <span>{tab.label}</span>
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{tabCounts[tab.value]}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-sm border border-border bg-background p-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant={activeScope === "individual" ? "default" : "ghost"}
                        className="h-8 w-9 rounded-sm"
                        onClick={() => {
                          setActiveScope("individual")
                          reservationPagination.setPage(1)
                        }}
                      >
                        <UserRound className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Individual</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant={activeScope === "group" ? "default" : "ghost"}
                        className="h-8 w-9 rounded-sm"
                        onClick={() => {
                          setActiveScope("group")
                          reservationPagination.setPage(1)
                        }}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Group</TooltipContent>
                  </Tooltip>
                </div>

                {activeScope === "group" && (
                  <Button variant="outline" className="h-9 rounded-sm gap-2">
                    <Users className="h-4 w-4" />
                    Merge Group
                  </Button>
                )}
                <Button variant="outline" className="h-9 rounded-sm gap-2">
                  <Printer className="h-4 w-4" />
                  Print GR
                </Button>
                <Button variant="outline" className="h-9 rounded-sm gap-2">
                  <FileUp className="h-4 w-4" />
                  Export
                </Button>
                <Button variant="outline" className="h-9 rounded-sm gap-2" onClick={() => document.querySelector<HTMLInputElement>("input[placeholder='Search reservations, guests and more']")?.focus()}>
                  <Search className="h-4 w-4" />
                  Search
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {paginatedReservations.length === 0 ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-sm border border-dashed border-border bg-background">
                <div className="text-center">
                  <CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">No {activeScope} bookings found</p>
                  <p className="text-xs text-muted-foreground">Try another tab or search term.</p>
                </div>
              </div>
            ) : (
              <div className="rounded-sm border border-border bg-background shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking No</TableHead>
                      <TableHead>Guest Name</TableHead>
                      <TableHead>{activeScope === "group" ? "Group / Room" : "Room No"}</TableHead>
                      <TableHead>Room Type</TableHead>
                      <TableHead>Check-in Date</TableHead>
                      <TableHead>Nights</TableHead>
                      <TableHead>Check-out Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedReservations.map((reservation) => {
                      const groupMode = isGroupReservation(reservation, groupCounts)
                      const balance = Number(reservation.totalAmount || 0) - Number(reservation.paidAmount || 0)
                      const bookingId = reservation.bookingNumber || reservation.registerNo || reservation.reservationId || "N/A"
                      const nights = reservation.totalNights || getNights(reservation.checkIn, reservation.checkOut)

                      return (
                        <TableRow key={reservation.rowKey || reservation.id}>
                          <TableCell className="font-medium">
                            <div>{bookingId}</div>
                            {groupMode && reservation.bookingGroupId && (
                              <div className="text-xs text-muted-foreground">{reservation.bookingGroupId}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${groupMode ? "bg-blue-50 text-blue-600" : "bg-primary/10 text-primary"}`}>
                                {groupMode ? <Building2 className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-foreground">{reservation.guestName || "Guest"}</div>
                                <div className="text-xs text-muted-foreground">{reservation.guestPhone || reservation.guestEmail || "-"}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {groupMode ? (
                              <div>
                                <div>{reservation.bookingGroupId || reservation.groupId || reservation.referredByName || "-"}</div>
                                <div className="text-xs text-muted-foreground">Room {reservation.roomNumber || "-"}</div>
                              </div>
                            ) : (
                              <Badge variant="outline" className="font-mono">{reservation.roomNumber || "-"}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="capitalize">{reservation.roomType || "Room Only"}</TableCell>
                          <TableCell>{formatDate(reservation.checkIn)}</TableCell>
                          <TableCell>{reservation.status === "checked-in" && reservation.nightsStayed ? `${reservation.nightsStayed} / ${nights}` : nights}</TableCell>
                          <TableCell>{formatDate(reservation.checkOut)}</TableCell>
                          <TableCell>{formatMoney(reservation.totalAmount)}</TableCell>
                          <TableCell>{formatMoney(reservation.paidAmount)}</TableCell>
                          <TableCell className={balance > 0 ? "text-red-500" : "text-green-600"}>{formatMoney(balance)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              reservation.status === "checked-in"
                                ? "border-green-200 bg-green-50 text-green-700"
                                : reservation.status === "checked-out"
                                  ? "border-slate-200 bg-slate-50 text-slate-700"
                                  : "border-amber-200 bg-amber-50 text-amber-700"
                            }>
                              {reservation.status === "checked-in" ? "In-House" : reservation.status === "checked-out" ? "Checked Out" : "Reserved"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {reservation.status !== "checked-out" && (
                                <Button size="sm" variant="outline" onClick={() => router.push(`/admin/front-office/reception/check-in?reservationId=${reservation.id}`)}>
                                  <CalendarCheck className="mr-1 h-3.5 w-3.5" />
                                  Confirm
                                </Button>
                              )}
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                                setEditData(reservation)
                                setIsEditOpen(true)
                              }}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" disabled={reservationPagination.page <= 1} onClick={() => reservationPagination.setPage(reservationPagination.page - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {reservationPagination.page} of {reservationPagination.totalPages}</span>
              <Button variant="outline" size="sm" disabled={reservationPagination.page >= reservationPagination.totalPages} onClick={() => reservationPagination.setPage(reservationPagination.page + 1)}>
                Next
              </Button>
            </div>
          </div>
        </div>
        <EditDetailsModal
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          title="Edit Reservation"
          formData={editData}
          setFormData={setEditData}
          fields={editFields}
          onSubmit={handleUpdateReservation}
        />
      </TooltipProvider>
    </DashboardLayout>
  )
}
