import type { Service } from "@/lib/types"
import { apiRequest, type JsonRecord, type SetupOption } from "./client"
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

async function uploadHotelImage(file: File, uploadType: "hotel-logo" | "payment-qr-code", fallbackFileName: string, errorLabel: string) {
  const contentType = file.type || "image/png"
  const presign = await apiRequest<{
    success: boolean
    data: {
      uploadUrl: string
      fileUrl: string
      key: string
      contentType: string
    }
  }>("/uploads/presign", {
    method: "POST",
    body: JSON.stringify({
      fileName: file.name || fallbackFileName,
      contentType,
      uploadType,
      fileSize: file.size,
      storageScope: "hotel",
    }),
  })

  const upload = await fetch(presign.data.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": presign.data.contentType || contentType,
    },
    body: file,
  })

  if (!upload.ok) {
    const text = await upload.text().catch(() => "")
    throw new Error(text || `Failed to upload ${errorLabel} to S3`)
  }

  return {
    url: presign.data.fileUrl,
    key: presign.data.key,
    fileName: file.name || fallbackFileName,
    contentType: presign.data.contentType || contentType,
    uploadedAt: new Date().toISOString(),
  }
}

export async function uploadHotelLogo(file: File) {
  return uploadHotelImage(file, "hotel-logo", "logo.png", "hotel logo")
}

export async function uploadPaymentQrCode(file: File) {
  return uploadHotelImage(file, "payment-qr-code", "QRCode.png", "payment QR code")
}

export async function getHotelLogoReadUrl(key: string) {
  const response = await apiRequest<{
    success: boolean
    data: {
      readUrl: string
      key: string
      expiresIn: number
    }
  }>("/uploads/read-url", {
    method: "POST",
    body: JSON.stringify({ key }),
  })

  return response.data.readUrl
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

export async function createSetupFloor(payload: { name: string; floorNumber: number; floorType?: "rooms" | "banquet" }) {
  return apiRequest<JsonRecord>("/front-office/floors", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateSetupRoomConfig(floorId: string, roomTypeId: string, payload: { roomTypeId: string; acType: "AC" | "NON_AC"; count: number; startingRoomNumber: string; roomNumberFormat?: string }, oldAcType?: "AC" | "NON_AC") {
  const query = oldAcType ? `?oldAcType=${encodeURIComponent(oldAcType)}` : ""
  return apiRequest<JsonRecord>(`/front-office/floors/${floorId}/room-config/${roomTypeId}${query}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deleteSetupRoomConfig(floorId: string, roomTypeId: string, acType?: "AC" | "NON_AC") {
  const query = acType ? `?acType=${encodeURIComponent(acType)}` : ""
  return apiRequest(
    `/front-office/floors/${floorId}/room-config/${roomTypeId}${query}`,
    {
      method: "DELETE",
    }
  )
}


export async function createSetupRoomConfig(floorId: string, payload: { roomTypeId: string; acType: "AC" | "NON_AC"; count: number; startingRoomNumber: string; roomNumberFormat?: string }) {
  return apiRequest<JsonRecord>(`/front-office/floors/${floorId}/room-config`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
