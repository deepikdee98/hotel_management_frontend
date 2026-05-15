import type { Guest, Hotel, Reservation, Room, Staff, Company, TravelAgent, GRCardData, Folio, HousekeepingTask, InventoryItem, POSItem, POSOrder, Service } from "@/lib/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"
const TOKEN_STORAGE_KEY = "hotel_manager_tokens"

type JsonRecord = Record<string, unknown>
const REGISTRATION_CACHE_KEY = "front_office_company_registrations"

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

function getStoredAccessToken(): string | null {
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

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredAccessToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    cache: "no-store",
  })

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

        sessionStorage.removeItem("hotel_manager_auth")
        sessionStorage.removeItem(TOKEN_STORAGE_KEY)
        sessionStorage.removeItem("hotel_manager_subscription")
        window.location.href = shouldShowLoginError
          ? `/?error=${encodeURIComponent(errorData.message || "Session expired")}`
          : "/"
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

function mapRoom(raw: JsonRecord): Room {
  const roomType = (raw.roomType || raw.type || raw.roomTypeId) as JsonRecord | string | undefined
  let roomTypeName = "standard"
  let roomTypeId = ""

  if (typeof roomType === "object" && roomType !== null) {
    roomTypeName = String(roomType.name || roomType.code || "standard")
    roomTypeId = String(roomType._id || roomType.id || "")
  } else if (typeof roomType === "string") {
    roomTypeName = roomType
    roomTypeId = roomType // If it's just a string, it might be the ID or the Name
  }

  const rawRoomNo = raw.roomNumber || raw.number || raw.roomNo || ""
  const roomNumberStr = typeof rawRoomNo === "object" && rawRoomNo !== null 
    ? String((rawRoomNo as any).roomNumber || (rawRoomNo as any).number || "")
    : String(rawRoomNo)

  return {
    id: String(raw._id || raw.id || ""),
    number: roomNumberStr,
    floor: Number(raw.floor || 0),
    type: toRoomType(roomTypeName),
    roomTypeId: roomTypeId,
    status: toRoomStatus(String(raw.status || "available")),
    hkStatus: raw.hkStatus as any,
    price: Number(raw.rate || raw.price || (typeof roomType === "object" && roomType !== null ? roomType.baseRate : 0) || 0),
    gstPercentage: typeof roomType === "object" && roomType !== null ? Number(roomType.gstPercentage || 0) : 0,
    gstType: (typeof roomType === "object" && roomType !== null ? (roomType.gstType as any) : "EXCLUSIVE") || "EXCLUSIVE",
    amenities: Array.isArray(raw.amenities) ? (raw.amenities as string[]) : [],
    guestName: raw.guestName ? String(raw.guestName) : undefined,
    checkIn: (raw.checkInDate || raw.checkIn || raw.checkinDate || raw.checkin || raw.arrivalDate) ? String(raw.checkInDate || raw.checkIn || raw.checkinDate || raw.checkin || raw.arrivalDate) : undefined,
    checkOut: (raw.checkOutDate || raw.checkOut || raw.checkoutDate || raw.checkout || raw.departureDate) ? String(raw.checkOutDate || raw.checkOut || raw.checkoutDate || raw.checkout || raw.departureDate) : undefined,
    bookingId: (raw.bookingNumber || raw.bookingNo || raw.bookingId) ? String(raw.bookingNumber || raw.bookingNo || raw.bookingId) : undefined,
    phone: (raw.phone || raw.mobileNo || raw.mobile) ? String(raw.phone || raw.mobileNo || raw.mobile) : undefined,
    adults: (raw.adults !== undefined) ? Number(raw.adults) : (Number(raw.adultMale || 0) + Number(raw.adultFemale || 0) || undefined),
    children: raw.children !== undefined ? Number(raw.children) : undefined,
    remainingDays: raw.remainingDays !== undefined ? Number(raw.remainingDays) : undefined,
    checkinId: String(raw.checkinId || raw._id || raw.id || ""),
    guestDetails: (raw.guestName || raw.checkInDate || raw.checkIn || raw.checkinDate || raw.checkin || raw.bookingNumber || raw.bookingNo || raw.mobileNo || raw.phone) ? {
      name: raw.guestName ? String(raw.guestName) : undefined,
      phone: (raw.phone || raw.mobileNo || raw.mobile) ? String(raw.phone || raw.mobileNo || raw.mobile) : undefined,
      checkIn: (raw.checkInDate || raw.checkIn || raw.checkinDate || raw.checkin || raw.arrivalDate) ? String(raw.checkInDate || raw.checkIn || raw.checkinDate || raw.checkin || raw.arrivalDate) : undefined,
      checkOut: (raw.checkOutDate || raw.checkOut || raw.checkoutDate || raw.checkout || raw.departureDate) ? String(raw.checkOutDate || raw.checkOut || raw.checkoutDate || raw.checkout || raw.departureDate) : undefined,
      adults: (raw.adults !== undefined) ? Number(raw.adults) : (Number(raw.adultMale || 0) + Number(raw.adultFemale || 0) || undefined),
      children: raw.children !== undefined ? Number(raw.children) : undefined,
      bookingId: (raw.bookingNumber || raw.bookingNo || raw.bookingId) ? String(raw.bookingNumber || raw.bookingNo || raw.bookingId) : undefined,
      checkinId: String(raw.checkinId || raw._id || raw.id || ""),
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

function mapReservation(raw: JsonRecord): Reservation {
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

function mapHotel(raw: JsonRecord): Hotel {
  const status = String(raw.status || (raw.isActive ? "active" : "inactive"))
  return {
    id: String(raw._id || raw.id || ""),
    name: String(raw.name || ""),
    address: String(raw.address || ""),
    city: String(raw.city || ""),
    country: String(raw.country || ""),
    phone: String(raw.phone || ""),
    email: String(raw.email || ""),
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

function mapStaff(raw: JsonRecord): Staff {
  const roleValue = String(raw.role || "staff")
  return {
    id: String(raw._id || raw.id || ""),
    name: String(raw.name || raw.username || ""),
    username: String(raw.username || ""),
    email: String(raw.email || ""),
    role: roleValue === "hoteladmin" ? "admin" : "staff",
    hotelId: String(raw.hotelId || ""),
    modules: Array.isArray(raw.modules) ? (raw.modules as Staff["modules"]) : [],
    status: raw.isActive === false ? "inactive" : "active",
    createdAt: raw.createdAt ? new Date(String(raw.createdAt)).toISOString().slice(0, 10) : "",
    lastLogin: raw.lastLogin ? String(raw.lastLogin) : undefined,
  }
}

function mapGuest(raw: JsonRecord): Guest {
  return {
    id: String(raw._id || raw.id || ""),
    name: String(raw.name || raw.fullName || ""),
    email: String(raw.email || ""),
    phone: String(raw.phone || ""),
    idType: String(raw.idType || ""),
    idNumber: String(raw.idNumber || ""),
    address: String(raw.address || ""),
    nationality: String(raw.country || raw.nationality || ""),
    visits: Number(raw.visits || 0),
    totalSpent: Number(raw.totalSpent || 0),
  }
}

export async function getAdminDashboard() {
  return apiRequest<{ success: boolean; data: JsonRecord }>("/admin/dashboard")
}

export async function getSuperAdminDashboard() {
  return apiRequest<{ stats: JsonRecord; recentHotels: JsonRecord[] }>("/super-admin/dashboard/stats")
}

export async function getSuperAdminHotels(search?: string): Promise<Hotel[]> {
  const params = new URLSearchParams()
  if (search) params.set("search", search)
  const data = await apiRequest<{ hotels: JsonRecord[] }>(`/super-admin/hotels${params.toString() ? `?${params.toString()}` : ""}`)
  return Array.isArray(data.hotels) ? data.hotels.map(mapHotel) : []
}

export async function createSuperAdminHotel(payload: JsonRecord) {
  return apiRequest<JsonRecord>("/super-admin/hotels", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function requestPasswordReset(identifier: string) {
  return apiRequest<{ success: boolean; message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ identifier }),
  })
}

export async function verifyOtp(identifier: string, otp: string) {
  return apiRequest<{ success: boolean; message: string }>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ identifier, otp }),
  })
}

export async function resetPassword(payload: { identifier: string; password: string; confirmPassword: string }) {
  return apiRequest<{ success: boolean; message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateSuperAdminHotelStatus(id: string, status: "active" | "inactive") {
  return apiRequest<JsonRecord>(`/super-admin/hotels/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

export async function deleteSuperAdminHotel(id: string) {
  return apiRequest<JsonRecord>(`/super-admin/hotels/${id}`, {
    method: "DELETE",
  })
}

export async function updateSuperAdminHotel(id: string, payload: any) {
  return apiRequest(`/super-admin/hotels/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function extendSuperAdminHotelSubscription(id: string) {
  return apiRequest<JsonRecord>(`/super-admin/hotels/${id}/extend-subscription`, {
    method: "PATCH",
  })
}

export async function toggleSuperAdminHotelActive(id: string) {
  return apiRequest<JsonRecord>(`/super-admin/hotels/${id}/toggle-active`, {
    method: "PATCH",
  })
}

export async function getAdminStaff(search?: string, role?: string): Promise<Staff[]> {
  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (role && role !== "all") params.set("role", role === "admin" ? "hoteladmin" : role)
  const data = await apiRequest<JsonRecord[]>(`/admin/staff${params.toString() ? `?${params.toString()}` : ""}`)
  return Array.isArray(data) ? data.map(mapStaff) : []
}

export async function getAdminStaffSummary() {
  return apiRequest<{
    totalStaff: number
    activeStaff: number
    totalAdmins: number
    activeAdmins: number
    admins: number
  }>("/admin/staff/summary")
}

export async function createAdminStaff(payload: JsonRecord) {
  return apiRequest<JsonRecord>("/admin/staff", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateAdminStaffStatus(id: string, isActive: boolean) {
  return apiRequest<JsonRecord>(`/admin/staff/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  })
}

export async function deleteAdminStaff(id: string) {
  return apiRequest<JsonRecord>(`/admin/staff/${id}`, { method: "DELETE" })
}

export async function getFrontOfficeRooms(params?: { search?: string; status?: string }): Promise<Room[]> {
  const query = new URLSearchParams()
  if (params?.search) query.set("search", params.search)
  if (params?.status) query.set("status", params.status)
  const data = await apiRequest<JsonRecord[] | { success: boolean; data?: { rooms?: JsonRecord[] }; rooms?: JsonRecord[] }>(`/front-office/rooms${query.toString() ? `?${query.toString()}` : ""}`)
  const rooms = Array.isArray(data)
    ? data
    : Array.isArray(data.data?.rooms)
      ? data.data.rooms
      : Array.isArray(data.rooms)
        ? data.rooms
        : []
  return rooms.map(mapRoom)
}

export async function getRoomGuests(roomId: string) {
  return apiRequest<{ success: boolean; data: Array<{ id: string; name: string; type: "Main" | "Companion" }> }>(`/front-office/rooms/${roomId}/guests`)
}

export async function updateFrontOfficeRoomStatus(roomId: string, status: Room["status"]) {
  return apiRequest<JsonRecord>(`/front-office/rooms/${roomId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

export async function getFrontOfficeReservations(params?: { search?: string; status?: string }): Promise<Reservation[]> {
  const query = new URLSearchParams()
  if (params?.search) query.set("search", params.search)
  if (params?.status && params.status !== "all") query.set("status", params.status)
  const data = await apiRequest<JsonRecord[] | { success: boolean; data: { reservations: JsonRecord[] } }>(`/front-office/reservations${query.toString() ? `?${query.toString()}` : ""}`)

  if (Array.isArray(data)) {
    return data.map(mapReservation)
  }

  const reservations = Array.isArray(data.data?.reservations) ? data.data.reservations : []
  return reservations.map(mapReservation)
}

export async function getFrontOfficeReservationById(id: string): Promise<Reservation | null> {
  try {
    const data = await apiRequest<JsonRecord>(`/front-office/reservations/${id}`)
    return mapReservation(data)
  } catch {
    return null
  }
}

export async function createFrontOfficeReservation(payload: any) {
  return apiRequest("/front-office/reservations", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateFrontOfficeReservation(id: string, payload: any) {
  return apiRequest<JsonRecord>(`/admin/reservations/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

// export async function createStaffReservation(payload: any) {
//   return apiRequest("/staff/reservations", {
//     method: "POST",
//     body: JSON.stringify(payload),
//   });
// }

export async function updateFrontOfficeReservationStatus(id: string, status: Reservation["status"]) {
  return apiRequest<JsonRecord>(`/admin/reservations/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

export async function getInHouseGuests() {
  return apiRequest<{ success: boolean; data: { guests: JsonRecord[]; summary: JsonRecord } }>("/front-office/in-house")
}

export async function getCheckInData() {
  const [rooms, ratePlans, roomTypes] = await Promise.all([
    getFrontOfficeRooms({ status: "available" }),
    getSetupRatePlans(),
    getSetupRoomTypes()
  ])
  return { rooms, ratePlans, roomTypes }
}

export async function getBookingNumberPreview() {
  const data = await apiRequest<{ success: boolean; preview: string }>("/api/v1/front-office/booking-number/preview")
  return data.preview || "Pending"
}

export async function createCheckIn(payload: JsonRecord) {
  return apiRequest<JsonRecord>("/admin/reception/check-in", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function getCheckInById(id: string) {
  return apiRequest<{ success: boolean; data: JsonRecord }>(`/admin/reception/check-in/${id}`)
}

export async function getGuestByMobile(mobile: string) {
  const query = new URLSearchParams({ mobile })
  return apiRequest<{ success: boolean; exists: boolean; data: JsonRecord | null }>(`/guest/by-mobile?${query.toString()}`)
}

const STAFF_CHECK_IN_UPDATE_FIELDS = new Set([
  "guestName",
  "mobileNo",
  "mobile",
  "address",
  "idProofType",
  "idProofNumber",
  "occupancyType",
])

function sanitizeCheckInUpdatePayload(payload: any, role?: string) {
  if (role !== "staff") return payload

  return Object.fromEntries(
    Object.entries(payload).filter(([field]) => STAFF_CHECK_IN_UPDATE_FIELDS.has(field))
  )
}

export async function updateCheckIn(id: string, payload: any, role?: string) {
  const body = sanitizeCheckInUpdatePayload(payload, role)
  return apiRequest<JsonRecord>(`/admin/reception/check-in/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  })
}

export async function removeLinkedCheckInRoom(id: string) {
  return apiRequest<JsonRecord>(`/admin/reception/check-in/${id}/linked-room`, {
    method: "DELETE",
  })
}

export async function createExpressCheckIn(payload: any) {
  return apiRequest("/front-office/check-in/express", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createPaxCheckIn(checkInId: string, payload: any) {
  return apiRequest(`/front-office/check-in/${checkInId}/pax`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getFolioDetails(folioId: string) {
  return apiRequest<{ success: boolean; data: { folio: Folio } }>(`/front-office/folio/${folioId}`)
}

export async function createCheckOut(payload: any) {
  return apiRequest<{ success: boolean; data: any }>("/front-office/check-out", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function downloadCheckoutInvoice(invoiceId: string) {
  const token = getStoredAccessToken()
  const response = await fetch(`${API_BASE_URL}/front-office/check-out/invoices/${invoiceId}/download`, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || "Failed to download invoice")
  }
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `invoice-${invoiceId}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export async function getGRCard(roomId: string): Promise<GRCardData> {
  const response = await apiRequest<{ success: boolean; data: GRCardData }>(`/admin/reception/check-in/grcard/${roomId}`)
  return response.data
}

export async function getStaffDashboard() {
  return apiRequest<JsonRecord>("/staff/dashboard")
}

export async function getNightAuditStatus(date?: string) {
  const query = date ? `?date=${date}` : ""
  return apiRequest<{ success: boolean; data: any }>(`/front-office/night-audit/status${query}`)
}

export async function runNightAudit(payload: { auditDate?: string; tasks?: Record<string, boolean> }) {
  return apiRequest<{ success: boolean; data: any }>("/front-office/night-audit/run", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

// ==================== REPORTS APIs ====================

export async function getReportDashboard() {
  return apiRequest<{ success: boolean; data: any }>("/reports/dashboard")
}

export async function getReportOccupancy() {
  return apiRequest<{ success: boolean; data: any }>("/reports/occupancy")
}

export async function getReportRevenue() {
  return apiRequest<{ success: boolean; data: any }>("/reports/revenue")
}

export async function getReportGuests() {
  return apiRequest<{ success: boolean; data: any }>("/reports/guests")
}

export async function getStaffReservations() {
  return apiRequest<{ success: boolean; data: { stats: JsonRecord; reservations: JsonRecord[] } }>("/staff/reservations")
}

export async function getStaffGuests(search?: string) {
  const query = new URLSearchParams()
  if (search) query.set("search", search)
  const data = await apiRequest<{ success: boolean; data: { stats: JsonRecord; guests: JsonRecord[] } }>(`/staff/guests${query.toString() ? `?${query.toString()}` : ""}`)
  return {
    stats: data.data.stats,
    guests: Array.isArray(data.data.guests) ? data.data.guests.map(mapGuest) : [],
  }
}

export async function createStaffGuest(payload: JsonRecord) {
  return apiRequest<JsonRecord>("/staff/guests", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function createStaffReservation(payload: JsonRecord) {
  return apiRequest<JsonRecord>("/staff/reservations", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateStaffReservationStatus(id: string, status: string) {
  return apiRequest(`/staff/reservations/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ==================== MODULE & NOTIFICATION APIs ====================

// Module Management APIs
export async function getAvailableModules() {
  return apiRequest<{ success: boolean; data: JsonRecord[] }>("/super-admin/modules")
}

export async function getHotelModules(hotelId: string) {
  return apiRequest<{ success: boolean; data: JsonRecord }>(`/super-admin/hotels/${hotelId}/modules`)
}

export async function updateHotelModules(hotelId: string, modules: string[]) {
  return apiRequest<JsonRecord>(`/super-admin/hotels/${hotelId}/modules`, {
    method: "PUT",
    body: JSON.stringify({ modules }),
  })
}

// Module Request APIs
export async function getModuleRequests(status?: "pending" | "approved" | "rejected") {
  const query = status ? `?status=${status}` : ""
  return apiRequest<{ success: boolean; data: JsonRecord[] }>(`/super-admin/module-requests${query}`)
}

export async function getHotelModuleRequests(hotelId: string) {
  return apiRequest<{ success: boolean; data: JsonRecord[] }>(`/admin/module-requests?hotelId=${hotelId}`)
}

export async function createModuleRequest(payload: JsonRecord) {
  return apiRequest<JsonRecord>("/admin/module-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function approveModuleRequest(requestId: string, hotelId: string, modules: string[]) {
  return apiRequest<JsonRecord>(`/super-admin/module-requests/${requestId}`, {
    method: "PUT",
    body: JSON.stringify({ status: "approved", hotelId, modules }),
  })
}

export async function rejectModuleRequest(requestId: string, reason?: string) {
  return apiRequest<JsonRecord>(`/super-admin/module-requests/${requestId}`, {
    method: "PUT",
    body: JSON.stringify({ status: "rejected", reason }),
  })
}

// Notification APIs - for Super Admin/Hotel to send notifications
export async function sendNotification(payload: JsonRecord) {
  return apiRequest<JsonRecord>("/notifications", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

// Admin sending notifications to hotels about new modules or updates
export async function sendAdminNotification(payload: JsonRecord) {
  return apiRequest<JsonRecord>("/super-admin/notifications/send", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

// Hotel admin sending promotions/notifications to customers
export async function sendHotelNotification(payload: JsonRecord) {
  return apiRequest<JsonRecord>("/admin/notifications/send", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

// Get notifications for current user
export async function getMyNotifications(limit?: number) {
  const query = limit ? `?limit=${limit}` : ""
  return apiRequest<{ success: boolean; data: JsonRecord[] }>(`/notifications${query}`)
}

// Get notifications for super admin (system-wide)
export async function getSuperAdminNotifications(hotelId?: string) {
  const query = hotelId ? `?hotelId=${hotelId}` : ""
  return apiRequest<{ success: boolean; data: JsonRecord[] }>(`/super-admin/notifications${query}`)
}

// Get notifications for hotel admin
export async function getHotelNotifications(limit?: number) {
  const query = limit ? `?limit=${limit}` : ""
  return apiRequest<{ success: boolean; data: JsonRecord[] }>(`/admin/notifications${query}`)
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  return apiRequest<JsonRecord>(`/notifications/${notificationId}/read`, {
    method: "PUT",
  })
}

// Delete notification
export async function deleteNotification(notificationId: string) {
  return apiRequest<JsonRecord>(`/notifications/${notificationId}`, {
    method: "DELETE",
  })
}

export async function updateSuperAdminPassword(payload: JsonRecord) {
  return apiRequest<JsonRecord>("/super-admin/security/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
export async function getSuperAdminProfile() {
  return apiRequest<any>("/super-admin/profile")
}

export async function updateSuperAdminProfile(payload: any) {
  return apiRequest<any>("/super-admin/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

// Promotion APIs (sent by hotel admins to customers)
export async function createPromotion(payload: JsonRecord) {
  return apiRequest<JsonRecord>("/admin/promotions", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function getHotelPromotions() {
  return apiRequest<{ success: boolean; data: JsonRecord[] }>("/admin/promotions")
}

export async function updatePromotion(promotionId: string, payload: JsonRecord) {
  return apiRequest<JsonRecord>(`/admin/promotions/${promotionId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deletePromotion(promotionId: string) {
  return apiRequest<JsonRecord>(`/admin/promotions/${promotionId}`, {
    method: "DELETE",
  })
}

// Send promotion to customers
export async function sendPromotionNotification(promotionId: string, guestIds?: string[]) {
  return apiRequest<JsonRecord>(`/admin/promotions/${promotionId}/send`, {
    method: "POST",
    body: JSON.stringify({ guestIds }),
  })
}

// ==================== ADMIN SETUP APIs ====================

export async function getSetupOptions(type: string, includeInactive = false) {
  const query = includeInactive ? "?includeInactive=true" : ""
  const data = await apiRequest<{ success: boolean; data: SetupOption[] }>(`/api/setup/${encodeURIComponent(type)}${query}`)
  return data.data || []
}

export async function createSetupOption(payload: { module: string; type: string; value: string }) {
  const data = await apiRequest<{ success: boolean; data: SetupOption; message?: string }>("/api/setup", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  return data.data
}

export async function updateSetupOption(id: string, payload: Partial<Pick<SetupOption, "module" | "type" | "value" | "isActive">>) {
  const data = await apiRequest<{ success: boolean; data: SetupOption; message?: string }>(`/api/setup/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
  return data.data
}

export async function deactivateSetupOption(id: string) {
  const data = await apiRequest<{ success: boolean; data: SetupOption; message?: string }>(`/api/setup/${id}/deactivate`, {
    method: "PATCH",
  })
  return data.data
}

// Room Types
export async function getSetupRoomTypes() {
  const data = await apiRequest<JsonRecord[] | { success: boolean; data: { roomTypes: JsonRecord[] } }>("/admin/setup/room-types")
  if (Array.isArray(data)) return data
  return data.data?.roomTypes || []
}

export async function createSetupRoomType(payload: JsonRecord) {
  return apiRequest<JsonRecord>("/admin/setup/room-types", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateSetupRoomType(id: string, payload: JsonRecord) {
  return apiRequest<JsonRecord>(`/admin/setup/room-types/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deleteSetupRoomType(id: string) {
  return apiRequest<JsonRecord>(`/admin/setup/room-types/${id}`, {
    method: "DELETE",
  })
}

export async function updateSetupRoomTypeStatus(id: string, status: string) {
  return apiRequest<JsonRecord>(`/admin/setup/room-types/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

// Rate Plans
export async function getSetupRatePlans() {
  const data = await apiRequest<JsonRecord[] | { success: boolean; data: { ratePlans: JsonRecord[] } }>("/admin/setup/rate-plans")
  if (Array.isArray(data)) return data
  return data.data?.ratePlans || []
}

export async function createSetupRatePlan(payload: JsonRecord) {
  return apiRequest<JsonRecord>("/admin/setup/rate-plans", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateSetupRatePlan(id: string, payload: JsonRecord) {
  return apiRequest<JsonRecord>(`/admin/setup/rate-plans/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deleteSetupRatePlan(id: string) {
  return apiRequest<JsonRecord>(`/admin/setup/rate-plans/${id}`, {
    method: "DELETE",
  })
}

// Service Codes (legacy alias to unified services)
export async function getSetupServiceCodes() {
  return getSetupServices()
}

export async function createSetupServiceCode(payload: JsonRecord) {
  return apiRequest<JsonRecord>("/admin/setup/service-codes", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateSetupServiceCode(id: string, payload: JsonRecord) {
  return apiRequest<JsonRecord>(`/admin/setup/service-codes/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deleteSetupServiceCode(id: string) {
  return apiRequest<JsonRecord>(`/admin/setup/service-codes/${id}`, {
    method: "DELETE",
  })
}

// Services
function mapService(raw: JsonRecord): Service {
  return {
    _id: String(raw._id || raw.id || ""),
    name: String(raw.name || ""),
    code: raw.code ? String(raw.code) : undefined,
    category: raw.category ? String(raw.category) : undefined,
    defaultPrice: Number(raw.defaultPrice || raw.price || 0),
    chargeType: String(raw.chargeType || ""),
    isFood: Boolean(raw.isFood),
    gstApplicable: Boolean(raw.gstApplicable),
    gstPercentage: raw.gstPercentage ? Number(raw.gstPercentage) : undefined,
    status: raw.status === "inactive" ? "inactive" : "active",
  }
}

export async function getSetupServices(): Promise<Service[]> {
  const data = await apiRequest<JsonRecord[] | { success: boolean; data: { services: JsonRecord[] } }>("/admin/setup/services")
  const services = Array.isArray(data) ? data : (data.data?.services || (data as any)?.services || [])
  return services.map(mapService)
}

export async function createSetupService(payload: JsonRecord) {
  return apiRequest<JsonRecord>("/admin/setup/services", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateSetupService(id: string, payload: JsonRecord) {
  return apiRequest<JsonRecord>(`/admin/setup/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deleteSetupService(id: string) {
  return apiRequest<JsonRecord>(`/admin/setup/services/${id}`, {
    method: "DELETE",
  })
}

// Referrals
export async function getReferrals(type?: string) {
  const params = new URLSearchParams()
  if (type) params.set("type", type)
  return apiRequest<any[]>(`/api/referrals${params.toString() ? `?${params.toString()}` : ""}`)
}

export async function getLookupGuests(search?: string) {
  const params = new URLSearchParams()
  if (search) params.set("search", search)
  return apiRequest<any[]>(`/admin/lookups/guests${params.toString() ? `?${params.toString()}` : ""}`)
}

// Hotel Config
export async function getSetupHotelConfig() {
  return apiRequest<JsonRecord>("/admin/setup/hotel-config")
}

export async function updateSetupHotelConfig(payload: JsonRecord) {
  return apiRequest<JsonRecord>("/admin/setup/hotel-config", {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function completeHotelSetup() {
  return apiRequest<{ success: boolean; message: string }>("/admin/setup/hotel-config/complete-setup", {
    method: "POST",
  })
}

// Floors & Rooms
export async function getSetupFloors() {
  const data = await apiRequest<{ success: boolean; data: { floors: JsonRecord[] } }>("/front-office/floors")
  return data.data?.floors || []
}

export async function createSetupFloor(payload: { name: string; floorNumber: number }) {
  return apiRequest<JsonRecord>("/front-office/floors", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function deleteSetupRoomConfig(floorId: string, roomTypeId: string) {
  return apiRequest(
    `/front-office/floors/${floorId}/room-config/${roomTypeId}`,
    {
      method: "DELETE",
    }
  )
}


export async function createSetupRoomConfig(floorId: string, payload: { roomTypeId: string; count: number; startingRoomNumber: string; roomNumberFormat?: string }) {
  return apiRequest<JsonRecord>(`/front-office/floors/${floorId}/room-config`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

// Check-Ins & In-House Guests
export async function getCheckedInRooms(status?: string) {
  const url = status ? `/admin/reception/check-in?status=${status}` : "/admin/reception/check-in"
  const res = await apiRequest<{ success: boolean; data: any[] }>(url)
  return res.data
}

// Room Advance
export async function createRoomAdvance(payload: any) {
  return apiRequest("/admin/reception/room-advance", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

// Advance Transfer
export async function createAdvanceTransfer(payload: any) {
  return apiRequest("/admin/reception/advance-transfer", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function getAdvanceTransfers() {
  return apiRequest<{ success: boolean; data: any[] }>(
    "/admin/reception/advance-transfer"
  )
}

export async function getAdvanceTransferById(id: string) {
  return apiRequest<{ success: boolean; data: any }>(
    `/admin/reception/advance-transfer/${id}`
  )
}

export async function cancelAdvanceTransfer(id: string) {
  return apiRequest<{ success: boolean; data: any }>(
    `/admin/reception/advance-transfer/${id}/cancel`,
    {
      method: "PUT",
    }
  )
}

// Shift Room
export async function shiftRoom(payload: any) {
  return apiRequest("/admin/reception/shift-room", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


// Block Room
export async function blockRoom(payload: any) {
  return apiRequest("/admin/reception/block-room", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Get Blocked Rooms
export async function getBlockedRooms() {
  const res = await apiRequest<{ success: boolean; data: any[] }>(
    "/admin/reception/block-room"
  );
  return res.data;
}

// Unblock Room
export async function unblockRoom(id: string) {
  return apiRequest(`/admin/reception/block-room/unblock/${id}`, {
    method: "PUT",
  });
}

// Add Service
export async function addService(payload: any) {
  return apiRequest("/admin/reception/post-service", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Get Services
export async function getServices() {
  const res = await apiRequest<{ success: boolean; data: any[] }>(
    "/admin/reception/post-service"
  );
  return res.data;
}

// Delete Service
export async function deleteService(id: string) {
  return apiRequest(`/admin/reception/post-service/${id}`, {
    method: "DELETE",
  });
}

// Update Service
export async function updateService(id: string, payload: any) {
  return apiRequest(`/admin/reception/post-service/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// Settle Folio
export async function settleFolio(folioId: string, payload: any) {
  return apiRequest<{ success: boolean; data: any }>(`/front-office/folio/${folioId}/settle`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

// Get Complaints
export async function getComplaints(params?: { status?: string; priority?: string }) {
  const query = new URLSearchParams()

  if (params?.status) query.set("status", params.status)
  if (params?.priority) query.set("priority", params.priority)

  return apiRequest<{ success: boolean; data: { complaints: any[] } }>(
    `/front-office/complaints${query.toString() ? `?${query.toString()}` : ""}`
  )
}

// Create Complaint
export async function createComplaint(payload: any) {
  return apiRequest<{ success: boolean; data: any }>(
    "/front-office/complaints",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )
}

// Update Complaint (Resolve)
export async function updateComplaint(id: string, payload: any) {
  return apiRequest<{ success: boolean; data: any }>(
    `/front-office/complaints/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  )
}

// Extend Checkout
export async function extendCheckout(folioId: string, payload: any) {
  return apiRequest<{ success: boolean; data?: any }>(`/front-office/in-house/${folioId}/extend`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Get linked rooms
export async function getRoomLinks() {
  return apiRequest<{ success: boolean; data: any[] }>("/front-office/in-house/link-rooms");
}

// Room Link/Unlink
export async function linkRooms(payload: any) {
  return apiRequest("/front-office/in-house/link-rooms", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Unlink rooms by master folio ID
export async function unlinkRooms(masterFolioId: string, payload?: any) {
  return apiRequest(`/front-office/in-house/link-rooms/${masterFolioId}`, {
    method: "DELETE",
    body: JSON.stringify(payload || {}),
  });
}

// Create Paidout Refund
export async function createPaidoutRefund(folioId: string, payload: any) {
  return apiRequest(`/front-office/folio/${folioId}/paidout`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Get Paidout/Refund Transactions
export async function getPaidoutRefundTransactions() {
  return apiRequest<{ success: boolean; data: any[] }>(
    "/front-office/paidout-refund"
  )
}

// Post Room Tariff
export async function postRoomTariff(folioId: string, payload: any) {
  return apiRequest(`/front-office/in-house/${folioId}/room-tariff`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

// Send Offer/Promotion to Guest
export async function sendOffer(payload: any) {
  return apiRequest(`/front-office/offers/send`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

// Get Offers/Promotions for Guests
export async function getOffers() {
  return apiRequest<{ success: boolean; data: any[] }>(`/front-office/offers`)
}


// ==================== LOOKUP APIs ====================
export async function getRoomLookup(params?: { search?: string; status?: string }) {
  const query = new URLSearchParams()
  if (params?.search) query.set("search", params.search)
  if (params?.status && params.status !== "all") query.set("status", params.status)

  return apiRequest<any[]>(`/admin/lookups/rooms${query.toString() ? `?${query.toString()}` : ""}`)
}

export async function getGuestLookup(search?: string) {
  const query = new URLSearchParams()
  if (search) query.set("search", search)

  return apiRequest<any[]>(`/admin/lookups/guests${query.toString() ? `?${query.toString()}` : ""}`)
}

// ==================== HOUSEKEEPING APIs ====================

export function mapHousekeepingTask(raw: JsonRecord): HousekeepingTask {
  return {
    id: String(raw._id || raw.id || ""),
    room: {
      id: String((raw.roomId as any)?._id || (raw.roomId as any)?.id || ""),
      roomNumber: String((raw.roomId as any)?.roomNumber || ""),
      floor: Number((raw.roomId as any)?.floor || 0),
      hkStatus: String((raw.roomId as any)?.hkStatus || ""),
      status: String((raw.roomId as any)?.status || ""),
    },
    taskType: raw.taskType as any,
    priority: raw.priority as any,
    status: raw.status as any,
    assignedTo: String(raw.assignedTo || ""),
    notes: String(raw.notes || ""),
    createdAt: String(raw.createdAt || ""),
    completedAt: raw.completedAt ? String(raw.completedAt) : undefined,
  }
}

export async function getHousekeepingRooms(params?: { hkStatus?: string; status?: string }): Promise<Room[]> {
  const query = new URLSearchParams()
  if (params?.hkStatus) query.set("hkStatus", params.hkStatus)
  if (params?.status) query.set("status", params.status)

  const data = await apiRequest<{ success: boolean; data: { rooms: JsonRecord[] } }>(
    `/housekeeping/rooms${query.toString() ? `?${query.toString()}` : ""}`
  )
  return Array.isArray(data.data?.rooms) ? data.data.rooms.map(mapRoom) : []
}

export async function getHousekeepingStaff(): Promise<Staff[]> {
  const data = await apiRequest<{ success: boolean; data: { staff: JsonRecord[] } }>("/housekeeping/staff")
  return Array.isArray(data.data?.staff) ? data.data.staff.map(mapStaff) : []
}

export async function updateRoomHkStatus(roomId: string, payload: { hkStatus?: string; status?: string }) {
  return apiRequest<{ success: boolean; data: any }>(`/housekeeping/rooms/${roomId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export async function getHousekeepingTasks(params?: { status?: string; priority?: string }): Promise<HousekeepingTask[]> {
  const query = new URLSearchParams()
  if (params?.status) query.set("status", params.status)
  if (params?.priority) query.set("priority", params.priority)

  const data = await apiRequest<{ success: boolean; data: { tasks: JsonRecord[] } }>(
    `/housekeeping/tasks${query.toString() ? `?${query.toString()}` : ""}`
  )
  return Array.isArray(data.data?.tasks) ? data.data.tasks.map(mapHousekeepingTask) : []
}

export async function createHousekeepingTask(payload: {
  roomId: string
  taskType: string
  priority: string
  assignedTo?: string
  notes?: string
}) {
  return apiRequest<{ success: boolean; data: any }>("/housekeeping/tasks", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateHousekeepingTask(
  taskId: string,
  payload: {
    status?: string
    assignedTo?: string
    notes?: string
  }
) {
  return apiRequest<{ success: boolean; data: any }>(`/housekeeping/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

// ==================== INVENTORY APIs ====================

function mapInventoryItem(raw: JsonRecord): InventoryItem {
  return {
    id: String(raw._id || raw.id || ""),
    name: String(raw.name || ""),
    category: String(raw.category || ""),
    quantity: Number(raw.quantity || 0),
    unit: String(raw.unit || ""),
    minStock: Number(raw.minStock || 0),
    status: raw.status as any,
    lastUpdated: raw.updatedAt ? new Date(String(raw.updatedAt)).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "N/A",
  }
}

export async function getInventory(params?: { category?: string; search?: string }): Promise<InventoryItem[]> {
  const query = new URLSearchParams()
  if (params?.category) query.set("category", params.category)
  if (params?.search) query.set("search", params.search)

  const data = await apiRequest<{ success: boolean; data: JsonRecord[] }>(
    `/admin/inventory${query.toString() ? `?${query.toString()}` : ""}`
  )
  return Array.isArray(data.data) ? data.data.map(mapInventoryItem) : []
}

export async function createInventoryItem(payload: Partial<InventoryItem>) {
  return apiRequest<{ success: boolean; data: JsonRecord }>("/admin/inventory", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateInventoryItem(id: string, payload: Partial<InventoryItem>) {
  return apiRequest<{ success: boolean; data: JsonRecord }>(`/admin/inventory/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export async function deleteInventoryItem(id: string) {
  return apiRequest<{ success: boolean; message: string }>(`/admin/inventory/${id}`, {
    method: "DELETE",
  })
}

// ==================== POS APIs ====================

function mapPOSItem(raw: JsonRecord): POSItem {
  return {
    id: String(raw._id || raw.id || ""),
    name: String(raw.name || ""),
    category: String(raw.category || ""),
    price: Number(raw.price || 0),
    taxRate: Number(raw.taxRate || 0),
    description: String(raw.description || ""),
    status: raw.status as any,
  }
}

function mapPOSOrder(raw: any): POSOrder {
  return {
    id: String(raw._id || raw.id || ""),
    orderNumber: String(raw.orderNumber || ""),
    folioId: String(raw.folioId?._id || raw.folioId || ""),
    guestName: String(raw.folioId?.guestName || ""),
    roomNumber: String(raw.folioId?.roomNumber || ""),
    tableNo: String(raw.tableNo || ""),
    status: raw.status as any,
    items: Array.isArray(raw.items) ? raw.items : [],
    subTotal: Number(raw.subTotal || 0),
    taxTotal: Number(raw.taxTotal || 0),
    grandTotal: Number(raw.grandTotal || 0),
    paidAmount: Number(raw.paidAmount || 0),
    paymentMode: String(raw.paymentMode || ""),
    createdAt: String(raw.createdAt || ""),
  }
}

export async function getPOSItems(): Promise<POSItem[]> {
  const data = await apiRequest<{ success: boolean; data: { items: JsonRecord[] } }>("/pos/items")
  return Array.isArray(data.data?.items) ? data.data.items.map(mapPOSItem) : []
}

export async function createPOSItem(payload: Partial<POSItem>) {
  return apiRequest<{ success: boolean; data: JsonRecord }>("/pos/items", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updatePOSItem(id: string, payload: Partial<POSItem>) {
  return apiRequest<{ success: boolean; data: JsonRecord }>(`/pos/items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export async function deletePOSItem(id: string) {
  return apiRequest<{ success: boolean; message: string }>(`/pos/items/${id}`, {
    method: "DELETE",
  })
}

export async function getPOSOrders(): Promise<POSOrder[]> {
  const data = await apiRequest<{ success: boolean; data: { orders: JsonRecord[] } }>("/pos/orders")
  return Array.isArray(data.data?.orders) ? data.data.orders.map(mapPOSOrder) : []
}

export async function createPOSOrder(payload: {
  items: Array<{ itemId: string; quantity: number }>
  folioId?: string
  tableNo?: string
  status?: string
}) {
  return apiRequest<{ success: boolean; data: JsonRecord }>("/pos/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updatePOSOrderStatus(id: string, status: string) {
  return apiRequest<{ success: boolean; data: JsonRecord }>(`/pos/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

export async function processPOSPayment(id: string, payload: { amount: number; paymentMode: string }) {
  return apiRequest<{ success: boolean; data: JsonRecord }>(`/pos/orders/${id}/payment`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

// ==================== COMPANY APIs ====================

function unwrapListResponse(data: any, keys: string[] = []) {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== "object") return []
  if (Array.isArray(data.data)) return data.data
  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key]
    if (data.data && Array.isArray(data.data[key])) return data.data[key]
  }
  return []
}

function unwrapItemResponse(data: any, keys: string[] = []) {
  if (!data || typeof data !== "object") return data
  for (const key of keys) {
    if (data[key] && typeof data[key] === "object") return data[key]
    if (data.data?.[key] && typeof data.data[key] === "object") return data.data[key]
  }
  return data.data && typeof data.data === "object" ? data.data : data
}

function getCachedRegistrations() {
  if (typeof window === "undefined") return []
  try {
    const cached = JSON.parse(localStorage.getItem(REGISTRATION_CACHE_KEY) || "[]")
    return Array.isArray(cached) ? cached : []
  } catch {
    return []
  }
}

export function cacheCompanyRegistrations(registrations: any[]) {
  if (typeof window === "undefined") return
  const merged = new Map(getCachedRegistrations().map((item: any) => [String(item._id || item.id || item.code), item]))
  registrations.forEach((registration) => {
    const key = String(registration?._id || registration?.id || registration?.code || "")
    if (key) merged.set(key, registration)
  })
  localStorage.setItem(REGISTRATION_CACHE_KEY, JSON.stringify(Array.from(merged.values())))
}

export function getCachedCompanyRegistrations(type?: string) {
  const cached = getCachedRegistrations()
  return type ? cached.filter((item: any) => item.type === type) : cached
}

export async function getCompanies() {
  const data = await apiRequest<any>("/api/companies")
  const companies = unwrapListResponse(data, ["companies", "company"])
  if (companies.length) cacheCompanyRegistrations(companies)
  return companies.length ? companies : getCachedCompanyRegistrations().filter((item: any) => item.type !== "Travel Agent")
}

export async function createCompany(payload: JsonRecord) {
  const data = await apiRequest<any>("/api/companies", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  const company = unwrapItemResponse(data, ["company"])
  cacheCompanyRegistrations([company])
  return company
}

export async function updateCompany(id: string, payload: JsonRecord) {
  const data = await apiRequest<any>(`/api/companies/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
  const company = unwrapItemResponse(data, ["company"])
  cacheCompanyRegistrations([company])
  return company
}

export async function deleteCompany(id: string) {
  return apiRequest<any>(`/api/companies/${id}`, {
    method: "DELETE",
  })
}

// ==================== TRAVEL AGENT APIs ====================

export async function getTravelAgents() {
  const data = await apiRequest<any>("/api/travel-agents")
  const travelAgents = unwrapListResponse(data, ["travelAgents", "travelAgent"]).map((item: any) => ({ ...item, type: "Travel Agent" }))
  if (travelAgents.length) cacheCompanyRegistrations(travelAgents)
  return travelAgents.length ? travelAgents : getCachedCompanyRegistrations("Travel Agent")
}

export async function createTravelAgent(payload: JsonRecord) {
  const data = await apiRequest<any>("/api/travel-agents", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  const travelAgent = { ...unwrapItemResponse(data, ["travelAgent"]), type: "Travel Agent" }
  cacheCompanyRegistrations([travelAgent])
  return travelAgent
}

export async function updateTravelAgent(id: string, payload: JsonRecord) {
  const data = await apiRequest<any>(`/api/travel-agents/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
  const travelAgent = { ...unwrapItemResponse(data, ["travelAgent"]), type: "Travel Agent" }
  cacheCompanyRegistrations([travelAgent])
  return travelAgent
}

export async function deleteTravelAgent(id: string) {
  return apiRequest<{ success: boolean; message: string }>(`/api/travel-agents/${id}`, {
    method: "DELETE",
  })
}

export { mapGuest, mapHotel, mapReservation, mapRoom, mapStaff, type Company, type TravelAgent }
