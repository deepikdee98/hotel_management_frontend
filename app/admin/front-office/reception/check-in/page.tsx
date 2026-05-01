"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Camera, Upload, UserCircle, Save, RotateCcw, X, FileText, Plus, Trash2, Loader2, Search, Pencil, LogOut } from "lucide-react"
import { createCheckIn, getFrontOfficeRooms, getSetupRatePlans, getFrontOfficeReservationById, getGuestByMobile, getCheckInById, updateCheckIn } from "@/lib/backend-api"
import { useToast } from "@/hooks/use-toast"
import { useSetupOptions } from "@/hooks/use-setup-options"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils" // Import for class merging
import type { Room } from "@/lib/types"
import { calculateCheckoutDateTime, calculateNetAmount, type CheckoutPlanMetadata } from "@/lib/pms-helpers"

function FormField({ label, required, children, className }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}

type ExistingGuest = {
  id?: string
  guestName?: string
  fullName?: string
  title?: string
  email?: string
  gender?: string
  nationality?: string
  address?: string
  country?: string
  state?: string
  city?: string
  zip?: string
  company?: string
  gstNumber?: string
  gstIn?: string
  referredBy?: string
  referredName?: string
  idProofType?: string
  idProofNumber?: string
}

const staffEditableFields = new Set([
  "guestName",
  "mobile",
  "address",
  "idProofType",
  "idProofNumber",
])

const staffRestrictedFields = new Set([
  "roomNo",
  "roomType",
  "planType",
  "planCharges",
  "foodCharges",
  "discount",
  "paymentMode",
  "advanceAmount",
  "ledgerAc",
])

