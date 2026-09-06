import type { ReportResult, ReportRow } from "@/services/api/reports.service"

export function validReportTimezone(timezone?: string) {
  try { if (timezone) { new Intl.DateTimeFormat(undefined, { timeZone: timezone }); return timezone } } catch { /* Metadata may describe multiple property timezones. */ }
  return "UTC"
}

export function rowReportTimezone(row: ReportRow, meta: ReportResult["meta"]) {
  const property = meta.properties.find(item => item.id === row.propertyId || item.id === row.property || item.name === row.property)
  return validReportTimezone(property?.timezone || meta.timezone)
}

export function formatReportValue(value: string | number | null | undefined, type?: string, currency?: string | null, timezone?: string) {
  if (value == null) return "—"
  if (type === "date") {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString(undefined, { timeZone: validReportTimezone(timezone) })
  }
  if (typeof value !== "number") return String(value)
  if (!Number.isFinite(value)) return "—"
  const numeric = value.toLocaleString(undefined, { maximumFractionDigits: 2 })
  if (type === "money" && currency) {
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value) }
    catch { return `${numeric} (${currency})` }
  }
  return `${numeric}${type === "percent" ? "%" : ""}`
}

const housekeepingAssignments = new Set(["housekeeping-daily", "room-assignment", "pending-cleaning", "room-inspection", "maintenance", "deep-cleaning"])
const labels: Record<string, string> = { room: "Room", roomCategory: "Room category", source: "Booking source", status: "Status", staff: "Staff", role: "Role", module: "Module", action: "Action", bookingId: "Booking ID", department: "Department", paymentMode: "Payment mode", category: "Category" }
export function reportFilterLabel(reportId: string, filter: string) {
  if (filter === "staff" && housekeepingAssignments.has(reportId)) return "Assigned staff name"
  return labels[filter] || filter
}
