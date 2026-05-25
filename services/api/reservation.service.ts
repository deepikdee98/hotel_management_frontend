import type { Reservation } from "@/lib/types"
import { apiRequest, type JsonRecord } from "./client"
import { mapGuest, mapReservation } from "./core"
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
