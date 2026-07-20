import type { Guest, Hotel, Reservation, Room, Staff, Company, TravelAgent, GRCardData, Folio, HousekeepingTask, InventoryItem, POSItem, POSOrder, Service } from "@/lib/types"

export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002"
const TOKEN_STORAGE_KEY = "hotel_manager_tokens"
const AUTH_STORAGE_KEY = "hotel_manager_auth"
const SUBSCRIPTION_STORAGE_KEY = "hotel_manager_subscription"

export type JsonRecord = Record<string, unknown>
const REGISTRATION_CACHE_KEY = "front_office_company_registrations"
let refreshTokenPromise: Promise<string | null> | null = null

export interface SetupOption {
  _id: string
  hotelId: string
  module: string
  type: string
  value: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null
  const raw = sessionStorage.getItem(TOKEN_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as {
      accessToken?: string
      token?: string
      jwt?: string
    }
    return parsed.accessToken || parsed.token || parsed.jwt || null
  } catch {
    return null
  }
}

function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  const raw = sessionStorage.getItem(TOKEN_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as { refreshToken?: string }
    return parsed.refreshToken || null
  } catch {
    return null
  }
}

function storeTokens(accessToken: string, refreshToken?: string) {
  if (typeof window === "undefined") return
  const currentRefreshToken = refreshToken || getStoredRefreshToken()
  sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({ accessToken, refreshToken: currentRefreshToken }))
}

function clearAuthAndRedirect(message?: string) {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(AUTH_STORAGE_KEY)
  sessionStorage.removeItem(TOKEN_STORAGE_KEY)
  sessionStorage.removeItem(SUBSCRIPTION_STORAGE_KEY)
  window.location.href = message ? `/?error=${encodeURIComponent(message)}` : "/"
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) return null

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  })

  if (!response.ok) return null

  const payload = await response.json() as {
    accessToken?: string
    refreshToken?: string
    data?: {
      accessToken?: string
      refreshToken?: string
    }
  }

  const nextAccessToken = payload.accessToken || payload.data?.accessToken
  const nextRefreshToken = payload.refreshToken || payload.data?.refreshToken

  if (!nextAccessToken) return null

  storeTokens(nextAccessToken, nextRefreshToken)
  return nextAccessToken
}

async function getFreshAccessToken() {
  if (!refreshTokenPromise) {
    refreshTokenPromise = refreshAccessToken().finally(() => {
      refreshTokenPromise = null
    })
  }

  return refreshTokenPromise
}

async function requestWithToken(path: string, init: RequestInit | undefined, token: string | null) {
  const url = `${API_BASE_URL}${path}`
  const shouldSendPropertyHeader = !path.startsWith("/front-office/properties")
  
  let activePropId = null;
  if (shouldSendPropertyHeader && typeof window !== "undefined") {
    activePropId = window.localStorage.getItem("activePropertyId");
  }

  try {
    return await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(activePropId ? { "X-Property-Id": activePropId, "x-hotel-id": activePropId } : {}),
        ...(init?.headers || {}),
      },
      cache: "no-store",
    })
  } catch (error) {
    throw new Error(`Unable to reach backend at ${url}. Check that the API server is running and CORS allows this origin.`)
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredAccessToken()
  let response = await requestWithToken(path, init, token)

  if (response.status === 401 && path !== "/auth/refresh") {
    const nextAccessToken = await getFreshAccessToken()
    if (nextAccessToken) {
      response = await requestWithToken(path, init, nextAccessToken)
    }
  }

  if (!response.ok) {
    if ((response.status === 401 || response.status === 403) && typeof window !== "undefined") {
      const text = await response.text()
      let errorData;
      try {
        errorData = JSON.parse(text)
      } catch {
        errorData = { message: text }
      }

      const shouldShowLoginError =
        errorData.code === "HOTEL_INACTIVE" ||
        errorData.code === "SUBSCRIPTION_EXPIRED" ||
        errorData.message?.toLowerCase().includes("deactivated") ||
        errorData.message?.toLowerCase().includes("expired")

      if (response.status === 401 || shouldShowLoginError) {
        clearAuthAndRedirect(shouldShowLoginError ? errorData.message || "Session expired" : undefined)
      }

      throw new Error(errorData.message || `Request failed: ${response.status}`)
    }
    const text = await response.text()
    let errorMessage = text
    try {
      const errorData = JSON.parse(text)
      errorMessage = errorData.message || errorMessage
    } catch {
      // Keep the original response text when it is not JSON.
    }
    throw new Error(errorMessage || `Request failed: ${response.status}`)
  }

  return (await response.json()) as T
}

