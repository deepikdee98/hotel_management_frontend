import type { Company, TravelAgent } from "@/lib/types"
import { apiRequest, type JsonRecord } from "./client"

const REGISTRATION_CACHE_KEY = "front_office_company_registrations"
// ==================== COMPANY APIs ====================

function unwrapListResponse(data: any, keys: string[] = []) {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== "object") return []
  if (Array.isArray(data.data)) return data.data
  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key]
    if (data.data && Array.isArray(data.data[key])) return data.data[key]
  }
  return []
}

function unwrapItemResponse(data: any, keys: string[] = []) {
  if (!data || typeof data !== "object") return data
  for (const key of keys) {
    if (data[key] && typeof data[key] === "object") return data[key]
    if (data.data?.[key] && typeof data.data[key] === "object") return data.data[key]
  }
  return data.data && typeof data.data === "object" ? data.data : data
}

function getCachedRegistrations() {
  if (typeof window === "undefined") return []
  try {
    const cached = JSON.parse(localStorage.getItem(REGISTRATION_CACHE_KEY) || "[]")
    return Array.isArray(cached) ? cached : []
  } catch {
    return []
  }
}

export function cacheCompanyRegistrations(registrations: any[]) {
  if (typeof window === "undefined") return
  const merged = new Map(getCachedRegistrations().map((item: any) => [String(item._id || item.id || item.code), item]))
  registrations.forEach((registration) => {
    const key = String(registration?._id || registration?.id || registration?.code || "")
    if (key) merged.set(key, registration)
  })
  localStorage.setItem(REGISTRATION_CACHE_KEY, JSON.stringify(Array.from(merged.values())))
}

export function getCachedCompanyRegistrations(type?: string) {
  const cached = getCachedRegistrations()
  return type ? cached.filter((item: any) => item.type === type) : cached
}

export async function getCompanies() {
  const data = await apiRequest<any>("/api/companies")
  const companies = unwrapListResponse(data, ["companies", "company"])
  if (companies.length) cacheCompanyRegistrations(companies)
  return companies.length ? companies : getCachedCompanyRegistrations().filter((item: any) => item.type !== "Travel Agent")
}

export async function createCompany(payload: JsonRecord) {
  const data = await apiRequest<any>("/api/companies", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  const company = unwrapItemResponse(data, ["company"])
  cacheCompanyRegistrations([company])
  return company
}

export async function updateCompany(id: string, payload: JsonRecord) {
  const data = await apiRequest<any>(`/api/companies/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
  const company = unwrapItemResponse(data, ["company"])
  cacheCompanyRegistrations([company])
  return company
}

export async function deleteCompany(id: string) {
  return apiRequest<any>(`/api/companies/${id}`, {
    method: "DELETE",
  })
}

// ==================== TRAVEL AGENT APIs ====================

export async function getTravelAgents() {
  const data = await apiRequest<any>("/api/travel-agents")
  const travelAgents = unwrapListResponse(data, ["travelAgents", "travelAgent"]).map((item: any) => ({ ...item, type: "Travel Agent" }))
  if (travelAgents.length) cacheCompanyRegistrations(travelAgents)
  return travelAgents.length ? travelAgents : getCachedCompanyRegistrations("Travel Agent")
}

export async function createTravelAgent(payload: JsonRecord) {
  const data = await apiRequest<any>("/api/travel-agents", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  const travelAgent = { ...unwrapItemResponse(data, ["travelAgent"]), type: "Travel Agent" }
  cacheCompanyRegistrations([travelAgent])
  return travelAgent
}

export async function updateTravelAgent(id: string, payload: JsonRecord) {
  const data = await apiRequest<any>(`/api/travel-agents/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
  const travelAgent = { ...unwrapItemResponse(data, ["travelAgent"]), type: "Travel Agent" }
  cacheCompanyRegistrations([travelAgent])
  return travelAgent
}

export async function deleteTravelAgent(id: string) {
  return apiRequest<{ success: boolean; message: string }>(`/api/travel-agents/${id}`, {
    method: "DELETE",
  })
}

