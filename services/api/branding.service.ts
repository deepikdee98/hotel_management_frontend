import { apiRequest } from "./client"

export interface CompanyBrandingData {
  companyName: string
  logo?: {
    url: string
    key: string
    fileName: string
    contentType: string
    uploadedAt: string
  }
}

export async function getCompanyBranding() {
  return apiRequest<{ success: boolean; data: CompanyBrandingData }>("/super-admin/branding")
}

export async function updateCompanyBranding(payload: { companyName: string; logo?: any }) {
  return apiRequest<{ success: boolean; data: CompanyBrandingData }>("/super-admin/branding", {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}
