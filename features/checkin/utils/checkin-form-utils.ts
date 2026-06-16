import type { Room, Service } from "@/lib/types"
import type { CheckInFormProps, Companion, ExistingGuest, SelectedService } from "../types/checkin.types"
import { normalizeCompanion, toMoneyString } from "./checkin-formatters"

type CheckInMode = NonNullable<CheckInFormProps["mode"]>

export const createInitialCheckInForm = (mode: CheckInMode = "check-in") => ({
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
  extraBeds: "0",
  paxAdultMale: "0",
  paxAdultFemale: "0",
  paxChildren: "0",
  totalPax: "0",
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

export type CheckInFormState = ReturnType<typeof createInitialCheckInForm>

export type MultiRoomContext = {
  bookingGroupId: string
  parentGuestCheckin: string
  linkedRooms: Array<{ roomNumber: string; bookingId?: string; checkinId?: string }>
} | null

export const formatMoney = (value: unknown) => `₹${toMoneyString(Number(value) || 0)}`

export const getRoomTotal = (room: any) => {
  const plan = Number(room.planCharges || room.planCharge || room.amount || 0)
  const food = Number(room.foodCharges || room.foodCharge || 0)
  const discount = Number(room.discount || 0)
  return Math.max(0, plan + food - discount)
}

export const isFoodService = (service: Service) =>
  service.isFood === true ||
  service.category?.toUpperCase() === "FOOD" ||
  service.category?.toUpperCase() === "FOOD & BEVERAGE" ||
  Boolean(service.category?.toUpperCase().includes("FOOD")) ||
  Boolean(service.name?.toUpperCase().includes("FOOD"))

export const findFoodService = (services: Service[]) => services.find(isFoodService)

export const calculateBillingTotals = (
  form: CheckInFormState,
  availableServices: Service[],
  gstInclusive: boolean
) => {
  const roomGstPercent = Number(form.gstPercentage) || 0
  const roomCharge = Math.max(0, Number(form.planCharge) || 0)
  const foodCharge = Math.max(0, Number(form.foodCharge) || 0)
  const nights = Math.max(1, Number(form.noOfNights) || 1)
  const discountPercent = Math.min(100, Math.max(0, Number(form.discount) || 0))
  const discountedRoomCharge = Math.max(0, roomCharge - (roomCharge * discountPercent) / 100)

  const foodService = findFoodService(availableServices)
  const foodGstAmount = foodService?.gstApplicable
    ? (foodCharge * (foodService.gstPercentage || 0)) / 100
    : 0

  const isInclusive = form.gstType === "INCLUSIVE" || gstInclusive
  let roomGstAmount = 0
  if (roomGstPercent > 0) {
    roomGstAmount = isInclusive
      ? discountedRoomCharge - discountedRoomCharge / (1 + roomGstPercent / 100)
      : discountedRoomCharge * (roomGstPercent / 100)
  }

  const nightlyNet =
    (isInclusive ? discountedRoomCharge : discountedRoomCharge + roomGstAmount) +
    foodCharge +
    foodGstAmount
  const totalGst = (roomGstAmount + foodGstAmount) * nights
  const netAmount = nightlyNet * nights

  return {
    gstAmount: totalGst.toFixed(2),
    netAmount: netAmount.toFixed(2),
  }
}

type BuildCheckInPayloadOptions = {
  form: CheckInFormState
  gstInclusive: boolean
  selectedServices: SelectedService[]
  companions: Companion[]
  multiRoomContext: MultiRoomContext
  mode: CheckInMode
}

type MobileLookupStatus = "idle" | "loading" | "found" | "not-found" | "error"

export const getRequiredCheckInFields = (mode: CheckInMode): Array<[keyof CheckInFormState, string]> => {
  const requiredFields: Array<[keyof CheckInFormState, string]> = [
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
  }

  return requiredFields
}

type ValidateCheckInFormOptions = {
  form: CheckInFormState
  mode: CheckInMode
  isEditMode: boolean
  multiRoomContext: MultiRoomContext
  mobileLookupStatus: MobileLookupStatus
  existingGuest: ExistingGuest | null
  loadedGuestId: string
  companions: Companion[]
}

export const validateCheckInForm = ({
  form,
  mode,
  isEditMode,
  multiRoomContext,
  mobileLookupStatus,
  existingGuest,
  loadedGuestId,
  companions,
}: ValidateCheckInFormOptions) => {
  const errors: Record<string, string> = {}

  getRequiredCheckInFields(mode).forEach(([field, label]) => {
    if (!String(form[field] || "").trim()) {
      errors[field] = `${label} is required`
    }
  })

  // Mobile number validation
  const mobile = String(form.mobile || "").trim()
  if (mobile) {
    const digits = mobile.replace(/\D/g, "")
    
    if (mobile.startsWith("+91")) {
      if (digits.length !== 12) {
        errors.mobile = "Indian mobile numbers (+91) must have 10 digits after the country code"
      }
    } else if (digits.length === 10 && !mobile.startsWith("+")) {
      // Valid 10-digit number without country code
    } else {
      if (digits.length < 7 || digits.length > 15) {
        errors.mobile = "Mobile number must be between 7 and 15 digits"
      }
    }
  }

  // Email validation
  const email = String(form.email || "").trim()
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Invalid email address format"
  }

  // Companion validation
  if (companions && companions.length > 0) {
    companions.forEach((c, i) => {
      if (c.name || c.mobile || c.gender || c.type) {
        if (!c.name || !c.gender || !c.type) {
          errors[`companion_${i}`] = `Companion #${i + 1} is missing required fields (Name, Gender, Type)`
        }
        if (c.mobile) {
          const cMobile = c.mobile.trim()
          const digits = cMobile.replace(/\D/g, "")
          if (cMobile.startsWith("+91")) {
            if (digits.length !== 12) {
              errors[`companion_mobile_${i}`] = `Companion #${i + 1} Indian mobile number (+91) must have 10 digits after the country code`
            }
          } else if (digits.length === 10 && !cMobile.startsWith("+")) {
            // Valid 10-digit
          } else {
            if (digits.length < 7 || digits.length > 15) {
              errors[`companion_mobile_${i}`] = `Companion #${i + 1} mobile number must be between 7 and 15 digits`
            }
          }
        }
      }
    })
  }

  if (mode !== "pax") {
    if (form.planCharge && Number(form.planCharge) <= 0) errors.planCharge = "Plan Charge must be greater than 0"
    if (form.foodCharge && (Number(form.foodCharge) < 0 || Number.isNaN(Number(form.foodCharge)))) {
      errors.foodCharge = "Food Charge must be greater than or equal to 0"
    }
    if (Number(form.discount || 0) < 0) errors.discount = "Discount % must not be negative"
    if (Number(form.discount || 0) > 100) errors.discount = "Discount % must not exceed 100"
    if (Number(form.netAmount || 0) < 0) errors.netAmount = "Net Amount must not be negative"
    if (form.extraBeds && (Number(form.extraBeds) < 0 || Number.isNaN(Number(form.extraBeds)))) {
      errors.extraBeds = "Extra Beds must not be negative"
    }
    if (form.paxAdultMale && (Number(form.paxAdultMale) < 0 || Number.isNaN(Number(form.paxAdultMale)))) {
      errors.paxAdultMale = "Adult Male must be greater than or equal to 0"
    }
  }

  if (!isEditMode && !multiRoomContext && mobileLookupStatus === "found" && existingGuest && !loadedGuestId && mode !== "pax") {
    errors.mobile = "Mobile number already exists"
  }

  return errors
}

export const buildCheckInPayload = ({
  form,
  gstInclusive,
  selectedServices,
  companions,
  multiRoomContext,
  mode,
}: BuildCheckInPayloadOptions) => {
  const nights = Math.max(1, Number(form.noOfNights) || 1)
  const nightlyPlanCharge = Math.max(0, Number(form.planCharge) || 0)
  const nightlyFoodCharge = Math.max(0, Number(form.foodCharge) || 0)
  const discountPercent = Math.min(100, Math.max(0, Number(form.discount) || 0))
  const totalPlanCharge = nightlyPlanCharge * nights
  const totalFoodCharge = nightlyFoodCharge * nights
  const discountAmount = totalPlanCharge * (discountPercent / 100)

  return {
    reservationId: form.reservationId || undefined,
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
    planType: form.planType || undefined,
    planCharge: nightlyPlanCharge,
    foodCharge: nightlyFoodCharge,
    planCharges: totalPlanCharge,
    foodCharges: totalFoodCharge,
    discount: discountAmount,
    gstPercentage: Number(form.gstPercentage) || 0,
    gstType: form.gstType || undefined,
    gstAmount: Number(form.gstAmount) || 0,
    netAmount: Number(form.netAmount) || 0,
    guestType: form.guestType,
    noOfBeds: Number(form.noOfBeds) || 0,
    extraBeds: Number(form.extraBeds) || 0,
    adultMale: Number(form.paxAdultMale) || 0,
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
    parentGuestCheckin: form.mainCheckin || multiRoomContext?.parentGuestCheckin || undefined,
    bookingGroupId: multiRoomContext?.bookingGroupId || undefined,
    isPax: mode === "pax",
  }
}

export const hasCurrentRoomDraft = (form: CheckInFormState) =>
  Boolean(form.roomNo || form.roomType || form.planType || Number(form.planCharges || 0) > 0)

export const roomMatchesType = (room: Room, selectedRoomType: string) =>
  room.type === selectedRoomType || room.roomTypeId === selectedRoomType