function toRoomStatus(status?: string): Room["status"] {
  const normalized = String(status || "available").toLowerCase();
  if (["available", "occupied", "reserved", "cleaning", "maintenance", "blocked"].includes(normalized)) {
    return normalized as Room["status"];
  }
  return "available";
}

function toRoomType(value?: string): string {
  return value || "standard"
}

export function mapRoom(raw: JsonRecord): Room {
  const roomType = (raw.roomType || raw.type || raw.roomTypeId) as JsonRecord | string | undefined
  let roomTypeName = "standard"
  let roomTypeId = ""

  if (typeof roomType === "object" && roomType !== null) {
    roomTypeName = String(roomType.name || roomType.code || "standard")
    roomTypeId = String(roomType._id || roomType.id || "")
  } else if (typeof roomType === "string") {
    roomTypeName = roomType
    roomTypeId = roomType
  }

  const rawRoomNo = raw.roomNumber || raw.number || raw.roomNo || ""
  const roomNumberStr = typeof rawRoomNo === "object" && rawRoomNo !== null
    ? String((rawRoomNo as any).roomNumber || (rawRoomNo as any).number || "")
    : String(rawRoomNo)

  const guestName = raw.guestName || (raw.guestDetails as any)?.name || raw.name
  const checkIn = raw.checkIn || raw.checkInDate || raw.checkinDate || raw.checkin || raw.arrivalDate
  const checkOut = raw.checkOut || raw.checkOutDate || raw.checkoutDate || raw.checkout || raw.departureDate
  const phone = raw.phone || raw.mobileNo || raw.mobile || (raw.guestDetails as any)?.phone

  const adults = raw.adults !== undefined ? Number(raw.adults) :
                (raw.adultMale || raw.adultFemale ? (Number(raw.adultMale || 0) + Number(raw.adultFemale || 0)) : undefined)
  const children = raw.children !== undefined ? Number(raw.children) : undefined

  return {
    id: String(raw._id || raw.id || ""),
    number: roomNumberStr,
    floor: Number(raw.floor || 0),
    type: toRoomType(roomTypeName),
    roomTypeId: roomTypeId,
    status: toRoomStatus(String(raw.status || "available")),
    hkStatus: raw.hkStatus as any,
    acType: String(raw.acType || "NON_AC").toUpperCase() === "AC" ? "AC" : "NON_AC",
    price: Number(raw.rate || raw.price || (typeof roomType === "object" && roomType !== null ? roomType.baseRate : 0) || 0),
    gstPercentage: typeof roomType === "object" && roomType !== null ? Number(roomType.gstPercentage || 0) : 0,
    gstType: (typeof roomType === "object" && roomType !== null ? (roomType.gstType as any) : "EXCLUSIVE") || "EXCLUSIVE",
    amenities: Array.isArray(raw.amenities) ? (raw.amenities as string[]) : [],
    guestName: guestName ? String(guestName) : undefined,
    checkIn: checkIn ? String(checkIn) : undefined,
    checkOut: checkOut ? String(checkOut) : undefined,
    bookingId: String(raw.bookingNumber || raw.bookingNo || raw.bookingId || raw.reservationId || ""),
    phone: phone ? String(phone) : undefined,
    adults: adults,
    children: children,
    remainingDays: raw.remainingDays !== undefined ? Number(raw.remainingDays) : undefined,
    checkinId: String(raw.checkinId || raw._id || raw.id || ""),
    folioId: raw.folioId ? String(raw.folioId) : undefined,
    guestDetails: (guestName || checkIn || checkOut || phone || adults !== undefined || children !== undefined) ? {
      name: guestName ? String(guestName) : undefined,
      phone: phone ? String(phone) : undefined,
      checkIn: checkIn ? String(checkIn) : undefined,
      checkOut: checkOut ? String(checkOut) : undefined,
      adults: adults,
      children: children,
      bookingId: String(raw.bookingNumber || raw.bookingNo || raw.bookingId || raw.reservationId || ""),
      checkinId: String(raw.checkinId || raw._id || raw.id || ""),
      folioId: raw.folioId ? String(raw.folioId) : undefined,
    } : undefined,
    blockDetails: raw.blockDetails ? {
      from: String((raw.blockDetails as any).from),
      to: String((raw.blockDetails as any).to),
      reason: String((raw.blockDetails as any).reason)
    } : undefined
  }
}

