import type { POSItem, POSOrder } from "@/lib/types"
import { apiRequest, type JsonRecord } from "./client"
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
