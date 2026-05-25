import type { Hotel, Staff } from "@/lib/types"
import { apiRequest, type JsonRecord } from "./client"
import { mapHotel, mapStaff } from "./core"
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

