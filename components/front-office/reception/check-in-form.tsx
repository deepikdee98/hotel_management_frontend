"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Camera, Upload, UserCircle, Save, RotateCcw, X, FileText, Printer, Plus, Trash2, Loader2, Search, Pencil, LogOut } from "lucide-react"
import {
  createCheckIn,
  getFrontOfficeRooms,
  getSetupRatePlans,
  getFrontOfficeReservationById,
  getGuestByMobile,
  getCheckInById,
  updateCheckIn,
  getInHouseGuests,
  getSetupServices,
  getReferrals,
  getCachedCompanyRegistrations,
  getLookupGuests,
  getSetupRoomTypes,
  getBookingNumberPreview,
  removeLinkedCheckInRoom
} from "@/lib/backend-api"
import { saveGRCardPrintData } from "@/lib/gr-card-utils"
import { useToast } from "@/hooks/use-toast"
import { useSetupOptions } from "@/hooks/use-setup-options"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import type { Room, Service } from "@/lib/types"
import { calculateCheckoutDateTime, type CheckoutPlanMetadata } from "@/lib/pms-helpers"

interface CheckInFormProps {
  mode?: "check-in" | "pax"
  editId?: string
  isEditMode?: boolean
  preSelectedRoomId?: string
  preSelectedRoomNo?: string
}

type TabType = "guest-info" | "guest-id" | "companion" | "vehicle-company"

type Companion = {
  name: string
  mobile: string
  gender: string
  type: string
  idType: string
  idNumber: string
  separateBill: boolean
}

const createEmptyCompanion = (): Companion => ({
  name: "",
  mobile: "",
  gender: "",
  type: "",
  idType: "",
  idNumber: "",
  separateBill: false,
})

const normalizeCompanion = (companion: Partial<Companion> = {}): Companion => ({
  name: String(companion.name || ""),
  mobile: String(companion.mobile || ""),
  gender: String(companion.gender || ""),
  type: String(companion.type || ""),
  idType: String(companion.idType || ""),
  idNumber: String(companion.idNumber || ""),
  separateBill: Boolean(companion.separateBill),
})

const toMoneyString = (value: number | string) => (Number(value) || 0).toFixed(2)

const normalizeRoomTypeName = (name: string) => {
  if (!name) return "";
  const n = name.trim().toLowerCase();
  if (n === 'excutiv' || n === 'excutive') return 'Executive';
  // Capitalize first letter as fallback
  return name.charAt(0).toUpperCase() + name.slice(1);
}

const getNightlyCharge = (singleCharge: unknown, totalCharge: unknown, nights: unknown) => {
  const single = Number(singleCharge)
  if (Number.isFinite(single) && single > 0) return single

  const total = Number(totalCharge)
  const totalNights = Math.max(1, Number(nights) || 1)
  if (Number.isFinite(total) && total > 0) return total / totalNights

  return 0
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
  referredByType?: string
  referredById?: string
  referredByName?: string
  idProofType?: string
  idProofNumber?: string
}

