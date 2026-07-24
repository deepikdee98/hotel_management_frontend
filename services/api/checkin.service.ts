import type { Folio, GRCardData } from "@/lib/types"
import {
  API_BASE_URL,
  apiRequest,
  getStoredAccessToken,
  type JsonRecord,
} from "./client"
import { getFrontOfficeRooms } from "./room.service"
import { getSetupRatePlans, getSetupRoomTypes } from "./setup.service"
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

export async function uploadCheckInImage(
  file: File | Blob,
  uploadType: "guest-photo" | "id-proof-front" | "id-proof-back",
  fileName = "capture.jpg",
  customerName?: string
) {
  const contentType = file.type || "image/jpeg"
  const fileSize = "size" in file ? file.size : undefined
  const presign = await apiRequest<{
    success: boolean
    data: {
      uploadUrl: string
      fileUrl: string
      key: string
      contentType: string
    }
  }>("/admin/reception/check-in/uploads/presign", {
    method: "POST",
    body: JSON.stringify({
      fileName,
      contentType,
      uploadType,
      fileSize,
      storageScope: "customer",
      customerName,
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
    throw new Error(text || "Failed to upload image to S3")
  }

  return {
    url: presign.data.fileUrl,
    key: presign.data.key,
  }
}

export async function getCheckInFileReadUrl(key: string) {
  const response = await apiRequest<{
    success: boolean
    data: {
      readUrl: string
      key: string
      expiresIn: number
    }
  }>("/admin/reception/check-in/uploads/read-url", {
    method: "POST",
    body: JSON.stringify({ key }),
  })

  return response.data.readUrl
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

export async function undoCheckOut(payload: { folioId: string; reason: string }) {
  return apiRequest<{ success: boolean; message: string; data: any }>("/front-office/check-out/undo", {
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
  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    const payload = await response.json()
    const downloadUrl = payload?.data?.downloadUrl || payload?.data?.invoiceUrl
    if (!downloadUrl) {
      throw new Error("Invoice download URL missing")
    }
    window.open(downloadUrl, "_blank", "noopener,noreferrer")
    return
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
