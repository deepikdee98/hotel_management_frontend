import type { HousekeepingTask, Room, Staff } from "@/lib/types"
import { apiRequest, type JsonRecord } from "./client"
import { mapRoom, mapStaff } from "./core"
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
    assignedToName: String(raw.assignedToName || ""),
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