export default function CheckInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const checkInId = searchParams.get("id") || ""
  const isEditMode = searchParams.get("mode") === "edit" && Boolean(checkInId)
  const isStaff = user?.role === "staff"
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingBooking, setIsLoadingBooking] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>("guest-info")
  const [guestPhoto, setGuestPhoto] = useState<string | null>(null)
  const [selectedRoomType, setSelectedRoomType] = useState("")
  const [gstInclusive, setGstInclusive] = useState(false)
  const [companions, setCompanions] = useState<{ name: string; mobile: string; idType: string; idNumber: string }[]>([])

  const [rooms, setRooms] = useState<Room[]>([])
  const [ratePlans, setRatePlans] = useState<any[]>([])
  const [reservationSearchId, setReservationIdSearch] = useState("")
  const [isFetchingReservation, setIsFetchingReservation] = useState(false)
  const [mobileLookupStatus, setMobileLookupStatus] = useState<"idle" | "loading" | "found" | "not-found" | "error">("idle")
  const [existingGuest, setExistingGuest] = useState<ExistingGuest | null>(null)
  const [loadedGuestId, setLoadedGuestId] = useState("")
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const tabOrder = ["guest-info", "guest-id", "companion", "vehicle-company"] as const;

  type TabType = typeof tabOrder[number];

  const [form, setForm] = useState({
    bookingNo: "BK-" + Date.now().toString().slice(-6),
    reservationId: "",
    registerNo: "",
    title: "",
    guestName: "",
    mobile: "",
    email: "",
    dob: "",
    gender: "",
    address: "",
    country: "",
    state: "",
    city: "",
    zip: "",
    nationality: "",
    gstIn: "",
    referredBy: "",
    referredName: "",
    arrivalFrom: "",
    departureTo: "",
    purposeOfVisit: "",
    businessSource: "",
    marketSegment: "",
    company: "",
    voucherNo: "",
    checkInDate: new Date().toISOString().slice(0, 10),
    checkInTime: new Date().toTimeString().slice(0, 5),
    checkOutDate: "",
    checkOutTime: "",
    noOfNights: "1",
    stayType: "Walk-in",
    occupancyType: "Single",
    checkoutPlan: "",
    guestClassification: "",
    roomNo: "",
    roomType: "",
    planType: "",
    planCharge: "0",
    foodCharge: "0",
    planCharges: "0",
    foodCharges: "0",
    discount: "0",
    netAmount: "0",
    guestType: "Regular",
    noOfBeds: "",
    paxAdultMale: "1",
    paxAdultFemale: "0",
    paxChildren: "0",
    paymentMode: "",
    advanceAmount: "",
    remark: "",
    idProofType: "",
    idProofNumber: "",
    ledgerAc: "",
    vehicleNo: "",
    vehicleType: "",
    // Company Info (Ledger) fields
    companyInfoCompanyName: "",
    companyInfoLedgerGroup: "",
    companyInfoPan: "",
    companyInfoGst: "",
    companyInfoBankAccountNo: "",
    companyInfoIfscCode: "",
    companyInfoCreditLimit: "",
    companyInfoBookingCategory: "",
  })

  const [originalData, setOriginalData] = useState<typeof form | null>(null)

  const titleOptions = useSetupOptions("title")
  const genderOptions = useSetupOptions("gender")
  const nationalityOptions = useSetupOptions("nationality")
  const countryOptions = useSetupOptions("country")
  const stayTypeOptions = useSetupOptions("stayType")
  const occupancyTypeOptions = useSetupOptions("occupancyType")
  const referralOptions = useSetupOptions("referral")
  const purposeOfVisitOptions = useSetupOptions("purpose")
  const businessSourceOptions = useSetupOptions("businessSource")
  const marketSegmentOptions = useSetupOptions("marketSegment")
  const checkoutPlanOptions = useSetupOptions("checkoutPlan")
  const guestClassificationOptions = useSetupOptions("guestClassification")
  const guestTypeOptions = useSetupOptions("guestType")
  const paymentModeOptions = useSetupOptions("paymentMode")
  const ledgerAccountOptions = useSetupOptions("ledgerAccount")
  const idProofTypeOptions = useSetupOptions("idProof")
  const vehicleTypeOptions = useSetupOptions("vehicleType")
  const ledgerGroupOptions = useSetupOptions("ledgerGroup")
  const bookingCategoryOptions = useSetupOptions("bookingCategory")

  // Real-time Checkout Calculation
  useEffect(() => {
    if (form.checkInDate && form.checkInTime && form.checkoutPlan) {
      const selectedPlan = checkoutPlanOptions.data.find(opt => opt.value === form.checkoutPlan);
      // We assume metadata exists on the option if fetched from backend
      if (selectedPlan && (selectedPlan as any).metadata) {
        const result = calculateCheckoutDateTime(
          form.checkInDate,
          form.checkInTime,
          (selectedPlan as any).metadata as CheckoutPlanMetadata
        );
        if (result) {
          setForm(prev => ({
            ...prev,
            checkOutDate: result.date,
            checkOutTime: result.time
          }));
        }
      }
    }
  }, [form.checkInDate, form.checkInTime, form.checkoutPlan, checkoutPlanOptions.data]);

  // Real-time Billing Calculation
  useEffect(() => {
    const net = calculateNetAmount(form.planCharge, form.foodCharge, form.discount);
    setForm(prev => ({
      ...prev,
      netAmount: net.toString()
    }));
  }, [form.planCharge, form.foodCharge, form.discount]);

  const renderSetupItems = (options: { data: Array<{ _id: string; value: string }>; loading: boolean }) => {
    if (options.loading) {
      return <SelectItem value="__loading__" disabled>Loading...</SelectItem>
    }

    if (!options.data.length) {
      return <SelectItem value="__empty__" disabled>No options configured</SelectItem>
    }

    return options.data.map((option) => (
      <SelectItem key={option._id} value={option.value}>
        {option.value}
      </SelectItem>
    ))
  }

  const isRestrictedForStaff = (field: string) => isStaff && staffRestrictedFields.has(field)
  const isEditableForStaff = (field: string) => !isStaff || staffEditableFields.has(field)
  const isFieldDisabled = (field: string) => isEditMode
    ? !isEditing || (isStaff && !isEditableForStaff(field))
    : false
  const restrictedFieldTitle = (field: string) => isEditing && isRestrictedForStaff(field) ? "Only admin can edit this" : undefined

  const requiredFields: Array<[keyof typeof form, string]> = [
    ["guestName", "Guest Name"],
    ["mobile", "Mobile Number"],
    ["roomNo", "Room Number"],
    ["checkInDate", "Check-in Date"],
    ["checkInTime", "Check-in Time"],
    ["title", "Title"],
    ["stayType", "Stay Type"],
    ["occupancyType", "Occupancy Type"],
    ["checkoutPlan", "Checkout Plan"],
    ["planType", "Plan Type"],
    ["planCharge", "Plan Charge"],
    ["paxAdultMale", "Adult Male"],
  ]

  const validationErrors = (() => {
    const errors: Record<string, string> = {}

    requiredFields.forEach(([field, label]) => {
      if (!String(form[field] || "").trim()) {
        errors[field] = `${label} is required`
      }
    })

    if (form.planCharge && Number(form.planCharge) <= 0) {
      errors.planCharge = "Plan Charge must be greater than 0"
    }

    if (form.foodCharge && (Number(form.foodCharge) < 0 || Number.isNaN(Number(form.foodCharge)))) {
      errors.foodCharge = "Food Charge must be greater than or equal to 0"
    }

    if (Number(form.discount || 0) > Number(form.planCharge || 0)) {
      errors.discount = "Discount must not exceed Plan Charge"
    }

    if (Number(form.netAmount || 0) < 0) {
      errors.netAmount = "Net Amount must not be negative"
    }

    if (form.paxAdultMale && (Number(form.paxAdultMale) < 1 || Number.isNaN(Number(form.paxAdultMale)))) {
      errors.paxAdultMale = "Adult Male must be at least 1"
    }

    if (!isEditMode && mobileLookupStatus === "found" && existingGuest && !loadedGuestId) {
      errors.mobile = "Mobile number already exists"
    }

    return errors
  })()

  const isCheckInValid = Object.keys(validationErrors).length === 0
  const updateValidationErrors = (() => {
    if (!isEditMode) return validationErrors

    const errors: Record<string, string> = {}
    if (!form.guestName.trim()) errors.guestName = "Guest Name is required"
    if (!form.mobile.trim()) errors.mobile = "Mobile Number is required"
    return errors
  })()
  const canUpdate = Object.keys(updateValidationErrors).length === 0
  const canCheckIn = isCheckInValid && mobileLookupStatus !== "loading"
  const showError = (field: keyof typeof form) => submitAttempted || Boolean(form[field])
  const activeValidationErrors = isEditMode ? updateValidationErrors : validationErrors
  const fieldError = (field: keyof typeof form) => showError(field) ? activeValidationErrors[field] : ""
  const errorClass = (field: keyof typeof form) => fieldError(field) ? "border-destructive focus-visible:ring-destructive" : ""

  const toDateTimeLocal = (value: unknown) => {
    if (!value) return ""
    const date = new Date(String(value))
    return Number.isNaN(date.getTime()) ? String(value).slice(0, 16) : date.toISOString().slice(0, 16)
  }

  const populateFormFromBooking = (booking: any) => {
    const roomNo = String(booking.roomNumber || booking.roomNo || "")

    // Find the matching room to get the correct display type name
    const matchingRoom = rooms.find(r => r.number === roomNo)
    const roomTypeDisplay = matchingRoom?.type || booking.roomType?.name || booking.roomType?.code || booking.roomType || ""
    const planTypeCode = booking.planType?.code || booking.planType || ""

    const normalizedForm = {
      bookingNo: String(booking.bookingNo || booking.bookingId || ""),
      reservationId: String(booking.reservationId || ""),
      registerNo: String(booking.registerNo || ""),
      title: String(booking.title || ""),
      guestName: String(booking.guestName || ""),
      mobile: String(booking.mobileNo || booking.mobile || booking.phone || ""),
      email: String(booking.email || ""),
      dob: booking.dob ? String(booking.dob).slice(0, 10) : "",
      gender: String(booking.gender || ""),
      address: String(booking.address || ""),
      country: String(booking.country || ""),
      state: String(booking.state || ""),
      city: String(booking.city || ""),
      zip: String(booking.zip || ""),
      nationality: String(booking.nationality || ""),
      gstIn: String(booking.gstNumber || booking.gstIn || ""),
      referredBy: String(booking.referredBy || ""),
      referredName: String(booking.referredName || ""),
      arrivalFrom: String(booking.arrivalFrom || ""),
      departureTo: String(booking.departureTo || ""),
      purposeOfVisit: String(booking.purposeOfVisit || ""),
      businessSource: String(booking.businessSource || ""),
      marketSegment: String(booking.marketSegment || ""),
      company: String(booking.company || ""),
      voucherNo: String(booking.voucherNo || ""),
      checkInDate: booking.checkInDate ? new Date(booking.checkInDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      checkInTime: booking.checkInTime || (booking.checkInDate ? new Date(booking.checkInDate).toTimeString().slice(0, 5) : new Date().toTimeString().slice(0, 5)),
      checkOutDate: booking.checkOutDate ? new Date(booking.checkOutDate).toISOString().slice(0, 10) : "",
      checkOutTime: booking.checkOutTime || (booking.checkOutDate ? new Date(booking.checkOutDate).toTimeString().slice(0, 5) : ""),
      noOfNights: String(booking.nights || booking.noOfNights || "1"),
      stayType: String(booking.stayType || "Walk-in"),
      occupancyType: String(booking.occupancyType || "Single"),
      checkoutPlan: String(booking.checkoutPlan || ""),
      guestClassification: String(booking.guestClassification || ""),
      roomNo,
      roomType: roomTypeDisplay,
      planType: planTypeCode,
      planCharge: String(booking.planCharge || booking.planCharges || (matchingRoom?.price ? matchingRoom.price.toString() : "0")),
      foodCharge: String(booking.foodCharge ?? booking.foodCharges ?? "0"),
      planCharges: String(booking.planCharge || booking.planCharges || (matchingRoom?.price ? matchingRoom.price.toString() : "0")),
      foodCharges: String(booking.foodCharge ?? booking.foodCharges ?? "0"),
      discount: String(booking.discount || "0"),
      netAmount: String(booking.netAmount || "0"),
      guestType: String(booking.guestType || "Regular"),
      noOfBeds: String(booking.noOfBeds || ""),
      paxAdultMale: String(booking.adultMale || booking.paxAdultMale || "1"),
      paxAdultFemale: String(booking.adultFemale || booking.paxAdultFemale || "0"),
      paxChildren: String(booking.children || booking.paxChildren || "0"),
      paymentMode: String(booking.paymentMode || ""),
      advanceAmount: String(booking.advanceAmount || ""),
      remark: String(booking.remarks || booking.remark || ""),
      idProofType: String(booking.idProofType || ""),
      idProofNumber: String(booking.idProofNumber || ""),
      ledgerAc: String(booking.ledgerAccount || booking.ledgerAc || ""),
      vehicleNo: String(booking.vehicleNo || ""),
      vehicleType: String(booking.vehicleType || ""),
      companyInfoCompanyName: String(booking.companyInfo?.companyName || ""),
      companyInfoLedgerGroup: String(booking.companyInfo?.ledgerGroup || ""),
      companyInfoPan: String(booking.companyInfo?.pan || ""),
      companyInfoGst: String(booking.companyInfo?.gst || ""),
      companyInfoBankAccountNo: String(booking.companyInfo?.bankAccountNo || ""),
      companyInfoIfscCode: String(booking.companyInfo?.ifscCode || ""),
      companyInfoCreditLimit: String(booking.companyInfo?.creditLimit || ""),
      companyInfoBookingCategory: String(booking.companyInfo?.bookingCategory || ""),
    }

    setForm(normalizedForm)
    setOriginalData(normalizedForm)
    setSelectedRoomType(roomTypeDisplay)
    setGstInclusive(Boolean(booking.gstInclusive))
    setCompanions(Array.isArray(booking.companions) ? booking.companions : [])
  }

  const handleReservationSearch = async () => {
    if (!reservationSearchId.trim()) return;

    setIsFetchingReservation(true);
    try {
      const reservation = await getFrontOfficeReservationById(reservationSearchId);
      if (reservation) {
        const matchingRoom = rooms.find(r => r.number === reservation.roomNumber || r.id === reservation.roomId)
        const resolvedRoomType = matchingRoom?.type || reservation.roomType || ""

        setForm(prev => {
          const checkIn = reservation.checkIn ? new Date(reservation.checkIn) : new Date();
          const checkOut = reservation.checkOut ? new Date(reservation.checkOut) : new Date();
          const noOfNights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
          return {
            ...prev,
            reservationId: reservation.reservationId || reservation.id,
            guestName: reservation.guestName || "",
            mobile: reservation.guestPhone || "",
            email: reservation.guestEmail || "",
            idProofType: reservation.idProofType || "",
            idProofNumber: reservation.idProofNumber || "",
            roomType: resolvedRoomType,
            roomNo: reservation.roomNumber || "",
            checkInDate: reservation.checkIn ? new Date(reservation.checkIn).toISOString().slice(0, 10) : prev.checkInDate,
            checkInTime: reservation.checkIn ? new Date(reservation.checkIn).toTimeString().slice(0, 5) : prev.checkInTime,
            checkOutDate: reservation.checkOut ? new Date(reservation.checkOut).toISOString().slice(0, 10) : "",
            checkOutTime: reservation.checkOut ? new Date(reservation.checkOut).toTimeString().slice(0, 5) : "",
            noOfNights: noOfNights.toString(),
            advanceAmount: reservation.paidAmount?.toString() || "0",
            planCharge: reservation.totalAmount?.toString() || "",
            planCharges: reservation.totalAmount?.toString() || "",
            paymentMode: reservation.paymentMode || "",
            planType: reservation.ratePlan || "",
            businessSource: reservation.bookingSource || "",
            paxAdultMale: reservation.adults?.toString() || "1",
            paxChildren: reservation.children?.toString() || "0",
          };
        });
        setSelectedRoomType(resolvedRoomType);
        toast({
          title: "Reservation Found",
          description: `Data populated for ${reservation.guestName}`,
        });
      } else {
        toast({
          title: "Not Found",
          description: "No reservation found with this ID",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch reservation details",
        variant: "destructive",
      });
    } finally {
      setIsFetchingReservation(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsData, plansData] = await Promise.all([
          getFrontOfficeRooms(),
          getSetupRatePlans()
        ])
        setRooms(roomsData)
        setRatePlans(plansData)
      } catch (error) {
        console.error("Failed to fetch data:", error)
      }
    }
    fetchData()
  }, [])

  const isPageReload = () => {
    if (typeof window === "undefined") return false
    const navEntries = performance.getEntriesByType?.("navigation") as PerformanceNavigationTiming[]
    if (navEntries?.length) {
      return navEntries[0].type === "reload"
    }
    const perfNav = (performance as any).navigation
    return perfNav?.type === 1
  }

  useEffect(() => {
    if (isEditMode) return

    const reload = isPageReload()
    if (reload) {
      sessionStorage.removeItem("hotel_checkin_form")
      return
    }

    const savedData = sessionStorage.getItem("hotel_checkin_form")
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        setForm(prev => ({ ...prev, ...parsed }))
      } catch (e) {
        console.error("Failed to parse saved form data", e)
      }
    }
  }, [isEditMode])

  useEffect(() => {
    if (isEditMode) return
    const timer = setTimeout(() => {
      sessionStorage.setItem("hotel_checkin_form", JSON.stringify(form))
    }, 1000)
    return () => clearTimeout(timer)
  }, [form, isEditMode])

  useEffect(() => {
    if (!isEditMode || rooms.length === 0) return

    const loadBooking = async () => {
      setIsLoadingBooking(true)
      setIsEditing(false)
      try {
        const response = await getCheckInById(checkInId)
        populateFormFromBooking(response.data)
      } catch (error: any) {
        toast({
          title: "Unable to load check-in",
          description: error.message || "Booking details could not be loaded",
          variant: "destructive",
        })
      } finally {
        setIsLoadingBooking(false)
      }
    }

    loadBooking()
  }, [checkInId, isEditMode, rooms.length])

  useEffect(() => {
    if (isEditMode) return

    const mobile = form.mobile.trim()
    setLoadedGuestId(prev => {
      if (!prev) return prev
      if (existingGuest && mobile === String((existingGuest as any).mobile || (existingGuest as any).phone || "")) return prev
      return ""
    })

    if (mobile.length < 4) {
      setMobileLookupStatus("idle")
      setExistingGuest(null)
      return
    }

    const timer = window.setTimeout(async () => {
      setMobileLookupStatus("loading")
      try {
        const response = await getGuestByMobile(mobile)
        if (response.exists && response.data) {
          setExistingGuest(response.data as ExistingGuest)
          setMobileLookupStatus("found")
          // Auto-set loadedGuestId if we found an existing guest to avoid "already exists" error
          if (response.data.id) {
            setLoadedGuestId(response.data.id)
          }
        } else {
          setExistingGuest(null)
          setMobileLookupStatus("not-found")
        }
      } catch {
        setExistingGuest(null)
        setMobileLookupStatus("error")
      }
    }, 450)

    return () => window.clearTimeout(timer)
  }, [form.mobile, isEditMode])

  const uniqueRoomTypes = Array.from(
    new Map(
      rooms.map((room) => [
        room.type,
        { id: room.type, name: room.type }
      ])
    ).values()
  );

  const baseFilteredRooms = selectedRoomType
    ? rooms.filter(r => r.type === selectedRoomType && r.status === "available")
    : rooms.filter(r => r.status === "available")

  const selectedRoom = form.roomNo ? rooms.find(r => r.number === form.roomNo) : undefined
  const reservationRoomOption = form.roomNo && !selectedRoom
    ? {
      id: `reservation-${form.roomNo}`,
      number: form.roomNo,
      floor: 0,
      type: form.roomType || "Reserved",
      status: "available" as const,
      price: Number(form.planCharges) || 0,
      amenities: [],
    }
    : undefined

  const filteredRooms = selectedRoom
    ? [...baseFilteredRooms.filter(r => r.number !== selectedRoom.number), selectedRoom]
    : reservationRoomOption
      ? [...baseFilteredRooms, reservationRoomOption]
      : baseFilteredRooms

  const handleLoadExistingGuest = () => {
    if (!existingGuest) return

    setForm(prev => ({
      ...prev,
      title: existingGuest.title || prev.title,
      guestName: existingGuest.guestName || existingGuest.fullName || prev.guestName,
      email: existingGuest.email || prev.email,
      gender: existingGuest.gender || prev.gender,
      nationality: existingGuest.nationality || prev.nationality,
      address: existingGuest.address || prev.address,
      country: existingGuest.country || prev.country,
      state: existingGuest.state || prev.state,
      city: existingGuest.city || prev.city,
      zip: existingGuest.zip || prev.zip,
      company: existingGuest.company || prev.company,
      gstIn: existingGuest.gstIn || existingGuest.gstNumber || prev.gstIn,
      referredBy: existingGuest.referredBy || prev.referredBy,
      referredName: existingGuest.referredName || prev.referredName,
      idProofType: existingGuest.idProofType || prev.idProofType,
      idProofNumber: existingGuest.idProofNumber || prev.idProofNumber,
    }))
    setLoadedGuestId(existingGuest.id || "")
    toast({
      title: "Guest Loaded",
      description: "Existing guest details loaded. You can edit them before check-in.",
    })
  }

  const handleChange = (field: string, value: string) => {
    if (isEditMode && isEditing && isStaff && !isEditableForStaff(field)) {
      return
    }

    if (field === "mobile") {
      setLoadedGuestId("")
    }
    setForm(prev => ({ ...prev, [field]: value }))
    if (field === "roomType") setSelectedRoomType(value)
    if (field === "roomNo") {
      const room = rooms.find(r => r.number === value)
      if (room) {
        setForm(prev => ({
          ...prev,
          roomType: room.type,
          roomNo: value,
          planCharge: room.price.toString(),
          planCharges: room.price.toString()
        }))
        setSelectedRoomType(room.type)
      }
    }
    if (field === "planType") {
      const plan = ratePlans.find(p => p._id === value || p.id === value || p.code === value)
      if (plan) {
        setForm(prev => ({ ...prev, planType: value }))
      }
    }
  }

  const handleReset = () => {
    setForm({
      bookingNo: "BK-" + Date.now().toString().slice(-6),
      reservationId: "",
      registerNo: "",
      title: "",
      guestName: "",
      mobile: "",
      email: "",
      dob: "",
      gender: "",
      address: "",
      country: "",
      state: "",
      city: "",
      zip: "",
      nationality: "",
      gstIn: "",
      referredBy: "",
      referredName: "",
      arrivalFrom: "",
      departureTo: "",
      purposeOfVisit: "",
      businessSource: "",
      marketSegment: "",
      company: "",
      voucherNo: "",
      checkInDate: new Date().toISOString().slice(0, 10),
      checkInTime: new Date().toTimeString().slice(0, 5),
      checkOutDate: "",
      checkOutTime: "",
      noOfNights: "1",
      stayType: "Walk-in",
      occupancyType: "Single",
      checkoutPlan: "",
      guestClassification: "",
      roomNo: "",
      roomType: "",
      planType: "",
      planCharge: "0",
      foodCharge: "0",
      planCharges: "0",
      foodCharges: "0",
      discount: "0",
      netAmount: "0",
      guestType: "Regular",
      noOfBeds: "",
      paxAdultMale: "1",
      paxAdultFemale: "0",
      paxChildren: "0",
      paymentMode: "",
      advanceAmount: "",
      remark: "",
      idProofType: "",
      idProofNumber: "",
      ledgerAc: "",
      vehicleNo: "",
      vehicleType: "",
      // Company Info (Ledger) fields
      companyInfoCompanyName: "",
      companyInfoLedgerGroup: "",
      companyInfoPan: "",
      companyInfoGst: "",
      companyInfoBankAccountNo: "",
      companyInfoIfscCode: "",
      companyInfoCreditLimit: "",
      companyInfoBookingCategory: "",
    })
    setGuestPhoto(null)
    setCompanions([])
    setExistingGuest(null)
    setLoadedGuestId("")
    setMobileLookupStatus("idle")
    setSubmitAttempted(false)
    setActiveTab("guest-info")
  }

  const addCompanion = () => {
    if (isEditMode && isEditing && isStaff) return
    setCompanions([...companions, { name: "", mobile: "", idType: "", idNumber: "" }])
  }

  const handleSave = async () => {
    setSubmitAttempted(true)
    // Final validation before submit
    if (!canCheckIn) {
      const firstError = mobileLookupStatus === "loading"
        ? "Please wait for mobile lookup to finish"
        : Object.values(validationErrors)[0] || "Please complete all required fields"
      toast({
        title: "Validation Error",
        description: firstError,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true)
    try {
      const payload = {
        ...buildUpdatePayload(),
        guestId: loadedGuestId || undefined,
        existingGuestId: loadedGuestId || undefined,
      }

      await createCheckIn(payload)
      localStorage.removeItem("hotel_checkin_form")

      toast({
        title: "Success",
        description: "Guest checked-in successfully. Register No auto-generated.",
      })
      router.push("/admin/front-office/in-house")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete check-in",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const buildUpdatePayload = () => ({
    title: form.title,
    guestName: form.guestName,
    mobileNo: form.mobile,
    mobile: form.mobile,
    email: form.email,
    dob: form.dob,
    gender: form.gender,
    address: form.address,
    country: form.country,
    state: form.state,
    city: form.city,
    zip: form.zip,
    nationality: form.nationality,
    gstNumber: form.gstIn,
    referredBy: form.referredBy,
    referredName: form.referredName,
    arrivalFrom: form.arrivalFrom,
    departureTo: form.departureTo,
    purposeOfVisit: form.purposeOfVisit,
    businessSource: form.businessSource,
    marketSegment: form.marketSegment,
    company: form.company,
    voucherNo: form.voucherNo,
    checkInDate: form.checkInDate,
    checkInTime: form.checkInTime,
    checkOutDate: form.checkOutDate,
    checkOutTime: form.checkOutTime,
    nights: Number(form.noOfNights) || 1,
    stayType: form.stayType,
    occupancyType: form.occupancyType,
    checkoutPlan: form.checkoutPlan,
    guestClassification: form.guestClassification,
    roomNumber: form.roomNo,
    planType: form.planType,
    planCharge: Number(form.planCharge) || 0,
    foodCharge: Number(form.foodCharge) || 0,
    planCharges: Number(form.planCharge) || 0,
    foodCharges: Number(form.foodCharge) || 0,
    discount: Number(form.discount) || 0,
    netAmount: Number(form.netAmount) || 0,
    guestType: form.guestType,
    noOfBeds: Number(form.noOfBeds) || 0,
    adultMale: Number(form.paxAdultMale) || 1,
    adultFemale: Number(form.paxAdultFemale) || 0,
    children: Number(form.paxChildren) || 0,
    paymentMode: form.paymentMode,
    advanceAmount: Number(form.advanceAmount) || 0,
    ledgerAccount: form.ledgerAc,
    remarks: form.remark,
    idProofType: form.idProofType,
    idProofNumber: form.idProofNumber,
    vehicleNo: form.vehicleNo,
    vehicleType: form.vehicleType,
    gstInclusive,
    companions: companions.filter(c => c.name || c.mobile || c.idType || c.idNumber),
    companyInfo: {
      companyName: form.companyInfoCompanyName,
      ledgerGroup: form.companyInfoLedgerGroup || null,
      pan: form.companyInfoPan,
      gst: form.companyInfoGst,
      bankAccountNo: form.companyInfoBankAccountNo,
      ifscCode: form.companyInfoIfscCode,
      creditLimit: Number(form.companyInfoCreditLimit) || 0,
      bookingCategory: form.companyInfoBookingCategory || null,
    },
  })

  const handleUpdate = async () => {
    setSubmitAttempted(true)
    if (!canUpdate) {
      toast({
        title: "Validation Error",
        description: Object.values(updateValidationErrors)[0] || "Please complete all required fields",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await updateCheckIn(checkInId, buildUpdatePayload(), user?.role)
      const nextOriginal = { ...form }
      setOriginalData(nextOriginal)
      setIsEditing(false)
      toast({
        title: "Success",
        description: "Check-in details updated successfully.",
      })
      router.push("/admin/front-office/in-house")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update check-in",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelEdit = () => {
    if (originalData) {
      setForm(originalData)
      setSelectedRoomType(originalData.roomType)
    }
    setIsEditing(false)
    setSubmitAttempted(false)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleCheckOut = () => {
    if (form.roomNo) {
      router.push(`/admin/front-office/reception/check-out?room=${encodeURIComponent(form.roomNo)}`)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Check-In</h1>
          <p className="text-sm text-muted-foreground">
            {isEditMode ? "View or update existing guest check-in details" : "Register guest arrival and assign room"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {!isEditMode && (
            <div className="flex items-center gap-2">
              <Label htmlFor="reservation-search" className="text-base font-semibold whitespace-nowrap">Reservation ID:</Label>
              <div className="relative">
                <Input
                  id="reservation-search"
                  className="h-8 w-60 md:w-80 lg:w-96  text-xs pr-8"
                  placeholder="Enter ID..."
                  value={reservationSearchId}
                  onChange={(e) => setReservationIdSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReservationSearch()}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-0 top-0 h-8 w-8"
                  onClick={handleReservationSearch}
                  disabled={isFetchingReservation}
                >
                  {isFetchingReservation ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          )}
          {isEditMode && (
            <Badge variant={isEditing ? "default" : "outline"} className="text-xs">
              {isEditing ? "Editing..." : "View Mode"}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">Booking: {form.bookingNo}</Badge>
        </div>
      </div>

      {isLoadingBooking && (
        <Card>
          <CardContent className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading check-in details...
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabType)}
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="guest-info" className={activeTab === "guest-info" ? "" : "data-[state=active]:shadow-none"}>
            Guest Info
          </TabsTrigger>
          <TabsTrigger value="guest-id" className={activeTab === "guest-id" ? "" : "data-[state=active]:shadow-none"}>
            ID Proof
          </TabsTrigger>
          <TabsTrigger value="companion" className={activeTab === "companion" ? "" : "data-[state=active]:shadow-none"}>
            Companions
          </TabsTrigger>
          <TabsTrigger value="vehicle-company" className={activeTab === "vehicle-company" ? "" : "data-[state=active]:shadow-none"}>
            Vehicle/Co.
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Guest Room Info */}
        <TabsContent value="guest-info" className="space-y-4 mt-4">
          <fieldset disabled={isEditMode && !isEditing} className="space-y-4">

            {/* Personal Details + Photo */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Personal Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6">
                  {/* Photo */}
                  <div className="flex flex-col items-center gap-3 flex-shrink-0">
                    <div className="h-28 w-28 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted overflow-hidden">
                      {guestPhoto ? (
                        <img src={guestPhoto} alt="Guest" className="h-full w-full object-cover" />
                      ) : (
                        <UserCircle className="h-12 w-12 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1 text-xs h-7 px-2">
                        <Upload className="h-3 w-3" /> Upload
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1 text-xs h-7 px-2">
                        <Camera className="h-3 w-3" /> Webcam
                      </Button>
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="flex-1 space-y-4">
                    {/* Row 1: Title + Name */}
                    <div className="grid grid-cols-4 gap-4">
                      <FormField label="Title" required>
                        <Select value={form.title} onValueChange={v => handleChange("title", v)} disabled={isFieldDisabled("title")}>
                          <SelectTrigger className={errorClass("title")}><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {renderSetupItems(titleOptions)}
                          </SelectContent>
                        </Select>
                        {fieldError("title") && <p className="mt-1 text-xs text-destructive">{fieldError("title")}</p>}
                      </FormField>
                      <FormField label="Guest Name" required className="col-span-3">
                        <Input className={errorClass("guestName")} value={form.guestName} onChange={e => handleChange("guestName", e.target.value)} placeholder="Full name" disabled={isFieldDisabled("guestName")} />
                        {fieldError("guestName") && <p className="mt-1 text-xs text-destructive">{fieldError("guestName")}</p>}
                      </FormField>
                    </div>

                    {/* Row 2: Mobile, Email, DOB */}
                    <div className="grid grid-cols-3 gap-4">
                      <FormField label="Mobile No" required>
                        <Input className={errorClass("mobile")} value={form.mobile} onChange={e => handleChange("mobile", e.target.value)} placeholder="+91 9876543210" disabled={isFieldDisabled("mobile")} />
                        <div className="mt-1 min-h-5">
                          {mobileLookupStatus === "idle" && !fieldError("mobile") && (
                            <p className="text-xs text-muted-foreground">Enter mobile to auto-fill existing guest</p>
                          )}
                          {mobileLookupStatus === "loading" && (
                            <p className="text-xs text-muted-foreground">Checking existing guest...</p>
                          )}
                          {mobileLookupStatus === "found" && existingGuest && !loadedGuestId && (
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-medium text-amber-600">Existing guest found</p>
                              <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={handleLoadExistingGuest}>
                                Load Details
                              </Button>
                            </div>
                          )}
                          {mobileLookupStatus === "found" && loadedGuestId && (
                            <p className="text-xs font-medium text-green-600">Existing guest loaded</p>
                          )}
                          {mobileLookupStatus === "not-found" && !fieldError("mobile") && (
                            <p className="text-xs font-medium text-green-600">New guest - no existing mobile found</p>
                          )}
                          {mobileLookupStatus === "error" && !fieldError("mobile") && (
                            <p className="text-xs text-destructive">Could not check mobile. Restart backend and try again.</p>
                          )}
                          {fieldError("mobile") && <p className="text-xs text-destructive">{fieldError("mobile")}</p>}
                        </div>
                      </FormField>
                      <FormField label="Email" required>
                        <Input className={errorClass("email")} type="email" value={form.email} onChange={e => handleChange("email", e.target.value)} placeholder="guest@email.com" disabled={isFieldDisabled("email")} />
                        {fieldError("email") && <p className="mt-1 text-xs text-destructive">{fieldError("email")}</p>}
                      </FormField>
                      <FormField label="Date of Birth">
                        <Input type="date" value={form.dob} onChange={e => handleChange("dob", e.target.value)} disabled={isFieldDisabled("dob")} />
                      </FormField>
                    </div>

                    {/* Row 3: Gender, Nationality, GST IN, Register No */}
                    <div className="grid grid-cols-4 gap-4">
                      <FormField label="Gender">
                        <Select value={form.gender} onValueChange={v => handleChange("gender", v)} disabled={isFieldDisabled("gender")}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {renderSetupItems(genderOptions)}
                          </SelectContent>
                        </Select>
                      </FormField>
                      <FormField label="Nationality">
                        <Select value={form.nationality} onValueChange={v => handleChange("nationality", v)} disabled={isFieldDisabled("nationality")}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {renderSetupItems(nationalityOptions)}
                          </SelectContent>
                        </Select>
                      </FormField>
                      <FormField label="GST IN" required>
                        <Input className={errorClass("gstIn")} value={form.gstIn} onChange={e => handleChange("gstIn", e.target.value)} placeholder="GST Number" disabled={isFieldDisabled("gstIn")} />
                        {fieldError("gstIn") && <p className="mt-1 text-xs text-destructive">{fieldError("gstIn")}</p>}
                      </FormField>
                      <FormField label="Register No">
                        <Input value={form.registerNo} onChange={e => handleChange("registerNo", e.target.value)} placeholder="Auto-generated" readOnly className="bg-muted" disabled={isFieldDisabled("registerNo")} />
                      </FormField>
                    </div>

                    {/* Row 4: Address */}
                    <div className="grid grid-cols-4 gap-4">
                      <FormField label="Address" className="col-span-2">
                        <Input value={form.address} onChange={e => handleChange("address", e.target.value)} placeholder="Street address" disabled={isFieldDisabled("address")} />
                      </FormField>
                      <FormField label="Country">
                        <Select value={form.country} onValueChange={v => handleChange("country", v)} disabled={isFieldDisabled("country")}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {renderSetupItems(countryOptions)}
                          </SelectContent>
                        </Select>
                      </FormField>
                      <FormField label="State">
                        <Input value={form.state} onChange={e => handleChange("state", e.target.value)} placeholder="State" disabled={isFieldDisabled("state")} />
                      </FormField>
                    </div>

                    {/* Row 5: City, ZIP */}
                    <div className="grid grid-cols-4 gap-4">
                      <FormField label="City">
                        <Input value={form.city} onChange={e => handleChange("city", e.target.value)} placeholder="City" disabled={isFieldDisabled("city")} />
                      </FormField>
                      <FormField label="ZIP">
                        <Input value={form.zip} onChange={e => handleChange("zip", e.target.value)} placeholder="ZIP Code" disabled={isFieldDisabled("zip")} />
                      </FormField>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Details */}
            <fieldset disabled={isEditMode && isEditing && isStaff} title={isEditMode && isEditing && isStaff ? "Only admin can edit this" : undefined}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Booking Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <FormField label="Referred By" required>
                      <Select value={form.referredBy} onValueChange={v => handleChange("referredBy", v)}>
                        <SelectTrigger className={errorClass("referredBy")}><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {renderSetupItems(referralOptions)}
                        </SelectContent>
                      </Select>
                      {fieldError("referredBy") && <p className="mt-1 text-xs text-destructive">{fieldError("referredBy")}</p>}
                    </FormField>
                    <FormField label="Referred Name" required>
                      <Input className={errorClass("referredName")} value={form.referredName} onChange={e => handleChange("referredName", e.target.value)} placeholder="Name / Company" />
                      {fieldError("referredName") && <p className="mt-1 text-xs text-destructive">{fieldError("referredName")}</p>}
                    </FormField>
                    <FormField label="Arrival From">
                      <Input value={form.arrivalFrom} onChange={e => handleChange("arrivalFrom", e.target.value)} placeholder="City / Airport" />
                    </FormField>
                    <FormField label="Departure To">
                      <Input value={form.departureTo} onChange={e => handleChange("departureTo", e.target.value)} placeholder="City / Airport" />
                    </FormField>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <FormField label="Purpose of Visit">
                      <Select value={form.purposeOfVisit} onValueChange={v => handleChange("purposeOfVisit", v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {renderSetupItems(purposeOfVisitOptions)}
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="Business Source">
                      <Select value={form.businessSource} onValueChange={v => handleChange("businessSource", v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {renderSetupItems(businessSourceOptions)}
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="Market Segment">
                      <Select value={form.marketSegment} onValueChange={v => handleChange("marketSegment", v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {renderSetupItems(marketSegmentOptions)}
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="Company" required>
                      <Input className={errorClass("company")} value={form.company} onChange={e => handleChange("company", e.target.value)} placeholder="Company name" />
                      {fieldError("company") && <p className="mt-1 text-xs text-destructive">{fieldError("company")}</p>}
                    </FormField>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <FormField label="Voucher No">
                      <Input value={form.voucherNo} onChange={e => handleChange("voucherNo", e.target.value)} placeholder="Voucher" />
                    </FormField>
                    <div className="grid grid-cols-2 gap-2">
                      <FormField label="Check-In Date" required>
                        <Input className={errorClass("checkInDate")} type="date" value={form.checkInDate} onChange={e => handleChange("checkInDate", e.target.value)} />
                        {fieldError("checkInDate") && <p className="mt-1 text-xs text-destructive">{fieldError("checkInDate")}</p>}
                      </FormField>
                      <FormField label="Check-In Time" required>
                        <Input className={errorClass("checkInTime")} type="time" value={form.checkInTime} onChange={e => handleChange("checkInTime", e.target.value)} />
                        {fieldError("checkInTime") && <p className="mt-1 text-xs text-destructive">{fieldError("checkInTime")}</p>}
                      </FormField>
                    </div>
                    <FormField label="No of Nights">
                      <Input type="number" min="1" value={form.noOfNights} onChange={e => handleChange("noOfNights", e.target.value)} />
                    </FormField>
                    <FormField label="Checkout Plan" required>
                      <Select value={form.checkoutPlan} onValueChange={v => handleChange("checkoutPlan", v)}>
                        <SelectTrigger className={errorClass("checkoutPlan")}><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {renderSetupItems(checkoutPlanOptions)}
                        </SelectContent>
                      </Select>
                      {fieldError("checkoutPlan") && <p className="mt-1 text-xs text-destructive">{fieldError("checkoutPlan")}</p>}
                    </FormField>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <FormField label="Stay Type" required>
                      <Select value={form.stayType} onValueChange={v => handleChange("stayType", v)}>
                        <SelectTrigger className={errorClass("stayType")}><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {renderSetupItems(stayTypeOptions)}
                        </SelectContent>
                      </Select>
                      {fieldError("stayType") && <p className="mt-1 text-xs text-destructive">{fieldError("stayType")}</p>}
                    </FormField>
                    <FormField label="Occupancy Type" required>
                      <Select value={form.occupancyType} onValueChange={v => handleChange("occupancyType", v)}>
                        <SelectTrigger className={errorClass("occupancyType")}><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {renderSetupItems(occupancyTypeOptions)}
                        </SelectContent>
                      </Select>
                      {fieldError("occupancyType") && <p className="mt-1 text-xs text-destructive">{fieldError("occupancyType")}</p>}
                    </FormField>
                    <FormField label="Guest Classification" required>
                      <Select value={form.guestClassification} onValueChange={v => handleChange("guestClassification", v)}>
                        <SelectTrigger className={errorClass("guestClassification")}><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {renderSetupItems(guestClassificationOptions)}
                        </SelectContent>
                      </Select>
                      {fieldError("guestClassification") && <p className="mt-1 text-xs text-destructive">{fieldError("guestClassification")}</p>}
                    </FormField>
                    <div className="grid grid-cols-2 gap-2">
                      <FormField label="Auto Checkout Date">
                        <Input value={form.checkOutDate} readOnly className="bg-muted" />
                      </FormField>
                      <FormField label="Auto Checkout Time">
                        <Input value={form.checkOutTime} readOnly className="bg-muted" />
                      </FormField>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </fieldset>

            {/* Room & Plan Assignment */}
            <fieldset disabled={isEditMode && isEditing && isStaff} title={isEditMode && isEditing && isStaff ? "Only admin can edit this" : undefined}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Room & Plan Assignment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <FormField label="Room Type" required>
                      <Select value={form.roomType} onValueChange={v => handleChange("roomType", v)} disabled={isFieldDisabled("roomType")}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {uniqueRoomTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="Room No" required>
                      <Select value={form.roomNo} onValueChange={v => handleChange("roomNo", v)} disabled={isFieldDisabled("roomNo")}>
                        <SelectTrigger className={errorClass("roomNo")} title={restrictedFieldTitle("roomNo")}><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {filteredRooms.map(r => (
                            <SelectItem key={r.id} value={r.number}>
                              {r.number} - {r.type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldError("roomNo") && <p className="mt-1 text-xs text-destructive">{fieldError("roomNo")}</p>}
                    </FormField>
                    <FormField label="Plan Type" required>
                      <Select value={form.planType} onValueChange={v => handleChange("planType", v)} disabled={isFieldDisabled("planType")}>
                        <SelectTrigger className={errorClass("planType")} title={restrictedFieldTitle("planType")}><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {ratePlans.map(p => (
                            <SelectItem key={p.code || p._id || p.id} value={p.code || p._id || p.id}>
                              {p.name} ({p.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldError("planType") && <p className="mt-1 text-xs text-destructive">{fieldError("planType")}</p>}
                    </FormField>
                    <FormField label="Plan Charge" required>
                      <Input className={errorClass("planCharge")} type="number" min="0" value={form.planCharge} onChange={e => {
                        handleChange("planCharge", e.target.value);
                        handleChange("planCharges", e.target.value);
                      }} placeholder="0.00" disabled={isFieldDisabled("planCharge")} title={restrictedFieldTitle("planCharge")} />
                      {fieldError("planCharge") && <p className="mt-1 text-xs text-destructive">{fieldError("planCharge")}</p>}
                    </FormField>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <FormField label="Food Charge" required>
                      <Input className={errorClass("foodCharge")} type="number" min="0" value={form.foodCharge} onChange={e => {
                        handleChange("foodCharge", e.target.value);
                        handleChange("foodCharges", e.target.value);
                      }} placeholder="0.00" disabled={isFieldDisabled("foodCharge")} title={restrictedFieldTitle("foodCharge")} />
                      {fieldError("foodCharge") && <p className="mt-1 text-xs text-destructive">{fieldError("foodCharge")}</p>}
                    </FormField>
                    <FormField label="Discount">
                      <Input className={errorClass("discount")} type="number" min="0" value={form.discount} onChange={e => handleChange("discount", e.target.value)} placeholder="0.00" disabled={isFieldDisabled("discount")} title={restrictedFieldTitle("discount")} />
                      {fieldError("discount") && <p className="mt-1 text-xs text-destructive">{fieldError("discount")}</p>}
                    </FormField>
                    <FormField label="Net Amount">
                      <Input className={`${errorClass("netAmount")} bg-muted font-bold`} value={form.netAmount} readOnly disabled={isFieldDisabled("netAmount")} />
                      {fieldError("netAmount") && <p className="mt-1 text-xs text-destructive">{fieldError("netAmount")}</p>}
                    </FormField>
                    <FormField label="Guest Type">
                      <Select value={form.guestType} onValueChange={v => handleChange("guestType", v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {renderSetupItems(guestTypeOptions)}
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="No of Beds">
                      <Input type="number" min="1" value={form.noOfBeds} onChange={e => handleChange("noOfBeds", e.target.value)} placeholder="0" />
                    </FormField>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <FormField label="Adult Male" required>
                      <Input className={errorClass("paxAdultMale")} type="number" min="1" value={form.paxAdultMale} onChange={e => handleChange("paxAdultMale", e.target.value)} />
                      {fieldError("paxAdultMale") && <p className="mt-1 text-xs text-destructive">{fieldError("paxAdultMale")}</p>}
                    </FormField>
                    <FormField label="Adult Female (PAX)">
                      <Input type="number" min="0" value={form.paxAdultFemale} onChange={e => handleChange("paxAdultFemale", e.target.value)} />
                    </FormField>
                    <FormField label="Children (PAX)">
                      <Input type="number" min="0" value={form.paxChildren} onChange={e => handleChange("paxChildren", e.target.value)} />
                    </FormField>
                    <div className="flex items-end pb-2">
                      <div className="flex items-center gap-2">
                        <Checkbox id="gst-inc" checked={gstInclusive} onCheckedChange={(v) => setGstInclusive(!!v)} />
                        <Label htmlFor="gst-inc" className="text-sm">GST Inclusive</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </fieldset>

            {/* Payment & Remarks */}
            <fieldset disabled={isEditMode && isEditing && isStaff} title={isEditMode && isEditing && isStaff ? "Only admin can edit this" : undefined}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Payment & Remarks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <FormField label="Mode of Payment">
                      <Select value={form.paymentMode} onValueChange={v => handleChange("paymentMode", v)} disabled={isFieldDisabled("paymentMode")}>
                        <SelectTrigger title={restrictedFieldTitle("paymentMode")}><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {renderSetupItems(paymentModeOptions)}
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="Advance Amount">
                      <Input type="number" value={form.advanceAmount} onChange={e => handleChange("advanceAmount", e.target.value)} placeholder="0.00" disabled={isFieldDisabled("advanceAmount")} title={restrictedFieldTitle("advanceAmount")} />
                    </FormField>
                    <FormField label="Ledger A/C">
                      <Select value={form.ledgerAc} onValueChange={v => handleChange("ledgerAc", v)} disabled={isFieldDisabled("ledgerAc")}>
                        <SelectTrigger title={restrictedFieldTitle("ledgerAc")}><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {renderSetupItems(ledgerAccountOptions)}
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>
                  <FormField label="Remarks">
                    <Textarea className="min-h-20" value={form.remark} onChange={e => handleChange("remark", e.target.value)} placeholder="Special requests or notes..." />
                  </FormField>
                </CardContent>
              </Card>
            </fieldset>
          </fieldset>

          <div className="flex items-center gap-3 justify-end pb-4">
            {isEditMode ? (
              isEditing ? (
                <>
                  <Button className="gap-2" onClick={handleUpdate} disabled={!canUpdate || isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Update
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={handleCancelEdit} disabled={isLoading}>
                    <X className="h-4 w-4" /> Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button className="gap-2" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={handlePrint}>
                    <FileText className="h-4 w-4" /> Print
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={handleCheckOut}>
                    <LogOut className="h-4 w-4" /> Check-Out
                  </Button>
                </>
              )
            ) : (
              <>
                <Button variant="outline" className="gap-2" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" /> Reset Form
                </Button>
                <Button className="gap-2" onClick={handleSave} disabled={!canCheckIn || isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Check-In
                </Button>
              </>
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Guest ID */}
        <TabsContent value="guest-id" className="space-y-4 mt-4">
          <fieldset disabled={isEditMode && !isEditing} className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">ID Proof Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField label="ID Proof Type">
                    <Select value={form.idProofType} onValueChange={v => handleChange("idProofType", v)} disabled={isFieldDisabled("idProofType")}>
                      <SelectTrigger><SelectValue placeholder="Select ID type" /></SelectTrigger>
                      <SelectContent>
                        {renderSetupItems(idProofTypeOptions)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="ID Proof Number">
                    <Input value={form.idProofNumber} onChange={e => handleChange("idProofNumber", e.target.value)} placeholder="Enter ID number" disabled={isFieldDisabled("idProofNumber")} />
                  </FormField>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">Scan / Upload ID Image</Label>
                  <div className="flex gap-3">
                    <Button variant="outline" className="gap-2">
                      <Upload className="h-4 w-4" /> Upload Front
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Upload className="h-4 w-4" /> Upload Back
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Camera className="h-4 w-4" /> Scan
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="h-40 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted text-sm text-muted-foreground">
                      ID Front
                    </div>
                    <div className="h-40 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted text-sm text-muted-foreground">
                      ID Back
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </fieldset>
          <div className="flex items-center gap-3 justify-end pb-4">
            {isEditMode ? (
              isEditing ? (
                <>
                  <Button className="gap-2" onClick={handleUpdate} disabled={!canUpdate || isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Update
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={handleCancelEdit} disabled={isLoading}>
                    <X className="h-4 w-4" /> Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button className="gap-2" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={handlePrint}>
                    <FileText className="h-4 w-4" /> Print
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={handleCheckOut}>
                    <LogOut className="h-4 w-4" /> Check-Out
                  </Button>
                </>
              )
            ) : (
              <>
                <Button variant="outline" className="gap-2" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" /> Reset Form
                </Button>
                <Button className="gap-2" onClick={handleSave} disabled={!canCheckIn || isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Check-In
                </Button>
              </>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Companion Guest */}
        <TabsContent value="companion" className="space-y-4 mt-4">
          <fieldset
            disabled={isEditMode && (!isEditing || isStaff)}
            className="space-y-4"
            title={isEditMode && isEditing && isStaff ? "Only admin can edit this" : undefined}
          >
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Companion Guests</CardTitle>
                <Button variant="outline" className="gap-2" onClick={addCompanion}>
                  <Plus className="h-4 w-4" /> Add Companion
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {companions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No companion guests added. Click &quot;Add Companion&quot; to register additional guests staying in the same room.
                  </p>
                )}
                {companions.map((comp, i) => (
                  <div key={i} className="rounded-lg border border-border p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Companion {i + 1}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCompanions(companions.filter((_, idx) => idx !== i))}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <FormField label="Name" required>
                        <Input value={comp.name} onChange={e => {
                          const updated = [...companions]; updated[i].name = e.target.value; setCompanions(updated)
                        }} placeholder="Full name" />
                      </FormField>
                      <FormField label="Mobile">
                        <Input value={comp.mobile} onChange={e => {
                          const updated = [...companions]; updated[i].mobile = e.target.value; setCompanions(updated)
                        }} placeholder="Mobile number" />
                      </FormField>
                      <FormField label="ID Type">
                        <Select value={comp.idType} onValueChange={v => {
                          const updated = [...companions]; updated[i].idType = v; setCompanions(updated)
                        }}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {renderSetupItems(idProofTypeOptions)}
                          </SelectContent>
                        </Select>
                      </FormField>
                      <FormField label="ID Number">
                        <Input value={comp.idNumber} onChange={e => {
                          const updated = [...companions]; updated[i].idNumber = e.target.value; setCompanions(updated)
                        }} placeholder="ID number" />
                      </FormField>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </fieldset>
          <div className="flex items-center gap-3 justify-end pb-4">
            {isEditMode ? (
              isEditing ? (
                <>
                  <Button className="gap-2" onClick={handleUpdate} disabled={!canUpdate || isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Update
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={handleCancelEdit} disabled={isLoading}>
                    <X className="h-4 w-4" /> Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button className="gap-2" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={handlePrint}>
                    <FileText className="h-4 w-4" /> Print
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={handleCheckOut}>
                    <LogOut className="h-4 w-4" /> Check-Out
                  </Button>
                </>
              )
            ) : (
              <>
                <Button variant="outline" className="gap-2" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" /> Reset Form
                </Button>
                <Button className="gap-2" onClick={handleSave} disabled={!canCheckIn || isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Check-In
                </Button>
              </>
            )}
          </div>
        </TabsContent>

        {/* Tab 4: Vehicle / Company */}
        <TabsContent value="vehicle-company" className="space-y-4 mt-4">
          <fieldset
            disabled={isEditMode && (!isEditing || isStaff)}
            className="space-y-4"
            title={isEditMode && isEditing && isStaff ? "Only admin can edit this" : undefined}
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Vehicle Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Vehicle Number">
                      <Input value={form.vehicleNo} onChange={e => handleChange("vehicleNo", e.target.value)} placeholder="e.g. KA-01-AB-1234" />
                    </FormField>
                    <FormField label="Vehicle Type">
                      <Select value={form.vehicleType} onValueChange={v => handleChange("vehicleType", v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {renderSetupItems(vehicleTypeOptions)}
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Company Info (Ledger)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Company Name">
                      <Input value={form.companyInfoCompanyName} onChange={e => handleChange("companyInfoCompanyName", e.target.value)} placeholder="Company name" />
                    </FormField>
                    <FormField label="Ledger Group">
                      <Select value={form.companyInfoLedgerGroup} onValueChange={v => handleChange("companyInfoLedgerGroup", v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {renderSetupItems(ledgerGroupOptions)}
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="PAN">
                      <Input value={form.companyInfoPan} onChange={e => handleChange("companyInfoPan", e.target.value)} placeholder="PAN number" />
                    </FormField>
                    <FormField label="GST">
                      <Input value={form.companyInfoGst} onChange={e => handleChange("companyInfoGst", e.target.value)} placeholder="GST number" />
                    </FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Bank A/C No">
                      <Input value={form.companyInfoBankAccountNo} onChange={e => handleChange("companyInfoBankAccountNo", e.target.value)} placeholder="Account number" />
                    </FormField>
                    <FormField label="IFSC Code">
                      <Input value={form.companyInfoIfscCode} onChange={e => handleChange("companyInfoIfscCode", e.target.value)} placeholder="IFSC Code" />
                    </FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Credit Limit">
                      <Input type="number" value={form.companyInfoCreditLimit} onChange={e => handleChange("companyInfoCreditLimit", e.target.value)} placeholder="0.00" />
                    </FormField>
                    <FormField label="Booking Category">
                      <Select value={form.companyInfoBookingCategory} onValueChange={v => handleChange("companyInfoBookingCategory", v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {renderSetupItems(bookingCategoryOptions)}
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>
                </CardContent>
              </Card>
            </div>
          </fieldset>
          <div className="flex items-center gap-3 justify-end pb-4">
            {isEditMode ? (
              isEditing ? (
                <>
                  <Button className="gap-2" onClick={handleUpdate} disabled={!canUpdate || isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Update
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={handleCancelEdit} disabled={isLoading}>
                    <X className="h-4 w-4" /> Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button className="gap-2" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={handlePrint}>
                    <FileText className="h-4 w-4" /> Print
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={handleCheckOut}>
                    <LogOut className="h-4 w-4" /> Check-Out
                  </Button>
                </>
              )
            ) : (
              <>
                <Button variant="outline" className="gap-2" onClick={handleReset}><RotateCcw className="h-4 w-4" /> Reset</Button>
                <Button className="gap-2" onClick={handleSave} disabled={!canCheckIn || isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Check-In
                </Button>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
