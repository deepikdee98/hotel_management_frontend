import { apiRequest, apiBlobRequest, type JsonRecord } from "./core"

export interface ReportColumn { key: string; label: string; type?: "money" | "number" | "date" }
export interface ReportDefinition { id: string; title: string; category: string; module: string; status: "available" | "blocked"; reason?: string; filters: string[]; columns: ReportColumn[]; snapshot?: boolean }
export interface ReportProperty { id: string; name: string; currency: string; timezone: string }
export interface ReportCatalog { reports: ReportDefinition[]; properties: ReportProperty[]; canMultiProperty: boolean; canExport: boolean }
export type ReportRow = Record<string, string | number | null>
export interface ReportResult { report: ReportDefinition; rows: ReportRow[]; total: number; page: number; limit: number; kpis?: { label: string; value: number | null; type?: "money" | "number" | "percent"; note?: string }[]; charts?: { title: string; key: string; labelKey: string; series: { key: string; label: string }[]; data: ReportRow[] }[]; meta: { properties: ReportProperty[]; startDate: string; endDate: string; generatedAt: string; generatedBy: string; currency: string | null; timezone: string; notes: string[] } }
export interface ReportQuery { preset: string; startDate?: string; endDate?: string; propertyIds: string[]; page: number; limit: number; search: string; sort?: string; order?: "asc" | "desc"; filters: Record<string, string> }
export interface ReportFilterOption { value: string; label: string }
export interface ReportFilterOptions { options: ReportFilterOption[]; hasMore: boolean }
export function reportQuery(query: ReportQuery, supported: string[], exporting = false) {
  const params = new URLSearchParams({ preset: query.preset })
  if (query.preset === "custom") { if (query.startDate) params.set("startDate", query.startDate); if (query.endDate) params.set("endDate", query.endDate) }
  if (query.propertyIds.length) params.set("propertyIds", query.propertyIds.join(","))
  if (!exporting) { params.set("page", String(query.page)); params.set("limit", String(query.limit)) }
  if (query.search.trim()) params.set("search", query.search.trim())
  if (query.sort) { params.set("sort", query.sort); params.set("order", query.order || "asc") }
  for (const key of supported) if (query.filters[key]?.trim()) params.set(key, query.filters[key].trim())
  return params
}
export async function getReportsCatalog() { return (await apiRequest<{ data: ReportCatalog }>("/reports/catalog")).data }
export async function runReport(report: ReportDefinition, query: ReportQuery) { return (await apiRequest<{ data: ReportResult }>(`/reports/run/${encodeURIComponent(report.id)}?${reportQuery(query, report.filters)}`)).data }
export async function getReportFilterOptions(report: ReportDefinition, filter: string, propertyIds: string[], search = "") {
  const params = new URLSearchParams({ filter })
  if (propertyIds.length) params.set("propertyIds", propertyIds.join(","))
  if (search.trim()) params.set("search", search.trim())
  return (await apiRequest<{ data: ReportFilterOptions }>(`/reports/options/${encodeURIComponent(report.id)}?${params}`)).data
}
export function exportReport(report: ReportDefinition, query: ReportQuery, format: "csv" | "xlsx" | "pdf") { const params = reportQuery(query, report.filters, true); params.set("format", format); return apiBlobRequest(`/reports/export/${encodeURIComponent(report.id)}?${params}`) }

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