type SelectedService = {
  serviceId: string
  name: string
  price: number
  chargeType: string
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

const multiRoomEditableFields = new Set([
  "roomNo",
  "roomType",
  "planType",
  "planCharge",
  "foodCharge",
  "planCharges",
  "foodCharges",
  "paxAdultMale",
  "paxAdultFemale",
  "paxChildren",
  "totalPax",
  "occupancyType",
])

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

export function CheckInForm({ 
  mode = "check-in", 
  editId = "", 
  isEditMode = false,
  preSelectedRoomId = "",
  preSelectedRoomNo = ""
}: CheckInFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const isStaff = user?.role === "staff"
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingBooking, setIsLoadingBooking] = useState(false)
  const [isEditing, setIsEditing] = useState(isEditMode)
  const [activeTab, setActiveTab] = useState<TabType>("guest-info")
  const [guestPhoto, setGuestPhoto] = useState<string | null>(null)
  const [idProofFront, setIdProofFront] = useState<string | null>(null)
  const [idProofBack, setIdProofBack] = useState<string | null>(null)
  const [selectedRoomType, setSelectedRoomType] = useState("")
  const [gstInclusive, setGstInclusive] = useState(false)
  const [availableServices, setAvailableServices] = useState<Service[]>([])
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([])
  const [companions, setCompanions] = useState<Companion[]>([])

  const [rooms, setRooms] = useState<Room[]>([])
  const [ratePlans, setRatePlans] = useState<any[]>([])
  const [roomTypes, setRoomTypes] = useState<any[]>([])
  const [inHouseGuests, setInHouseGuests] = useState<any[]>([])
  const [referrals, setReferrals] = useState<any[]>([])
  const [guestLookupData, setGuestLookupData] = useState<any[]>([])
  const [reservationSearchId, setReservationIdSearch] = useState("")
  const [isFetchingReservation, setIsFetchingReservation] = useState(false)
  const [mobileLookupStatus, setMobileLookupStatus] = useState<"idle" | "loading" | "found" | "not-found" | "error">("idle")
  const [existingGuest, setExistingGuest] = useState<ExistingGuest | null>(null)
  const [showGuestDialog, setShowGuestDialog] = useState(false)
  const [showPaxSuccessDialog, setShowPaxSuccessDialog] = useState(false)
  const lastCheckedMobile = useRef("")
  const idProofFrontInputRef = useRef<HTMLInputElement | null>(null)
  const idProofBackInputRef = useRef<HTMLInputElement | null>(null)
  const [loadedGuestId, setLoadedGuestId] = useState("")
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [mainGuestInfo, setMainGuestInfo] = useState({ name: "", booking: "" })
  const [bookingPreview, setBookingPreview] = useState("Loading...")
  const [multiRoomContext, setMultiRoomContext] = useState<{
    bookingGroupId: string
    parentGuestCheckin: string
    linkedRooms: Array<{ roomNumber: string; bookingId?: string; checkinId?: string }>
  } | null>(null)
  const [isAddingLinkedRoom, setIsAddingLinkedRoom] = useState(false)
  const [pendingRooms, setPendingRooms] = useState<any[]>([])
  const [showAddMorePop, setShowAddMorePop] = useState(false)

  const [form, setForm] = useState({
    bookingNo: "Auto-generated",
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
    referredByType: "Walk-in",
    referredById: "",
    referredByName: "Walk-in",
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
    amount: "0",
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
    gstPercentage: "0",
    gstType: "",
    gstAmount: "0",
    netAmount: "0",
    guestType: mode === "pax" ? "PAX" : "Regular",
    noOfBeds: "",
    paxAdultMale: "1",
    paxAdultFemale: "0",
    paxChildren: "0",
    totalPax: "1",
    paymentMode: "",
    advanceAmount: "",
    remark: "",
    idProofType: "",
    idProofNumber: "",
    ledgerAc: "",
    vehicleNo: "",
    vehicleType: "",
    companyInfoCompanyName: "",
    companyInfoLedgerGroup: "",
    companyInfoPan: "",
    companyInfoGst: "",
    companyInfoBankAccountNo: "",
    companyInfoIfscCode: "",
    companyInfoCreditLimit: "",
    companyInfoBookingCategory: "",
    planTypeLabel: "",
    mainCheckin: "",
  })

  useEffect(() => {
    if (isEditMode) return

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
  }, [isEditMode])

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
  const requiredStayTypes = ["Walk-in", "In-house", "Complimentary"]
  const stayTypeItems = (() => {
    const setupItems = Array.isArray(stayTypeOptions.data) ? stayTypeOptions.data : []
    const existingValues = new Set(
      setupItems.map((item: any) => String(item?.value || "").trim().toLowerCase()).filter(Boolean)
    )
    const missingItems = requiredStayTypes
      .filter((value) => !existingValues.has(value.toLowerCase()))
      .map((value) => ({ _id: `required-${value}`, value, isActive: true }))
    return [...setupItems, ...missingItems]
  })()

  useEffect(() => {
    if (form.checkInDate && form.checkInTime && form.checkoutPlan) {
      const selectedPlan = checkoutPlanOptions.data.find(opt => opt.value === form.checkoutPlan);

      let metadata = (selectedPlan as any)?.metadata as CheckoutPlanMetadata;

      // Fallback logic for common plans if metadata is missing
      if (!metadata) {
        const planValue = form.checkoutPlan.toLowerCase();
        if (planValue.includes("noon")) {
          metadata = { type: "fixed", time: "12:00" };
        } else if (planValue.includes("24 hour")) {
          metadata = { type: "duration", hours: 24 };
        }
      }

      if (metadata) {
        const result = calculateCheckoutDateTime(
          form.checkInDate,
          form.checkInTime,
          metadata
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

  useEffect(() => {
    // Auto-calculate PAX counts based on Main Guest and Companions
    const isMale = form.gender === "Male";
    const isFemale = form.gender === "Female";

    // Keep a sensible default when gender is not selected yet.
    let adultMale = isMale ? 1 : (!isFemale ? 1 : 0);
    let adultFemale = isFemale ? 1 : 0;
    let children = 0;

    companions.forEach(c => {
      if (c.type === "Adult") {
        if (c.gender === "Male") adultMale++;
        else if (c.gender === "Female") adultFemale++;
      } else if (c.type === "Child") {
        children++;
      }
    });

    setForm(prev => ({
      ...prev,
      paxAdultMale: adultMale.toString(),
      paxAdultFemale: adultFemale.toString(),
      paxChildren: children.toString(),
      totalPax: (adultMale + adultFemale + children).toString()
    }));
  }, [form.gender, companions]);

  useEffect(() => {
    if (!isEditMode && preSelectedRoomNo && rooms.length > 0) {
      const room = rooms.find(r => r.number === preSelectedRoomNo || r.id === preSelectedRoomId)
      if (room) {
        const roomTypeDisplay = room.type || ""
        const selectedType = roomTypes.find(rt => rt.name === roomTypeDisplay || rt.code === roomTypeDisplay || rt._id === room.roomTypeId)
        
        setForm(prev => ({
          ...prev,
          roomNo: room.number,
          roomType: roomTypeDisplay,
          planCharge: toMoneyString(room.price || 0),
          planCharges: toMoneyString(room.price || 0),
          gstPercentage: String(selectedType?.gstPercentage || room.gstPercentage || "0"),
          gstType: String(selectedType?.gstType || room.gstType || "EXCLUSIVE"),
          noOfBeds: String(selectedType?.maxOccupancy || selectedType?.capacity || ""),
        }))
        setSelectedRoomType(roomTypeDisplay)
      }
    }
  }, [preSelectedRoomNo, preSelectedRoomId, rooms, roomTypes, isEditMode])

  useEffect(() => {
    const fetchData = async () => {
      const [roomsResult, plansResult, servicesResult, roomTypesResult] = await Promise.allSettled([
        getFrontOfficeRooms(),
        getSetupRatePlans(),
        getSetupServices(),
        getSetupRoomTypes()
      ])

      if (roomsResult.status === "fulfilled") {
        setRooms(roomsResult.value)
      } else {
        console.error("Failed to fetch rooms:", roomsResult.reason)
      }

      if (plansResult.status === "fulfilled") {
        setRatePlans(plansResult.value)
      } else {
        console.error("Failed to fetch rate plans:", plansResult.reason)
      }

      if (servicesResult.status === "fulfilled") {
        setAvailableServices(servicesResult.value)
      } else {
        console.error("Failed to fetch services:", servicesResult.reason)
      }

      if (roomTypesResult.status === "fulfilled") {
        setRoomTypes(roomTypesResult.value)
      } else {
        console.error("Failed to fetch room types:", roomTypesResult.reason)
      }

      if (mode === "pax") {
        try {
          const inHouseData = await getInHouseGuests();
          setInHouseGuests(inHouseData.data.guests);
        } catch (error) {
          console.error("Failed to fetch in-house guests:", error)
        }
      }
    }
    fetchData()
  }, [mode])

  useEffect(() => {
    if (availableServices.length > 0 && form.foodCharge === "0" && form.planType && !isEditMode) {
      const plan = ratePlans.find((p, index) => {
        const planValue = p._id ?? p.id ?? p.code ?? `${p.name ?? "plan"}-${index}`
        return planValue === form.planType
      })
      const planCode = (plan?.code || "").toUpperCase()

      if (planCode !== "EP") {
        const foodService = availableServices.find(s =>
          s.isFood === true ||
          s.category?.toUpperCase() === "FOOD" ||
          s.category?.toUpperCase() === "FOOD & BEVERAGE" ||
          s.category?.toUpperCase().includes("FOOD") ||
          s.name?.toUpperCase().includes("FOOD")
        )
        if (foodService) {
          setForm(prev => ({ ...prev, foodCharge: foodService.defaultPrice.toString() }))
        }
      }
    }
  }, [availableServices, form.planType, ratePlans, isEditMode]);

  useEffect(() => {
    const fetchReferralData = async () => {
      if (["Travel Agent", "Company", "OTA"].includes(form.referredByType)) {
        try {
          const data = await getReferrals(form.referredByType);
          const cached = getCachedCompanyRegistrations(form.referredByType);
          const merged = new Map([...cached, ...data].map((item: any) => [item._id || item.id || item.code, item]));
          setReferrals(Array.from(merged.values()));
        } catch (error) {
          console.error("Failed to fetch referrals:", error);
          setReferrals(getCachedCompanyRegistrations(form.referredByType));
        }
      } else if (form.referredByType === "Member") {
        try {
          const data = await getLookupGuests();
          setGuestLookupData(data);
        } catch (error) {
          console.error("Failed to fetch guest lookup:", error);
          setGuestLookupData([]);
        }
      } else {
        setReferrals([]);
        setGuestLookupData([]);
      }
    };
    fetchReferralData();
  }, [form.referredByType]);

  useEffect(() => {
    if (isEditMode && editId && rooms.length > 0) {
      const loadBooking = async () => {
        setIsLoadingBooking(true)
        setIsEditing(false)
        try {
          const response = await getCheckInById(editId)
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
    }
  }, [editId, isEditMode, rooms.length])

  useEffect(() => {
    if (isEditMode) return

    const mobile = form.mobile.trim()
    if (mobile.length < 4) {
      setMobileLookupStatus("idle")
      setExistingGuest(null)
      lastCheckedMobile.current = ""
      return
    }

    if (mobile === lastCheckedMobile.current) return

    const timer = window.setTimeout(async () => {
      setMobileLookupStatus("loading")
      try {
        const response = await getGuestByMobile(mobile)
        lastCheckedMobile.current = mobile

        if (response.exists && response.data) {
          setExistingGuest(response.data as ExistingGuest)
          setMobileLookupStatus("found")
          setShowGuestDialog(true)
        } else {
          setExistingGuest(null)
          setMobileLookupStatus("not-found")
        }
      } catch {
        setExistingGuest(null)
        setMobileLookupStatus("error")
      }
    }, 500)

    return () => window.clearTimeout(timer)
  }, [form.mobile, isEditMode])

  const populateFormFromBooking = (booking: any) => {
    const roomNo = String(booking.roomNumber || booking.roomNo || "")
    const matchingRoom = rooms.find(r => r.number === roomNo)
    const roomTypeDisplay = matchingRoom?.type || booking.roomType?.name || booking.roomType?.code || booking.roomType || ""
    const planTypeCode = booking.planType?.code || booking.planType || ""

    const selectedType = roomTypes.find(rt => rt.name === roomTypeDisplay || rt.code === roomTypeDisplay || rt._id === matchingRoom?.roomTypeId);

    const bookingNights = Number(booking.nights || booking.noOfNights || 1) || 1
    const nightlyPlanCharge = getNightlyCharge(booking.planCharge, booking.planCharges, bookingNights)
    const nightlyFoodCharge = getNightlyCharge(booking.foodCharge, booking.foodCharges, bookingNights)

    const normalizedForm = {
      bookingNo: String(booking.bookingNumber || booking.bookingNo || booking.bookingId || ""),
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
      referredByType: String(booking.referredByType || "Walk-in"),
      referredById: String(booking.referredById || ""),
      referredByName: String(booking.referredByName || "Walk-in"),
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
      noOfNights: String(bookingNights),
      stayType: String(booking.stayType || "Walk-in"),
      amount: String(booking.amount || "0"),
      occupancyType: String(booking.occupancyType || "Single"),
      checkoutPlan: String(booking.checkoutPlan || ""),
      guestClassification: String(booking.guestClassification || ""),
      roomNo,
      roomType: roomTypeDisplay,
      planType: planTypeCode,
      planCharge: toMoneyString(nightlyPlanCharge || matchingRoom?.price || 0),
      foodCharge: toMoneyString(nightlyFoodCharge),
      planCharges: toMoneyString(booking.planCharges || nightlyPlanCharge || matchingRoom?.price || 0),
      foodCharges: toMoneyString(booking.foodCharges || nightlyFoodCharge),
      discount: String(booking.discount || "0"),
      gstPercentage: String(booking.gstPercentage || selectedType?.gstPercentage || matchingRoom?.gstPercentage || "0"),
      gstType: String(booking.gstType || selectedType?.gstType || matchingRoom?.gstType || "EXCLUSIVE"),
      gstAmount: String(booking.gstAmount || "0"),
      netAmount: String(booking.netAmount || "0"),
      guestType: String(booking.guestType || (mode === "pax" ? "PAX" : "Regular")),
      noOfBeds: String(booking.noOfBeds || selectedType?.maxOccupancy || selectedType?.capacity || ""),
      paxAdultMale: String(booking.adultMale || booking.paxAdultMale || "1"),
      paxAdultFemale: String(booking.adultFemale || booking.paxAdultFemale || "0"),
      paxChildren: String(booking.children || booking.paxChildren || "0"),
      totalPax: String(booking.totalPax || (Number(booking.adultMale || 0) + Number(booking.adultFemale || 0) + Number(booking.children || 0)) || "1"),
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
      planTypeLabel: String(booking.planType?.name || booking.planTypeLabel || ""),
      mainCheckin: booking.mainCheckin || "",
    }

    setForm(normalizedForm)
    setOriginalData(normalizedForm)
    setSelectedRoomType(roomTypeDisplay)
    setGstInclusive(Boolean(booking.gstInclusive))
    setCompanions(Array.isArray(booking.companions) ? booking.companions.map(normalizeCompanion) : [])
    if (booking.bookingGroupId) {
      setMultiRoomContext({
        bookingGroupId: String(booking.bookingGroupId),
        parentGuestCheckin: String(booking.parentGuestCheckin || booking._id || booking.id || editId || ""),
        linkedRooms: Array.isArray(booking.linkedRooms) ? booking.linkedRooms : [{ roomNumber: roomNo, bookingId: normalizedForm.bookingNo }],
      })
    }
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
          const nightlyReservationPlanCharge = getNightlyCharge(reservation.planCharge, reservation.planCharges || reservation.totalAmount, noOfNights)
          const nightlyReservationFoodCharge = getNightlyCharge(reservation.foodCharge, reservation.foodCharges, noOfNights)

          const selectedType = roomTypes.find(rt => rt.name === resolvedRoomType || rt.code === resolvedRoomType || rt._id === matchingRoom?.roomTypeId);
          const plan = ratePlans.find((p, index) => {
            const planValue = p._id ?? p.id ?? p.code ?? `${p.name ?? "plan"}-${index}`
            return planValue === (reservation.ratePlan || "")
          })

          return {
            ...prev,
            reservationId: reservation.reservationId || reservation.id,
            guestName: reservation.guestName || "",
            mobile: reservation.guestPhone || "",
            email: reservation.guestEmail || "",
            idProofType: reservation.idProofType || "",
            idProofNumber: reservation.idProofNumber || "",
            referredByType: reservation.referredByType || "Walk-in",
            referredById: reservation.referredById || "",
            referredByName: reservation.referredByName || "Walk-in",
            stayType: reservation.stayType || "Walk-in",
            amount: reservation.amount?.toString() || "0",
            roomType: resolvedRoomType,
            roomNo: reservation.roomNumber || "",
            checkInDate: reservation.checkIn ? new Date(reservation.checkIn).toISOString().slice(0, 10) : prev.checkInDate,
            checkInTime: reservation.checkIn ? new Date(reservation.checkIn).toTimeString().slice(0, 5) : prev.checkInTime,
            checkOutDate: reservation.checkOut ? new Date(reservation.checkOut).toISOString().slice(0, 10) : "",
            checkOutTime: reservation.checkOut ? new Date(reservation.checkOut).toTimeString().slice(0, 5) : "",
            noOfNights: noOfNights.toString(),
            advanceAmount: reservation.paidAmount?.toString() || "0",
            planCharge: toMoneyString(nightlyReservationPlanCharge),
            planCharges: toMoneyString(reservation.planCharges || reservation.totalAmount || nightlyReservationPlanCharge),
            foodCharge: toMoneyString(nightlyReservationFoodCharge),
            foodCharges: toMoneyString(reservation.foodCharges || nightlyReservationFoodCharge),
            paymentMode: reservation.paymentMode || "",
            planType: reservation.ratePlan || "",
            planTypeLabel: plan?.name || reservation.ratePlan || "",
            businessSource: reservation.bookingSource || "",
            paxAdultMale: reservation.adults?.toString() || "1",
            paxChildren: reservation.children?.toString() || "0",
            totalPax: (Number(reservation.adults || 1) + Number(reservation.children || 0)).toString(),
            gstPercentage: String(selectedType?.gstPercentage || matchingRoom?.gstPercentage || 0),
            gstType: selectedType?.gstType || matchingRoom?.gstType || "EXCLUSIVE",
            noOfBeds: String(selectedType?.maxOccupancy || selectedType?.capacity || ""),
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
      referredByType: existingGuest.referredByType || prev.referredByType,
      referredById: existingGuest.referredById || prev.referredById,
      referredByName: existingGuest.referredByName || prev.referredByName,
      idProofType: existingGuest.idProofType || prev.idProofType,
      idProofNumber: existingGuest.idProofNumber || prev.idProofNumber,
    }))
    setLoadedGuestId(existingGuest.id || "")
    toast({
      title: "Guest Loaded",
      description: "Existing guest details loaded. You can edit them before check-in.",
    })
    setShowGuestDialog(false)
  }

  const handleChange = (field: string, value: string) => {
    if ((isAddingLinkedRoom || (multiRoomContext && !isEditMode)) && !multiRoomEditableFields.has(field)) return
    if (isEditMode && isEditing && isStaff && !isEditableForStaff(field)) return

    if (field === "mobile") {
      setLoadedGuestId("")
      lastCheckedMobile.current = ""
    }

    setForm(prev => ({ ...prev, [field]: value }))

    if (field === "discount") {
      setForm(prev => {
        return {
          ...prev,
          discount: Math.min(100, Math.max(0, Number(value || 0))).toString(),
        }
      })
    }

    if (field === "checkOutDate") {
      const start = new Date(form.checkInDate)
      const end = new Date(value)
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffTime = end.getTime() - start.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        setForm(prev => ({ ...prev, noOfNights: Math.max(0, diffDays).toString() }))
      }
    }

    if (field === "noOfNights") {
      const start = new Date(form.checkInDate)
      const nights = parseInt(value)
      if (!isNaN(start.getTime()) && !isNaN(nights)) {
        const end = new Date(start)
        end.setDate(start.getDate() + nights)
        setForm(prev => ({
          ...prev,
          checkOutDate: end.toISOString().split("T")[0]
        }))
      }
    }

    if (field === "roomType") {
      setSelectedRoomType(value)
      const selectedType = roomTypes.find(rt => rt.name === value || rt.code === value || rt._id === value);
      if (selectedType) {
        setForm(prev => ({
          ...prev,
          gstPercentage: String(selectedType.gstPercentage || 0),
          gstType: selectedType.gstType || "EXCLUSIVE",
          noOfBeds: String(selectedType.maxOccupancy || selectedType.capacity || ""),
        }))
      }
    }

    if (field === "referredByType") {
      let stayType = "Walk-in";
      let amount = form.amount;
      let referredByName = "";

      if (value === "Walk-in") {
        stayType = "Walk-in";
        referredByName = "Walk-in";
      } else if (value === "In-house") {
        stayType = "In-house";
        referredByName = "In-house";
      } else if (value === "Complimentary") {
        stayType = "Complimentary";
        referredByName = "Complimentary";
        amount = "0";
      } else {
        stayType = "Walk-in";
      }

      setForm(prev => ({
        ...prev,
        referredByType: value,
        stayType,
        amount,
        planCharge: value === "Complimentary" ? "0" : prev.planCharge,
        planCharges: value === "Complimentary" ? "0" : prev.planCharges,
        referredByName,
        referredById: "", // Reset when type changes
      }));
    }

    if (field === "referredById") {
      let name = "";
      if (form.referredByType === "Member") {
        const member = guestLookupData.find(g => g.reservationId === value || g._id === value);
        name = member?.guestName || "";
      } else {
        const referral = referrals.find(r => r._id === value);
        name = referral?.name || "";
      }
      setForm(prev => ({ ...prev, referredById: value, referredByName: name }));
    }

    if (field === "stayType") {
      setForm(prev => ({
        ...prev,
        stayType: value,
        amount: value === "Complimentary" ? "0" : prev.amount,
        planCharge: value === "Complimentary" ? "0" : prev.planCharge,
        planCharges: value === "Complimentary" ? "0" : prev.planCharges,
      }));
    }

    if (field === "roomNo") {
      if (mode === "pax") {
        const selected = inHouseGuests.find(g => g.roomNumber === value || g.checkinId === value);
        if (selected) {
          setMainGuestInfo({
            name: selected.guestName,
            booking: selected.bookingNumber || selected.bookingNo || selected.bookingId,
          });

          // Resolve room type object if possible
          const roomTypeObj = selected.roomType || {};
          const roomTypeName = typeof roomTypeObj === 'object' ? (roomTypeObj.name || roomTypeObj.code || "") : roomTypeObj;

          setForm(prev => ({
            ...prev,
            mainCheckin: selected.checkinId,
            roomNo: selected.roomNumber,
            roomType: roomTypeName,
            planType: selected.planType?.code || selected.planType || "",
            planTypeLabel: selected.planType?.name || selected.planTypeLabel || selected.planType || "",
            planCharge: toMoneyString(getNightlyCharge(selected.planCharge, selected.planCharges, selected.nights)),
            foodCharge: toMoneyString(getNightlyCharge(selected.foodCharge, selected.foodCharges, selected.nights)),
            checkoutPlan: selected.checkoutPlan || "",
          }));

          if (roomTypeName) {
            setSelectedRoomType(roomTypeName);
          }
        }
      } else {
        const room = rooms.find(r => r.number === value)
        if (room) {
          const selectedType = roomTypes.find(rt => rt.name === room.type || rt.code === room.type || rt._id === room.roomTypeId);
          setForm(prev => ({
            ...prev,
            roomType: room.type,
            roomNo: value,
            planCharge: toMoneyString(room.price),
            planCharges: toMoneyString(room.price),
            gstPercentage: String(selectedType?.gstPercentage || room.gstPercentage || 0),
            gstType: selectedType?.gstType || room.gstType || "EXCLUSIVE",
            noOfBeds: String(selectedType?.maxOccupancy || selectedType?.capacity || ""),
          }))
          setSelectedRoomType(room.type)
        }
      }
    }

    if (field === "planType") {
      const plan = ratePlans.find((p, index) => {
        const planValue = p._id ?? p.id ?? p.code ?? `${p.name ?? "plan"}-${index}`
        return planValue === value
      })
      if (plan) {
        const planCode = (plan.code || "").toUpperCase()
        const foodService = availableServices.find(s =>
          s.isFood === true ||
          s.category?.toUpperCase() === "FOOD" ||
          s.category?.toUpperCase() === "FOOD & BEVERAGE" ||
          s.category?.toUpperCase().includes("FOOD") ||
          s.name?.toUpperCase().includes("FOOD")
        )
        let foodCharge = "0"
        if (foodService && planCode !== "EP") {
          foodCharge = toMoneyString(foodService.defaultPrice)
        }
        setForm(prev => ({ ...prev, planType: value, foodCharge, planTypeLabel: plan.name || "" }))
      }
    }
  }

  useEffect(() => {
    const roomGstPercent = Number(form.gstPercentage) || 0
    const roomCharge = Math.max(0, Number(form.planCharge) || 0)
    const foodCharge = Math.max(0, Number(form.foodCharge) || 0)
    const nights = Math.max(1, Number(form.noOfNights) || 1)
    const discountPercent = Math.min(100, Math.max(0, Number(form.discount) || 0))
    const discountedRoomCharge = Math.max(0, roomCharge - (roomCharge * discountPercent / 100))

    // Find Food Service to get its GST settings
    const foodService = availableServices.find(s =>
      s.isFood === true ||
      s.category?.toUpperCase() === "FOOD" ||
      s.category?.toUpperCase() === "FOOD & BEVERAGE" ||
      s.category?.toUpperCase().includes("FOOD") ||
      s.name?.toUpperCase().includes("FOOD")
    )
    let foodGstAmount = 0
    if (foodService?.gstApplicable) {
      foodGstAmount = (foodCharge * (foodService.gstPercentage || 0)) / 100
    }

    const isInclusive = form.gstType === "INCLUSIVE" || gstInclusive
    let roomGstAmount = 0
    if (roomGstPercent > 0) {
      if (isInclusive) {
        roomGstAmount = discountedRoomCharge - discountedRoomCharge / (1 + roomGstPercent / 100)
      } else {
        roomGstAmount = discountedRoomCharge * (roomGstPercent / 100)
      }
    }

    const nightlyNet = (isInclusive ? discountedRoomCharge : discountedRoomCharge + roomGstAmount) + foodCharge + foodGstAmount
    const totalGst = (roomGstAmount + foodGstAmount) * nights
    const net = nightlyNet * nights

    const formattedGst = totalGst.toFixed(2)
    const formattedNet = net.toFixed(2)

    if (form.gstAmount !== formattedGst || form.netAmount !== formattedNet) {
      setForm(prev => ({
        ...prev,
        gstAmount: formattedGst,
        netAmount: formattedNet
      }))
    }
  }, [form.planCharge, form.foodCharge, form.gstPercentage, form.gstType, gstInclusive, availableServices, form.discount, form.noOfNights, form.gstAmount, form.netAmount]);



  const handleIdProofUpload = (side: "front" | "back", file?: File) => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const preview = typeof reader.result === "string" ? reader.result : null
      if (side === "front") {
        setIdProofFront(preview)
      } else {
        setIdProofBack(preview)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleReset = () => {
    setForm({
      bookingNo: "Auto-generated",
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
      referredByType: "Walk-in",
      referredById: "",
      referredByName: "Walk-in",
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
      amount: "0",
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
      gstPercentage: "0",
      gstType: "",
      gstAmount: "0",
      netAmount: "0",
      guestType: mode === "pax" ? "PAX" : "Regular",
      noOfBeds: "",
      paxAdultMale: "1",
      paxAdultFemale: "0",
      paxChildren: "0",
      totalPax: "1",
      paymentMode: "",
      advanceAmount: "",
      remark: "",
      idProofType: "",
      idProofNumber: "",
      ledgerAc: "",
      vehicleNo: "",
      vehicleType: "",
      companyInfoCompanyName: "",
      companyInfoLedgerGroup: "",
      companyInfoPan: "",
      companyInfoGst: "",
      companyInfoBankAccountNo: "",
      companyInfoIfscCode: "",
      companyInfoCreditLimit: "",
      companyInfoBookingCategory: "",
      planTypeLabel: "",
      mainCheckin: "",
    })
    setGuestPhoto(null)
    setIdProofFront(null)
    setIdProofBack(null)
    setCompanions([])
    setExistingGuest(null)
    setLoadedGuestId("")
    setMobileLookupStatus("idle")
    setSubmitAttempted(false)
    setActiveTab("guest-info")
    setMainGuestInfo({ name: "", booking: "" })
    setMultiRoomContext(null)
    setShowAddMorePop(false)
    setIsAddingLinkedRoom(false)
  }

  const handlePrintGRCard = () => {
    saveGRCardPrintData({
      ...form,
      roomNo: form.roomNo || "",
      roomNumber: form.roomNo || "",
      planTypeLabel: form.planTypeLabel || form.planType || "",
    })
    router.push("/admin/front-office/reception/gr-card")
  }

  const buildUpdatePayload = () => {
    const nights = Math.max(1, Number(form.noOfNights) || 1)
    const nightlyPlanCharge = Math.max(0, Number(form.planCharge) || 0)
    const nightlyFoodCharge = Math.max(0, Number(form.foodCharge) || 0)
    const discountPercent = Math.min(100, Math.max(0, Number(form.discount) || 0))
    const totalPlanCharge = nightlyPlanCharge * nights
    const totalFoodCharge = nightlyFoodCharge * nights
    const discountAmount = totalPlanCharge * (discountPercent / 100)

    return {
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
      referredByType: form.referredByType,
      referredById: form.referredById || undefined,
      referredByName: form.referredByName,
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
      nights,
      stayType: form.stayType,
      amount: Number(form.amount) || 0,
      occupancyType: form.occupancyType,
      checkoutPlan: form.checkoutPlan,
      guestClassification: form.guestClassification,
      roomNumber: form.roomNo,
      planType: form.planType,
      planCharge: nightlyPlanCharge,
      foodCharge: nightlyFoodCharge,
      planCharges: totalPlanCharge,
      foodCharges: totalFoodCharge,
      discount: discountAmount,
      gstPercentage: Number(form.gstPercentage) || 0,
      gstType: form.gstType,
      gstAmount: Number(form.gstAmount) || 0,
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
      services: selectedServices,
      companions: companions
        .filter(c => c.name || c.mobile || c.idType || c.idNumber || c.gender || c.type)
        .map(normalizeCompanion),
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
      mainCheckin: form.mainCheckin || undefined,
      bookingGroupId: multiRoomContext?.bookingGroupId || undefined,
      parentGuestCheckin: multiRoomContext?.parentGuestCheckin || undefined,
      isPax: mode === "pax",
    }
  }

  const requiredFields: Array<[keyof typeof form, string]> = [
    ["guestName", "Guest Name"],
    ["mobile", "Mobile Number"],
    ["roomNo", "Room Number"],
    ["checkInDate", "Check-in Date"],
    ["checkInTime", "Check-in Time"],
    ["title", "Title"],
    ["referredByType", "Referred By"],
    ["stayType", "Stay Type"],
    ["occupancyType", "Occupancy Type"],
    ["checkoutPlan", "Checkout Plan"],
  ]

  if (mode !== "pax") {
    requiredFields.push(["planType", "Plan Type"])
    requiredFields.push(["planCharge", "Plan Charge"])
    requiredFields.push(["paxAdultMale", "Adult Male"])
  }

  const validationErrors = (() => {
    const errors: Record<string, string> = {}
    requiredFields.forEach(([field, label]) => {
      if (!String(form[field] || "").trim()) {
        errors[field] = `${label} is required`
      }
    })

    if (mode !== "pax") {
      if (form.planCharge && Number(form.planCharge) <= 0) errors.planCharge = "Plan Charge must be greater than 0"
      if (form.foodCharge && (Number(form.foodCharge) < 0 || Number.isNaN(Number(form.foodCharge)))) errors.foodCharge = "Food Charge must be greater than or equal to 0"
      if (Number(form.discount || 0) < 0) errors.discount = "Discount % must not be negative"
      if (Number(form.discount || 0) > 100) errors.discount = "Discount % must not exceed 100"
      if (Number(form.netAmount || 0) < 0) errors.netAmount = "Net Amount must not be negative"
      if (form.paxAdultMale && (Number(form.paxAdultMale) < 1 || Number.isNaN(Number(form.paxAdultMale)))) errors.paxAdultMale = "Adult Male must be at least 1"
    }

    if (!isEditMode && !multiRoomContext && mobileLookupStatus === "found" && existingGuest && !loadedGuestId && mode !== "pax") {
      errors.mobile = "Mobile number already exists"
    }
    return errors
  })()

  const isCheckInValid = Object.keys(validationErrors).length === 0
  const canCheckIn = isCheckInValid && mobileLookupStatus !== "loading"
  const showError = (field: keyof typeof form) => submitAttempted || Boolean(form[field])
  const activeValidationErrors = validationErrors
  const fieldError = (field: keyof typeof form) => showError(field) ? activeValidationErrors[field] : undefined
  const errorClass = (field: keyof typeof form) => fieldError(field) ? "border-destructive focus-visible:ring-destructive" : ""

  const checkRoomCapacity = () => {
    if (mode !== "pax") return true;
    const selectedRoom = rooms.find(r => r.number === form.roomNo);
    if (!selectedRoom) return true;

    // Room Type might have capacity info. Let's assume roomType has 'maxPax' or similar
    // For now, let's look for capacity in the room object or its type
    const capacity = (selectedRoom as any).capacity || (selectedRoom as any).roomType?.capacity || 4;

    // Check current occupancy of this room from inHouseGuests
    // This is a simplification, we should ideally check backend for total current guests in that room
    const currentGuestsCount = inHouseGuests.filter(g => g.roomNumber === form.roomNo).length;

    if (currentGuestsCount >= capacity) {
      toast({
        title: "Capacity Exceeded",
        description: `Room ${form.roomNo} has reached its maximum capacity of ${capacity} guests.`,
        variant: "destructive"
      });
      return false;
    }
    return true;
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const allRooms = [...pendingRooms, buildUpdatePayload()]
      let currentBookingGroupId = multiRoomContext?.bookingGroupId || ""
      let currentParentGuestCheckin = multiRoomContext?.parentGuestCheckin || ""

      for (let i = 0; i < allRooms.length; i++) {
        const payload = {
          ...allRooms[i],
          bookingGroupId: currentBookingGroupId || undefined,
          parentGuestCheckin: currentParentGuestCheckin || undefined,
          guestId: loadedGuestId || undefined,
          existingGuestId: loadedGuestId || undefined,
        }

        const response = await createCheckIn(payload)
        const result = (response as any)?.data || response || {}

        if (i === 0 && !currentBookingGroupId) {
          currentBookingGroupId = result.bookingGroupId || ""
          currentParentGuestCheckin = result.parentGuestCheckin || result.checkinId || ""
        }
      }

      if (mode === "check-in") sessionStorage.removeItem("hotel_checkin_form")

      if (mode === "pax") {
        setShowPaxSuccessDialog(true);
      } else {
        toast({
          title: "Success",
          description: allRooms.length > 1
            ? `Successfully checked-in ${allRooms.length} rooms.`
            : "Guest checked-in successfully.",
        })
        setPendingRooms([])
        setIsAddingLinkedRoom(false)
        router.push("/admin/front-office/in-house")
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to complete check-in", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const confirmAddMore = () => {
    const currentPayload = buildUpdatePayload()
    setPendingRooms(prev => [...prev, currentPayload])
    handleAddAnotherRoom()
    setShowAddMorePop(false)
    toast({ title: "Room Added", description: "Details saved. Please enter details for the next room." })
  }

  const confirmFinalCheckIn = () => {
    setShowAddMorePop(false)
    handleSave()
  }

  const handleFinishCheckIn = () => {
    setShowAddMorePop(false)
    router.push("/admin/front-office/in-house")
  }

  const handleAddAnotherRoom = () => {
    setShowAddMorePop(false)
    const nextLinkedRooms = multiRoomContext?.linkedRooms || []
    setSubmitAttempted(false)
    setActiveTab("guest-info")
    setSelectedRoomType("")
    setSelectedServices([])
    setCompanions([])
    setForm(prev => ({
      ...prev,
      bookingNo: "Auto-generated",
      reservationId: "",
      registerNo: "",
      roomNo: "",
      roomType: "",
      planType: "",
      planTypeLabel: "",
      planCharge: "0",
      foodCharge: "0",
      planCharges: "0",
      foodCharges: "0",
      discount: "0",
      gstPercentage: "0",
      gstType: "",
      gstAmount: "0",
      netAmount: "0",
      amount: "0",
      noOfBeds: "",
      paxAdultMale: "1",
      paxAdultFemale: "0",
      paxChildren: "0",
      totalPax: "1",
      paymentMode: "",
      advanceAmount: "",
      ledgerAc: "",
      remark: "",
      vehicleNo: "",
      vehicleType: "",
    }))
    setMultiRoomContext(prev => prev ? { ...prev, linkedRooms: nextLinkedRooms } : prev)
  }

  const beginLinkedRoomFromDetails = () => {
    if (!multiRoomContext) return
    setIsAddingLinkedRoom(true)
    setIsEditing(false)
    handleAddAnotherRoom()
  }

  const handleRemoveLinkedRoom = async (checkinId?: string) => {
    if (!checkinId) return
    setIsLoading(true)
    try {
      const response = await removeLinkedCheckInRoom(checkinId)
      const result = (response as any)?.data || response || {}
      setMultiRoomContext(prev => prev ? {
        ...prev,
        linkedRooms: Array.isArray(result.linkedRooms)
          ? result.linkedRooms
          : prev.linkedRooms.filter(room => room.checkinId !== checkinId),
      } : prev)
      toast({ title: "Room Removed", description: "Linked room removed from this booking group." })
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to remove linked room", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaxAddAnother = () => {
    const savedRoomNo = form.roomNo;
    const savedMainCheckin = form.mainCheckin;
    const savedMainGuest = { ...mainGuestInfo };
    const savedRoomType = form.roomType;
    const savedSelectedRoomType = selectedRoomType;

    handleReset();

    // Keep room selected for adding more guests
    setForm(prev => ({
      ...prev,
      roomNo: savedRoomNo,
      mainCheckin: savedMainCheckin,
      roomType: savedRoomType
    }));
    setMainGuestInfo(savedMainGuest);
    setSelectedRoomType(savedSelectedRoomType);
    setShowPaxSuccessDialog(false);
  }

  const handleUpdate = async () => {
    setSubmitAttempted(true)
    if (!canCheckIn) {
      toast({ title: "Validation Error", description: Object.values(validationErrors)[0] || "Please complete all required fields", variant: "destructive" })
      return
    }

    // Validate companions
    for (let i = 0; i < companions.length; i++) {
      const c = companions[i];
      if (c.name || c.mobile || c.gender || c.type) {
        if (!c.name || !c.gender || !c.type) {
          toast({
            title: "Companion Info Missing",
            description: `Please provide name, gender, and type for companion #${i + 1}`,
            variant: "destructive"
          });
          setActiveTab("companion");
          return;
        }
      }
    }

    setIsLoading(true)
    try {
      await updateCheckIn(editId, buildUpdatePayload(), user?.role)
      setOriginalData({ ...form })
      setIsEditing(false)
      toast({ title: "Success", description: "Check-in details updated successfully." })
      router.push("/admin/front-office/in-house")
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update check-in", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckInClick = () => {
    setSubmitAttempted(true)
    if (!canCheckIn) {
      const firstError = mobileLookupStatus === "loading"
        ? "Please wait for mobile lookup to finish"
        : Object.values(validationErrors)[0] || "Please complete all required fields"
      toast({ title: "Validation Error", description: firstError, variant: "destructive" });
      return;
    }

    if (!checkRoomCapacity()) return;

    // Validate companions
    for (let i = 0; i < companions.length; i++) {
      const c = companions[i];
      if (c.name || c.mobile || c.gender || c.type) {
        if (!c.name || !c.gender || !c.type) {
          toast({
            title: "Companion Info Missing",
            description: `Please provide name, gender, and type for companion #${i + 1}`,
            variant: "destructive"
          });
          setActiveTab("companion");
          return;
        }
      }
    }

    if (isEditMode && !isAddingLinkedRoom) {
      if (isEditing) {
        handleUpdate()
      }
      return
    }

    if (mode === "pax") {
      handleSave()
    } else {
      setShowAddMorePop(true)
    }
  }

  const handleCancelEdit = () => {
    if (originalData) {
      setForm(originalData)
    }
    setIsEditing(false)
    setSubmitAttempted(false)
  }

  const handleCheckOut = () => {
    router.push("/admin/front-office/reception/check-out")
  }

  const uniqueRoomTypes = Array.from(
    new Map(
      [
        ...roomTypes.map((roomType) => {
          const name = String(roomType.name || roomType.code || roomType._id || "")
          return [
            name,
            { id: name, name }
          ] as const
        }),
        ...rooms.map((room) => [
          room.type,
          { id: room.type, name: room.type }
        ] as const)
      ].filter(([id]) => Boolean(id))
    ).values()
  );

  const baseFilteredRooms = selectedRoomType
    ? rooms.filter(r => r.type === selectedRoomType && r.status === "available")
    : rooms.filter(r => r.status === "available")

  const selectedRoom = form.roomNo ? rooms.find(r => r.number === form.roomNo) : undefined
  const filteredRooms = selectedRoom
    ? [...baseFilteredRooms.filter(r => r.number !== selectedRoom.number), selectedRoom]
    : baseFilteredRooms

  const isRestrictedForStaff = (field: string) => isStaff && staffRestrictedFields.has(field)
  const isEditableForStaff = (field: string) => !isStaff || staffEditableFields.has(field)
  const isFieldDisabled = (field: string) => {
    if (isAddingLinkedRoom) return !multiRoomEditableFields.has(field)
    if (multiRoomContext && !isEditMode && !multiRoomEditableFields.has(field)) return true
    if (isEditMode) return !isEditing || (isStaff && !isEditableForStaff(field))
    return mode === "pax" && (field === "guestType" || (form.roomNo !== "" && field === "roomNo"))
  }

  const restrictedFieldTitle = (field: string) => isEditing && isRestrictedForStaff(field) ? "Only admin can edit this" : undefined

  const renderSetupItems = (options: { data: Array<{ _id: string; value: string }>; loading: boolean }) => {
    if (options.loading) return <SelectItem value="__loading__" disabled>Loading...</SelectItem>
    if (!options.data.length) return <SelectItem value="__empty__" disabled>No options configured</SelectItem>
    return options.data.map((option) => <SelectItem key={option._id} value={option.value}>{option.value}</SelectItem>)
  }

  return (
    <div className="space-y-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {mode === "pax" ? "PAX Check-In" : "Check-In"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditMode ? "View or update existing guest check-in details" :
              mode === "pax" ? "Check-in additional guest in an already occupied room" :
                "Register guest arrival and assign room"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {!isEditMode && mode !== "pax" && (
            <div className="flex items-center gap-2">
              <Label htmlFor="reservation-search" className="text-base font-semibold whitespace-nowrap">Reservation ID:</Label>
              <div className="relative">
                <Input
                  id="reservation-search"
                  className="h-8 w-60 md:w-80 lg:w-96 text-xs pr-8"
                  placeholder="Enter ID..."
                  value={reservationSearchId}
                  onChange={(e) => setReservationIdSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReservationSearch()}
                />
                <Button size="icon" variant="ghost" className="absolute right-0 top-0 h-8 w-8" onClick={handleReservationSearch} disabled={isFetchingReservation}>
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
          <Badge variant="outline" className="text-xs font-semibold">
            Booking ID: {isEditMode ? form.bookingNo || "Pending" : bookingPreview}
          </Badge>
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

      {multiRoomContext && mode === "check-in" && (
        <Card>
          <CardContent className="py-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold">{isAddingLinkedRoom || !isEditMode ? `Adding another room for ${form.guestName}` : "Linked Rooms"}</p>
                <p className="text-xs text-muted-foreground">Group ID: {multiRoomContext.bookingGroupId}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Linked Rooms:</span>
                {multiRoomContext.linkedRooms.length ? (
                  multiRoomContext.linkedRooms.map((room, index) => (
                    <span key={`${room.roomNumber}-${index}`} className="inline-flex items-center gap-1">
                      <Badge variant="secondary">{room.roomNumber}</Badge>
                      {isEditMode && !isAddingLinkedRoom && room.checkinId && room.checkinId !== multiRoomContext.parentGuestCheckin && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive"
                          onClick={() => handleRemoveLinkedRoom(room.checkinId)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </span>
                  ))
                ) : (
                  <Badge variant="outline">Pending</Badge>
                )}
                {isEditMode && !isAddingLinkedRoom && (
                  <Button type="button" size="sm" variant="outline" onClick={beginLinkedRoomFromDetails}>
                    <Plus className="h-4 w-4 mr-1" /> Add Room
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {mode === "pax" && !isEditMode && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Room Selection (Occupied Rooms Only)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Room No" required>
                <Select value={form.roomNo} onValueChange={v => handleChange("roomNo", v)} disabled={form.roomNo !== ""}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select occupied room" /></SelectTrigger>
                  <SelectContent>
                    {inHouseGuests.map((r: any) => (
                      <SelectItem key={r.checkinId} value={r.roomNumber}>
                        {r.roomNumber} - {r.guestName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Main Guest">
                <Input className="h-8 text-xs bg-muted" value={mainGuestInfo.name} readOnly />
              </FormField>
              <FormField label="Main Booking No">
                <Input className="h-8 text-xs bg-muted" value={mainGuestInfo.booking} readOnly />
              </FormField>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="guest-info">Guest Info</TabsTrigger>
          <TabsTrigger value="guest-id">ID Proof</TabsTrigger>
          <TabsTrigger value="companion">Companions</TabsTrigger>
          <TabsTrigger value="vehicle-company">Vehicle/Co.</TabsTrigger>
        </TabsList>

        <TabsContent value="guest-info" className="space-y-4 mt-4">
          <fieldset disabled={isEditMode && !isEditing} className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Personal Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6">
                  <div className="flex flex-col items-center gap-3 shrink-0">
                    <div className="h-28 w-28 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted overflow-hidden">
                      {guestPhoto ? <img src={guestPhoto} alt="Guest" className="h-full w-full object-cover" /> : <UserCircle className="h-12 w-12 text-muted-foreground/40" />}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1 text-xs h-7 px-2"><Upload className="h-3 w-3" /> Upload</Button>
                      <Button variant="outline" size="sm" className="gap-1 text-xs h-7 px-2"><Camera className="h-3 w-3" /> Webcam</Button>
                    </div>
                  </div>

                  <div className="flex-1 space-y-6">
                    {/* Name & Contact */}
                    <div>
                      <div className="grid grid-cols-4 gap-4">
                        <FormField label="Referred By" required>
                          <Select value={form.referredByType} onValueChange={v => handleChange("referredByType", v)}>
                            <SelectTrigger className={errorClass("referredByType")}><SelectValue placeholder="Select Source" /></SelectTrigger>
                            <SelectContent>
                              {["Walk-in", "Travel Agent", "Company", "OTA", "Member", "In-house", "Complimentary"].map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>
                        <FormField label="Referred By Name" required>
                          {["Travel Agent", "Company", "OTA", "Member"].includes(form.referredByType) ? (
                            <Select value={form.referredById} onValueChange={v => handleChange("referredById", v)}>
                              <SelectTrigger className={errorClass("referredById")}><SelectValue placeholder="Select Name" /></SelectTrigger>
                              <SelectContent>
                                {form.referredByType === "Member"
                                  ? guestLookupData.map(g => (
                                    <SelectItem key={g.reservationId || g._id} value={g.reservationId || g._id}>
                                      {g.guestName}
                                    </SelectItem>
                                  ))
                                  : referrals.map(r => (
                                    <SelectItem key={r._id} value={r._id}>
                                      {r.name}
                                    </SelectItem>
                                  ))
                                }
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input value={form.referredByName} readOnly disabled className="bg-muted" />
                          )}
                        </FormField>
                        <FormField label="Register No">
                          <Input value={form.registerNo} placeholder="Auto-generated" readOnly className="bg-muted" disabled={isFieldDisabled("registerNo")} />
                        </FormField>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full gap-2 h-10 border-dashed border-primary/50 text-primary"
                            onClick={() => setActiveTab("companion")}
                          >
                            <Plus className="h-4 w-4" />
                            Add Companion
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="grid grid-cols-4 gap-4">
                        <FormField label="Title" required>
                          <Select value={form.title} onValueChange={v => handleChange("title", v)} disabled={isFieldDisabled("title")}>
                            <SelectTrigger className={errorClass("title")}><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>{renderSetupItems(titleOptions)}</SelectContent>
                          </Select>
                          {fieldError("title") && <p className="mt-1 text-xs text-destructive">{fieldError("title")}</p>}
                        </FormField>
                        <FormField label="Guest Name" required className="col-span-3">
                          <Input className={errorClass("guestName")} value={form.guestName} onChange={e => handleChange("guestName", e.target.value)} placeholder="Full name" disabled={isFieldDisabled("guestName")} />
                          {fieldError("guestName") && <p className="mt-1 text-xs text-destructive">{fieldError("guestName")}</p>}
                        </FormField>

                        <FormField label="Mobile No" required className="col-span-2">
                          <Input className={errorClass("mobile")} value={form.mobile} onChange={e => handleChange("mobile", e.target.value)} placeholder="+91 9876543210 (Enter to auto-fill)" disabled={isFieldDisabled("mobile")} />
                          {(mobileLookupStatus !== "idle" || fieldError("mobile")) && (
                            <div className="mt-1">
                              {mobileLookupStatus === "loading" && <p className="text-xs text-muted-foreground">Checking existing guest...</p>}
                              {mobileLookupStatus === "found" && existingGuest && !loadedGuestId && (
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-medium text-amber-600">Existing guest detected</p>
                                  <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setShowGuestDialog(true)}>Load Details</Button>
                                </div>
                              )}
                              {mobileLookupStatus === "found" && loadedGuestId && <p className="text-xs font-medium text-green-600">Existing guest loaded</p>}
                              {mobileLookupStatus === "not-found" && !fieldError("mobile") && <p className="text-xs font-medium text-green-600">New guest</p>}
                              {mobileLookupStatus === "error" && !fieldError("mobile") && <p className="text-xs text-destructive">Error checking mobile.</p>}
                              {fieldError("mobile") && <p className="text-xs text-destructive">{fieldError("mobile")}</p>}
                            </div>
                          )}
                        </FormField>
                        <FormField label="Email" className="col-span-2">
                          <Input type="email" value={form.email} onChange={e => handleChange("email", e.target.value)} placeholder="guest@email.com" disabled={isFieldDisabled("email")} />
                        </FormField>
                      </div>
                    </div>

                    {/* Personal Info */}
                    <div>
                      <div className="grid grid-cols-4 gap-4">
                        <FormField label="Date of Birth">
                          <Input type="date" value={form.dob} onChange={e => handleChange("dob", e.target.value)} disabled={isFieldDisabled("dob")} />
                        </FormField>
                        <FormField label="Gender">
                          <Select value={form.gender} onValueChange={v => handleChange("gender", v)} disabled={isFieldDisabled("gender")}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>{renderSetupItems(genderOptions)}</SelectContent>
                          </Select>
                        </FormField>
                        <FormField label="Nationality">
                          <Select value={form.nationality} onValueChange={v => handleChange("nationality", v)} disabled={isFieldDisabled("nationality")}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>{renderSetupItems(nationalityOptions)}</SelectContent>
                          </Select>
                        </FormField>
                        <FormField label="Guest Classification" required>
                          <Select value={form.guestClassification} onValueChange={v => handleChange("guestClassification", v)}>
                            <SelectTrigger className={errorClass("guestClassification")}><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>{renderSetupItems(guestClassificationOptions)}</SelectContent>
                          </Select>
                        </FormField>
                      </div>
                    </div>

                    {/* Address & Journey */}
                    <div>
                      <div className="grid grid-cols-4 gap-4">
                        <FormField label="Address" className="col-span-2">
                          <Input value={form.address} onChange={e => handleChange("address", e.target.value)} placeholder="Street address" disabled={isFieldDisabled("address")} />
                        </FormField>
                        <FormField label="Country">
                          <Select value={form.country} onValueChange={v => handleChange("country", v)} disabled={isFieldDisabled("country")}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>{renderSetupItems(countryOptions)}</SelectContent>
                          </Select>
                        </FormField>
                        <FormField label="State">
                          <Input value={form.state} onChange={e => handleChange("state", e.target.value)} placeholder="State" disabled={isFieldDisabled("state")} />
                        </FormField>
                        
                        <FormField label="City">
                          <Input value={form.city} onChange={e => handleChange("city", e.target.value)} placeholder="City" disabled={isFieldDisabled("city")} />
                        </FormField>
                        <FormField label="ZIP Code">
                          <Input value={form.zip} onChange={e => handleChange("zip", e.target.value)} placeholder="ZIP" disabled={isFieldDisabled("zip")} />
                        </FormField>
                        <FormField label="Arrival From">
                          <Input value={form.arrivalFrom} onChange={e => handleChange("arrivalFrom", e.target.value)} placeholder="Origin city" />
                        </FormField>
                        <FormField label="Departure To">
                          <Input value={form.departureTo} onChange={e => handleChange("departureTo", e.target.value)} placeholder="Destination" />
                        </FormField>
                      </div>
                    </div>

                    {/* Business & Purpose */}
                    <div>
                      <div className="grid grid-cols-4 gap-4">
                        <FormField label="Company" className="col-span-2">
                          <Input value={form.company} onChange={e => handleChange("company", e.target.value)} placeholder="Company name" />
                        </FormField>
                        <FormField label="GST IN" className="col-span-2">
                          <Input value={form.gstIn} onChange={e => handleChange("gstIn", e.target.value)} placeholder="GST Number" disabled={isFieldDisabled("gstIn")} />
                        </FormField>

                        <FormField label="Purpose of Visit">
                          <Select value={form.purposeOfVisit} onValueChange={v => handleChange("purposeOfVisit", v)}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>{renderSetupItems(purposeOfVisitOptions)}</SelectContent>
                          </Select>
                        </FormField>
                        <FormField label="Business Source">
                          <Select value={form.businessSource} onValueChange={v => handleChange("businessSource", v)}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>{renderSetupItems(businessSourceOptions)}</SelectContent>
                          </Select>
                        </FormField>
                        <FormField label="Market Segment">
                          <Select value={form.marketSegment} onValueChange={v => handleChange("marketSegment", v)}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>{renderSetupItems(marketSegmentOptions)}</SelectContent>
                          </Select>
                        </FormField>
                        <FormField label="Voucher No">
                          <Input value={form.voucherNo} onChange={e => handleChange("voucherNo", e.target.value)} placeholder="Voucher" />
                        </FormField>
                      </div>
                    </div>

                    {/* Referral & References */}
                   
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Check-In Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-5 gap-4">
                  <FormField label="Check-In Date" required><Input className={errorClass("checkInDate")} type="date" value={form.checkInDate} onChange={e => handleChange("checkInDate", e.target.value)} /></FormField>
                  <FormField label="Check-In Time" required><Input className={errorClass("checkInTime")} type="time" value={form.checkInTime} onChange={e => handleChange("checkInTime", e.target.value)} /></FormField>
                  <FormField label="Checkout Plan" required>
                    <Select value={form.checkoutPlan} onValueChange={v => handleChange("checkoutPlan", v)}><SelectTrigger className={errorClass("checkoutPlan")}><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{renderSetupItems(checkoutPlanOptions)}</SelectContent></Select>
                  </FormField>
                  <FormField label="Check-Out Date (Auto/Editable)">
                    <Input className={errorClass("checkOutDate")} type="date" value={form.checkOutDate} onChange={e => handleChange("checkOutDate", e.target.value)} />
                  </FormField>
                  <FormField label="Check-Out Time (Auto)"><Input value={form.checkOutTime} readOnly className="bg-muted" /></FormField>
                </div>

                <fieldset disabled={(isEditMode && isEditing && isStaff) || mode === "pax"} title={(isEditMode && isEditing && isStaff) || mode === "pax" ? "Read-only in PAX mode" : undefined} className="space-y-4">

                  {/* Room & Dates */}
                  <div>
                    <div className="grid grid-cols-4 gap-4">
                      <FormField label="Room Type" required>
                        <Select value={form.roomType} onValueChange={v => handleChange("roomType", v)} disabled={isFieldDisabled("roomType")}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{uniqueRoomTypes.map((type) => <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </FormField>
                      <FormField label="Room No" required>
                        <Select value={form.roomNo} onValueChange={v => handleChange("roomNo", v)} disabled={isFieldDisabled("roomNo")}>
                          <SelectTrigger className={errorClass("roomNo")} title={restrictedFieldTitle("roomNo")}><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{filteredRooms.map(r => <SelectItem key={r.id} value={r.number}>{r.number} - {r.type}</SelectItem>)}</SelectContent>
                        </Select>
                        {fieldError("roomNo") && <p className="mt-1 text-xs text-destructive">{fieldError("roomNo")}</p>}
                      </FormField>
                      <FormField label="Plan Type" required>
                        <Select
                          value={form.planType}
                          onValueChange={v => {
                            const selectedPlan = ratePlans.find((p, index) => {
                              const optionValue = p._id ?? p.id ?? p.code ?? `${p.name ?? "plan"}-${index}`
                              return optionValue === v
                            })
                            const optionLabel = selectedPlan
                              ? selectedPlan.name ? `${selectedPlan.name}${selectedPlan.code ? ` (${selectedPlan.code})` : ""}` : selectedPlan.code || selectedPlan.id || v
                              : v
                            setForm(prev => ({ ...prev, planType: v, planTypeLabel: optionLabel }))
                          }}
                          disabled={isFieldDisabled("planType")}
                        >
                          <SelectTrigger className={errorClass("planType")} title={restrictedFieldTitle("planType")}><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{ratePlans.map((p, index) => {
                            const optionValue = p._id ?? p.id ?? p.code ?? `${p.name ?? "plan"}-${index}`
                            const optionLabel = p.name ? `${p.name}${p.code ? ` (${p.code})` : ""}` : p.code || p.id || `Plan ${index + 1}`
                            return <SelectItem key={`${optionValue}-${index}`} value={optionValue}>{optionLabel}</SelectItem>
                          })}</SelectContent>
                        </Select>
                        {fieldError("planType") && <p className="mt-1 text-xs text-destructive">{fieldError("planType")}</p>}
                      </FormField>
                      <FormField label="No of Beds"><Input type="number" min="1" value={form.noOfBeds} onChange={e => handleChange("noOfBeds", e.target.value)} placeholder="0" /></FormField>
                    </div>
                  </div>

                  {/* Stay Info */}
                  <div>
                    <div className="grid grid-cols-4 gap-4">
                      <FormField label="Stay Type" required>
                        <Select value={form.stayType} onValueChange={v => handleChange("stayType", v)}>
                          <SelectTrigger className={errorClass("stayType")}><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {stayTypeItems.map((item: any) => {
                              const value = String(item?.value || "")
                              return <SelectItem key={String(item?._id || value)} value={value}>{value}</SelectItem>
                            })}
                          </SelectContent>
                        </Select>
                      </FormField>
                      <FormField label="No of Nights">
                        <Input type="number" min="1" value={form.noOfNights} onChange={e => handleChange("noOfNights", e.target.value)} />
                      </FormField>
                      <FormField label="Occupancy Type" required>
                        <Select value={form.occupancyType} onValueChange={v => handleChange("occupancyType", v)}>
                          <SelectTrigger className={errorClass("occupancyType")}><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{renderSetupItems(occupancyTypeOptions)}</SelectContent>
                        </Select>
                      </FormField>
                      <FormField label="Total PAX"><Input type="number" value={form.totalPax} readOnly className="bg-muted font-bold" /></FormField>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <FormField label="Adult Male" required><Input className={errorClass("paxAdultMale")} type="number" min="1" value={form.paxAdultMale} onChange={e => handleChange("paxAdultMale", e.target.value)} /></FormField>
                      <FormField label="Adult Female (PAX)"><Input type="number" min="0" value={form.paxAdultFemale} onChange={e => handleChange("paxAdultFemale", e.target.value)} /></FormField>
                      <FormField label="Children"><Input type="number" min="0" value={form.paxChildren} onChange={e => handleChange("paxChildren", e.target.value)} /></FormField>
                    </div>
                  </div>

                  {/* Billing Details */}
                  <div>
                    <div className="grid grid-cols-5 gap-4">
                      <FormField label="Plan Charge" required>
                        <Input className={errorClass("planCharge")} type="number" min="0" value={form.planCharge} onChange={e => handleChange("planCharge", e.target.value)} placeholder="0.00" disabled={isFieldDisabled("planCharge")} title={restrictedFieldTitle("planCharge")} />
                        {fieldError("planCharge") && <p className="mt-1 text-xs text-destructive">{fieldError("planCharge")}</p>}
                      </FormField>
                      <FormField label="Discount %">
                        <Input className={errorClass("discount")} type="number" min="0" max="100" value={form.discount} onChange={e => handleChange("discount", e.target.value)} placeholder="0.00" disabled={isFieldDisabled("discount")} title={restrictedFieldTitle("discount")} />
                        {fieldError("discount") && <p className="mt-1 text-xs text-destructive">{fieldError("discount")}</p>}
                      </FormField>
                      <FormField label="Food Charge">
                        <Input className={errorClass("foodCharge")} type="number" min="0" value={form.foodCharge} onChange={e => handleChange("foodCharge", e.target.value)} placeholder="0.00" disabled={isFieldDisabled("foodCharge")} title={restrictedFieldTitle("foodCharge")} />
                        {fieldError("foodCharge") && <p className="mt-1 text-xs text-destructive">{fieldError("foodCharge")}</p>}
                      </FormField>
                      <FormField label="GST %">
                        <Input value={form.gstPercentage} readOnly className="bg-muted text-muted-foreground" />
                      </FormField>
                      <FormField label="Net Amount">
                        <Input className={`${errorClass("netAmount")} bg-muted font-bold`} value={form.netAmount} readOnly disabled={isFieldDisabled("netAmount")} />
                        <p className="mt-1 text-xs text-muted-foreground">Total for {Math.max(1, Number(form.noOfNights) || 1)} night(s)</p>
                      </FormField>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4 bg-muted/30 p-3 rounded-lg border border-border/50">
                      <FormField label="GST Type">
                        <Input value={form.gstType} readOnly className="bg-muted text-muted-foreground" />
                      </FormField>
                      <FormField label="GST Amount">
                        <Input value={form.gstAmount} readOnly className="bg-muted text-muted-foreground" />
                      </FormField>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField label="Mode of Payment">
                        <Select value={form.paymentMode} onValueChange={v => handleChange("paymentMode", v)} disabled={isFieldDisabled("paymentMode")}>
                          <SelectTrigger title={restrictedFieldTitle("paymentMode")}>
                            <SelectValue placeholder="Select Mode" />
                          </SelectTrigger>
                          <SelectContent>{renderSetupItems(paymentModeOptions)}</SelectContent>
                        </Select>
                      </FormField>
                      <FormField label="Advance Amount">
                        <Input
                          type="number"
                          min="0"
                          value={form.advanceAmount}
                          onChange={e => handleChange("advanceAmount", e.target.value)}
                          placeholder="0.00"
                          disabled={isFieldDisabled("advanceAmount")}
                          title={restrictedFieldTitle("advanceAmount")}
                        />
                      </FormField>
                      <FormField label="Ledger A/C">
                        <Select value={form.ledgerAc} onValueChange={v => handleChange("ledgerAc", v)} disabled={isFieldDisabled("ledgerAc")}>
                          <SelectTrigger title={restrictedFieldTitle("ledgerAc")}>
                            <SelectValue placeholder="Select Account" />
                          </SelectTrigger>
                          <SelectContent>{renderSetupItems(ledgerAccountOptions)}</SelectContent>
                        </Select>
                      </FormField>
                    </div>
                  </div>
                  <FormField label="Remarks">
                    <Textarea
                      value={form.remark}
                      onChange={e => handleChange("remark", e.target.value)}
                      placeholder="Special requests or notes..."
                      className="min-h-24"
                    />
                  </FormField>
                </fieldset>
              </CardContent>
            </Card>
          </fieldset>
        </TabsContent>

        <TabsContent value="guest-id" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">ID Proof Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="ID Proof Type" required>
                  <Select value={form.idProofType} onValueChange={v => handleChange("idProofType", v)} disabled={isFieldDisabled("idProofType")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>{renderSetupItems(idProofTypeOptions)}</SelectContent>
                  </Select>
                </FormField>
                <FormField label="ID Proof Number" required>
                  <Input value={form.idProofNumber} onChange={e => handleChange("idProofNumber", e.target.value)} placeholder="Enter ID number" disabled={isFieldDisabled("idProofNumber")} />
                </FormField>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-medium text-muted-foreground">Scan / Upload ID Image</Label>
                <div className="flex flex-wrap gap-3">
                  <input ref={idProofFrontInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleIdProofUpload("front", e.target.files?.[0])} />
                  <input ref={idProofBackInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleIdProofUpload("back", e.target.files?.[0])} />
                  <Button type="button" variant="outline" className="gap-2" onClick={() => idProofFrontInputRef.current?.click()} disabled={isFieldDisabled("idProofType")}>
                    <Upload className="h-4 w-4" /> Upload Front
                  </Button>
                  <Button type="button" variant="outline" className="gap-2" onClick={() => idProofBackInputRef.current?.click()} disabled={isFieldDisabled("idProofType")}>
                    <Upload className="h-4 w-4" /> Upload Back
                  </Button>
                  <Button type="button" variant="outline" className="gap-2" disabled={isFieldDisabled("idProofType")}>
                    <Camera className="h-4 w-4" /> Scan
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="h-48 rounded-lg border border-dashed border-border bg-muted/70 flex items-center justify-center overflow-hidden text-sm text-muted-foreground">
                  {idProofFront ? <img src={idProofFront} alt="ID proof front" className="h-full w-full object-contain" /> : "ID Front"}
                </div>
                <div className="h-48 rounded-lg border border-dashed border-border bg-muted/70 flex items-center justify-center overflow-hidden text-sm text-muted-foreground">
                  {idProofBack ? <img src={idProofBack} alt="ID proof back" className="h-full w-full object-contain" /> : "ID Back"}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="companion" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <CardTitle className="text-base">Companion Details</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCompanions([...companions, createEmptyCompanion()])}
                disabled={isFieldDisabled("companion")}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Companion
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {companions.map((comp, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-8 gap-3 p-3 border rounded-lg bg-muted/30 relative items-end">
                  <FormField label="Name" required>
                    <Input
                      className="h-8 text-xs"
                      value={comp.name}
                      onChange={e => { const nc = [...companions]; nc[idx].name = e.target.value; setCompanions(nc); }}
                      placeholder="Full name"
                      disabled={isFieldDisabled("companion")}
                    />
                  </FormField>
                  <FormField label="Mobile">
                    <Input
                      className="h-8 text-xs"
                      value={comp.mobile}
                      onChange={e => { const nc = [...companions]; nc[idx].mobile = e.target.value; setCompanions(nc); }}
                      placeholder="Mobile"
                      disabled={isFieldDisabled("companion")}
                    />
                  </FormField>
                  <FormField label="Gender" required>
                    <Select
                      value={comp.gender}
                      onValueChange={v => { const nc = [...companions]; nc[idx].gender = v; setCompanions(nc); }}
                      disabled={isFieldDisabled("companion")}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Type" required>
                    <Select
                      value={comp.type}
                      onValueChange={v => { const nc = [...companions]; nc[idx].type = v; setCompanions(nc); }}
                      disabled={isFieldDisabled("companion")}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Adult">Adult</SelectItem>
                        <SelectItem value="Child">Child</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="ID Type">
                    <Select
                      value={comp.idType}
                      onValueChange={v => { const nc = [...companions]; nc[idx].idType = v; setCompanions(nc); }}
                      disabled={isFieldDisabled("companion")}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>{renderSetupItems(idProofTypeOptions)}</SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="ID Number">
                    <Input
                      className="h-8 text-xs"
                      value={comp.idNumber}
                      onChange={e => { const nc = [...companions]; nc[idx].idNumber = e.target.value; setCompanions(nc); }}
                      placeholder="ID number"
                      disabled={isFieldDisabled("companion")}
                    />
                  </FormField>
                  <div className="flex h-8 items-center gap-2">
                    <Checkbox
                      id={`companion-separate-bill-${idx}`}
                      checked={Boolean(comp.separateBill)}
                      onCheckedChange={checked => {
                        const nc = [...companions]
                        nc[idx] = { ...nc[idx], separateBill: Boolean(checked) }
                        setCompanions(nc)
                      }}
                      disabled={isFieldDisabled("companion")}
                    />
                    <Label htmlFor={`companion-separate-bill-${idx}`} className="text-xs leading-tight">
                      Separate Bill
                    </Label>
                  </div>
                  <div className="flex justify-end h-8 items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive h-8 w-8"
                      onClick={() => setCompanions(companions.filter((_, i) => i !== idx))}
                      disabled={isFieldDisabled("companion")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {companions.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-xs italic">
                  No companions added. Click "Add Companion" to add family members or friends.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="vehicle-company" className="mt-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <Card className="min-h-112">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Vehicle Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
                  <FormField label="Vehicle Number">
                    <Input value={form.vehicleNo} onChange={e => handleChange("vehicleNo", e.target.value)} placeholder="e.g. KA-01-AB-1234" />
                  </FormField>
                  <FormField label="Vehicle Type">
                    <Select value={form.vehicleType} onValueChange={v => handleChange("vehicleType", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>{renderSetupItems(vehicleTypeOptions)}</SelectContent>
                    </Select>
                  </FormField>
                </div>
              </CardContent>
            </Card>

            <Card className="min-h-112">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Company Info (Ledger)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Ledger A/C Name">
                    <Input value={form.companyInfoCompanyName} onChange={e => handleChange("companyInfoCompanyName", e.target.value)} placeholder="Ledger account name" />
                  </FormField>
                  <FormField label="Group Head">
                    <Select value={form.companyInfoLedgerGroup} onValueChange={v => handleChange("companyInfoLedgerGroup", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>{renderSetupItems(ledgerGroupOptions)}</SelectContent>
                    </Select>
                  </FormField>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="PAN No">
                    <Input value={form.companyInfoPan} onChange={e => handleChange("companyInfoPan", e.target.value)} placeholder="PAN number" />
                  </FormField>
                  <FormField label="GST No">
                    <Input value={form.companyInfoGst} onChange={e => handleChange("companyInfoGst", e.target.value)} placeholder="GST number" />
                  </FormField>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Bank A/C No">
                    <Input value={form.companyInfoBankAccountNo} onChange={e => handleChange("companyInfoBankAccountNo", e.target.value)} placeholder="Account number" />
                  </FormField>
                  <FormField label="IFSC Code">
                    <Input value={form.companyInfoIfscCode} onChange={e => handleChange("companyInfoIfscCode", e.target.value)} placeholder="IFSC Code" />
                  </FormField>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Credit Limit">
                    <Input type="number" value={form.companyInfoCreditLimit} onChange={e => handleChange("companyInfoCreditLimit", e.target.value)} placeholder="0.00" />
                  </FormField>
                  <FormField label="Booking Category">
                    <Select value={form.companyInfoBookingCategory} onValueChange={v => handleChange("companyInfoBookingCategory", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>{renderSetupItems(bookingCategoryOptions)}</SelectContent>
                    </Select>
                  </FormField>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="payment-remarks" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Payment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <FormField label="Payment Mode">
                  <Select value={form.paymentMode} onValueChange={v => handleChange("paymentMode", v)} disabled={isFieldDisabled("paymentMode")}>
                    <SelectTrigger title={restrictedFieldTitle("paymentMode")}>
                      <SelectValue placeholder="Select Mode" />
                    </SelectTrigger>
                    <SelectContent>{renderSetupItems(paymentModeOptions)}</SelectContent>
                  </Select>
                </FormField>
                <FormField label="Advance Amount">
                  <Input
                    type="number"
                    min="0"
                    value={form.advanceAmount}
                    onChange={e => handleChange("advanceAmount", e.target.value)}
                    placeholder="0.00"
                    disabled={isFieldDisabled("advanceAmount")}
                    title={restrictedFieldTitle("advanceAmount")}
                  />
                </FormField>
                <FormField label="Ledger A/C">
                  <Select value={form.ledgerAc} onValueChange={v => handleChange("ledgerAc", v)} disabled={isFieldDisabled("ledgerAc")}>
                    <SelectTrigger title={restrictedFieldTitle("ledgerAc")}>
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent>{renderSetupItems(ledgerAccountOptions)}</SelectContent>
                  </Select>
                </FormField>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Remarks & Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField label="General Remarks">
                <Textarea
                  value={form.remark}
                  onChange={e => handleChange("remark", e.target.value)}
                  placeholder="Enter any additional notes or specific guest requests..."
                  className="min-h-32"
                />
              </FormField>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-3 justify-end pt-4">
        {isEditMode && !isAddingLinkedRoom ? (
          <>
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancelEdit}><X className="h-4 w-4 mr-2" /> Cancel</Button>
                <Button onClick={handleUpdate} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white"><Save className="h-4 w-4 mr-2" /> Update Details</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}><Pencil className="h-4 w-4 mr-2" /> Edit Details</Button>
                <Button variant="destructive" onClick={handleCheckOut}><LogOut className="h-4 w-4 mr-2" /> Check-Out</Button>
              </>
            )}
          </>
        ) : (
          <>
            <Button variant="outline" onClick={isAddingLinkedRoom ? () => { setIsAddingLinkedRoom(false); router.push("/admin/front-office/in-house") } : handleReset} disabled={isLoading}>
              <RotateCcw className="h-4 w-4 mr-2" /> {isAddingLinkedRoom ? "Cancel" : "Reset"}
            </Button>
            <Button type="button" variant="outline" onClick={handlePrintGRCard} className="gap-2">
              <Printer className="h-4 w-4" /> Print GR Card
            </Button>
            <Button onClick={handleCheckInClick} disabled={!canCheckIn || isLoading} className="bg-green-600 hover:bg-green-700 text-white">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {isAddingLinkedRoom ? "Check-In Room" : "Check-In"}
            </Button>
          </>
        )}
      </div>

      <Dialog open={showGuestDialog} onOpenChange={setShowGuestDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-xl font-bold">Existing guest found</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2 text-sm sm:text-base">
            <p><strong>Name:</strong> {existingGuest?.guestName || existingGuest?.fullName || "N/A"}</p>
            <p><strong>Mobile:</strong> {existingGuest?.gstIn || form.mobile}</p>
            <p className="pt-2">Do you want to load the guest details?</p>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowGuestDialog(false)} className="w-full sm:w-auto">No, continue as new</Button>
            <Button onClick={handleLoadExistingGuest} className="w-full sm:w-auto">Yes, load details</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddMorePop} onOpenChange={setShowAddMorePop}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add Another Room</DialogTitle>
            <DialogDescription className="py-2 text-base">
              Do you want to add another room for this guest before finishing check-in?
            </DialogDescription>
          </DialogHeader>
          {pendingRooms.length > 0 && (
            <div className="space-y-2 py-2">
              <p className="text-sm font-medium">Pending Rooms in Queue:</p>
              <div className="flex flex-wrap gap-2">
                {pendingRooms.map((p, idx) => (
                  <Badge key={idx} variant="secondary">Room {p.roomNumber}</Badge>
                ))}
                <Badge variant="outline" className="border-dashed">Current: Room {form.roomNo}</Badge>
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              onClick={confirmFinalCheckIn}
              className="w-full sm:w-auto bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
            >
              No, Successfully Check-In {pendingRooms.length > 0 ? "Both" : ""}
            </Button>
            <Button onClick={confirmAddMore} className="w-full sm:w-auto">
              Yes, Add More Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaxSuccessDialog} onOpenChange={setShowPaxSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-green-600">PAX Guest Checked-In Successfully</DialogTitle>
            <DialogDescription className="py-2 text-base">
              The additional guest has been registered to Room {form.roomNo}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" onClick={() => router.push("/admin/front-office/in-house")} className="w-full sm:w-auto">
              Go to In-House
            </Button>
            <Button onClick={handlePaxAddAnother} className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto">
              Add Another Guest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