function normalizeSelectValue(raw: unknown, lookup: Record<string, string>, fallback: string = "") {
  if (raw == null) return fallback
  const value = String(raw).trim()
  const normalized = value.toLowerCase()
  return lookup[normalized] ?? value
}

function getRoomTypeName(rawRoomType: unknown, rawRoom: JsonRecord | undefined): string {
  if (rawRoomType && typeof rawRoomType === "object" && rawRoomType !== null) {
    const roomTypeObj = rawRoomType as JsonRecord
    return String(roomTypeObj.name || roomTypeObj.type || roomTypeObj.code || roomTypeObj._id || roomTypeObj.id || "")
  }

  const value = String(rawRoomType || "").trim()
  if (value && /^[0-9a-f]{24}$/i.test(value) && rawRoom && typeof rawRoom === "object") {
    return String(rawRoom.type || rawRoom.name || "")
  }

  return value
}

function getRatePlanId(rawRatePlan: unknown): string {
  if (rawRatePlan && typeof rawRatePlan === "object" && rawRatePlan !== null) {
    const plan = rawRatePlan as JsonRecord
    return String(plan._id || plan.id || plan.code || "")
  }
  return String(rawRatePlan || "")
}

function getRoomObjectValue(room: unknown, key: string): string {
  if (!room || typeof room !== "object" || room === null) return ""
  const roomObj = room as JsonRecord
  return String(roomObj[key] || roomObj[key === "roomNumber" ? "number" : key] || "")
}

export function mapReservation(raw: JsonRecord): Reservation {
  const checkIn = String(raw.checkInDate || raw.checkIn || "")
  const checkOut = String(raw.checkOutDate || raw.checkOut || "")

  const idProofType = normalizeSelectValue(raw.idProofType, {
    "aadhaar": "Aadhaar Card",
    "aadhaar card": "Aadhaar Card",
    "passport": "Passport",
    "driving license": "Driving License",
    "drivinglicense": "Driving License",
    "voter id": "Voter ID",
    "voterid": "Voter ID",
    "pan": "PAN Card",
    "pan card": "PAN Card",
  })

  const paymentMode = normalizeSelectValue(raw.paymentMode, {
    "cash": "Cash",
    "card": "Card",
    "upi": "UPI",
    "online": "Online",
  })

  const bookingSource = normalizeSelectValue(raw.bookingSource, {
    "walk-in": "Walk-in",
    "walkin": "Walk-in",
    "travel agent": "Travel Agent",
    "travel-agent": "Travel Agent",
    "online": "Online",
    "corporate": "Corporate",
    "other": "Other",
  })

  const roomObject = raw.room
  const roomNumber = String(raw.roomNumber || getRoomObjectValue(roomObject, "roomNumber") || getRoomObjectValue(roomObject, "number") || "")
  const roomId = String(
    raw.roomId ||
    getRoomObjectValue(roomObject, "_id") ||
    getRoomObjectValue(roomObject, "id") ||
    getRoomObjectValue(roomObject, "roomTypeId") ||
    ""
  )

  return {
    id: String(raw._id || raw.id || raw.reservationId || ""),
    reservationId: String(raw.bookingNumber || raw.reservationId || raw.bookingNo || raw.id || raw._id || ""),
    bookingNumber: raw.bookingNumber ? String(raw.bookingNumber) : undefined,
    guestName: String(raw.guestName || ""),
    guestEmail: String(raw.email || raw.guestEmail || ""),
    guestPhone: String(raw.phone || raw.guestPhone || ""),
    guestPhotoUrl: String(raw.guestPhotoUrl || raw.avatar || ""),
    roomId,
    roomNumber,
    roomType: getRoomTypeName(raw.roomType || raw.type || raw.roomTypeId, raw.room as JsonRecord | undefined),
    idProofType: idProofType || undefined,
    idProofNumber: raw.idProofNumber ? String(raw.idProofNumber) : undefined,
    checkIn: checkIn ? new Date(checkIn).toISOString().slice(0, 10) : "",
    checkOut: checkOut ? new Date(checkOut).toISOString().slice(0, 10) : "",
    status: (String(raw.status || "confirmed") as Reservation["status"]),
    adults: raw.adults ? Number(raw.adults) : undefined,
    children: raw.children ? Number(raw.children) : undefined,
    extraBeds: raw.extraBeds ? Number(raw.extraBeds) : undefined,
    totalAmount: Number(raw.totalAmount || 0),
    paidAmount: Number(raw.paidAmount || raw.advanceAmount || 0),
    paymentMode: paymentMode || undefined,
    ratePlan: getRatePlanId(raw.ratePlan || raw.planType),
    bookingSource: bookingSource || undefined,
    referredByType: raw.referredByType ? String(raw.referredByType) : undefined,
    referredById: raw.referredById ? String(raw.referredById) : undefined,
    referredByName: raw.referredByName ? String(raw.referredByName) : undefined,
    stayType: raw.stayType ? String(raw.stayType) : undefined,
    amount: raw.amount ? Number(raw.amount) : undefined,
    createdAt: raw.createdAt ? new Date(String(raw.createdAt)).toISOString().slice(0, 10) : "",
  }
}

