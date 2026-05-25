import type { Room } from "@/lib/types"
import { apiRequest, type JsonRecord } from "./client"
import { mapRoom } from "./core"
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
