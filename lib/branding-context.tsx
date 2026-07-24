"use client"

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getCompanyBranding } from "@/services/api/branding.service"

interface BrandingContextType {
  companyName: string
  logoUrl: string
  isLoading: boolean
  refreshBranding: () => Promise<void>
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined)

const DEFAULT_COMPANY_NAME = "Zentric HMS"
const DEFAULT_LOGO_URL = "/logo.png"

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [companyName, setCompanyName] = useState<string>(DEFAULT_COMPANY_NAME)
  const [logoUrl, setLogoUrl] = useState<string>(DEFAULT_LOGO_URL)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const fetchBranding = async () => {
    try {
      const response = await getCompanyBranding()
      if (response && response.success && response.data) {
        if (response.data.companyName) {
          setCompanyName(response.data.companyName)
        }
        if (response.data.logo && response.data.logo.url) {
          setLogoUrl(response.data.logo.url)
        } else {
          setLogoUrl(DEFAULT_LOGO_URL)
        }
      }
    } catch (error) {
      console.error("Failed to load company branding details:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBranding()
  }, [])

  return (
    <BrandingContext.Provider
      value={{
        companyName,
        logoUrl,
        isLoading,
        refreshBranding: fetchBranding,
      }}
    >
      {children}
    </BrandingContext.Provider>
  )
}

export function useBranding() {
  const context = useContext(BrandingContext)
  if (!context) {
    throw new Error("useBranding must be used within a BrandingProvider")
  }
  return context
}