export function mapHotel(raw: JsonRecord): Hotel {
  const status = String(raw.status || (raw.isActive ? "active" : "inactive"))
  const company = raw.companyId && typeof raw.companyId === "object" ? raw.companyId as JsonRecord : null
  return {
    id: String(raw._id || raw.id || ""),
    name: String(raw.name || ""),
    address: String(raw.address || ""),
    city: String(raw.city || ""),
    country: String(raw.country || ""),
    phone: String(raw.phone || ""),
    email: String(raw.email || ""),
	    propertyCode: raw.propertyCode ? String(raw.propertyCode) : undefined,
	    companyId: company ? String(company._id || company.id || "") : raw.companyId ? String(raw.companyId) : undefined,
	    companyName: company ? String(company.name || "") : undefined,
	    companyCode: company ? String(company.code || "") : undefined,
	    companySubscriptionPlan: company ? String(company.subscriptionPlan || "") : undefined,
	    companyMaxAllowedProperties: company?.maxAllowedProperties !== undefined ? Number(company.maxAllowedProperties) : undefined,
	    isStandalone: raw.isStandalone !== undefined ? Boolean(raw.isStandalone) : !raw.companyId,
	    modules: Array.isArray(raw.modules) ? (raw.modules as Hotel["modules"]) : [],
    status: status === "active" || status === "inactive" || status === "pending" || status === "suspended" ? status : "inactive",
    isActive: Boolean(raw.isActive ?? true),
    subscriptionStatus: raw.subscriptionStatus as Hotel["subscriptionStatus"],
    subscriptionMessage: raw.subscriptionMessage ? String(raw.subscriptionMessage) : undefined,
    subscriptionIsValid: typeof raw.subscriptionIsValid === "boolean" ? raw.subscriptionIsValid : undefined,
    subscriptionDaysLeft: typeof raw.subscriptionDaysLeft === "number" ? raw.subscriptionDaysLeft : undefined,
    expiryDate: raw.expiryDate ? new Date(String(raw.expiryDate)).toISOString() : "",
    createdAt: raw.createdAt ? new Date(String(raw.createdAt)).toISOString().slice(0, 10) : "",
    roomCount: Number(raw.totalRooms || raw.roomCount || 0),
  }
}

export function mapStaff(raw: JsonRecord): Staff {
  const roleValue = String(raw.role || "staff")
  return {
    id: String(raw._id || raw.id || ""),
    name: String(raw.name || raw.username || ""),
    username: String(raw.username || ""),
    email: String(raw.email || ""),
    phone: String(raw.phone || ""),
    avatar: String(raw.avatar || ""),
    role: roleValue === "hoteladmin" ? "admin" : "staff",
    hotelId: String(raw.hotelId || ""),
    modules: Array.isArray(raw.modules) ? (raw.modules as Staff["modules"]) : [],
    permissions: Array.isArray(raw.permissions) ? (raw.permissions as string[]) : [],
    status: raw.isActive === false ? "inactive" : "active",
    createdAt: raw.createdAt ? new Date(String(raw.createdAt)).toISOString().slice(0, 10) : "",
    lastLogin: raw.lastLogin ? String(raw.lastLogin) : undefined,
  }
}

export function mapGuest(raw: JsonRecord): Guest {
  return {
    id: String(raw._id || raw.id || ""),
    name: String(raw.name || raw.fullName || ""),
    email: String(raw.email || ""),
    phone: String(raw.phone || ""),
    photo: String(raw.guestPhotoUrl || raw.avatar || ""),
    idType: String(raw.idType || ""),
    idNumber: String(raw.idNumber || ""),
    address: String(raw.address || ""),
    nationality: String(raw.country || raw.nationality || ""),
    visits: Number(raw.visits || 0),
    totalSpent: Number(raw.totalSpent || 0),
  }
}
