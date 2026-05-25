import type { InventoryItem } from "@/lib/types"
import { apiRequest, type JsonRecord } from "./client"
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
