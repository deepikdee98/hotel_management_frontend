"use client"

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react"
import type { User, UserRole, ModuleType } from "./types"
import { getSubscriptionInfo, normalizeSubscriptionStatus, type SubscriptionInfo } from "./subscription"

interface AuthContextType {
  user: User | null
  subscriptionInfo: SubscriptionInfo | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (identifier: string, password: string) => Promise<any>
  logout: (message?: string) => void
  hasAccess: (module: ModuleType) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AUTH_STORAGE_KEY = "hotel_manager_auth"
const AUTH_TOKEN_STORAGE_KEY = "hotel_manager_tokens"
const SUBSCRIPTION_STORAGE_KEY = "hotel_manager_subscription"
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002"

function pickModules(...sources: unknown[]): ModuleType[] {
  for (const source of sources) {
    if (Array.isArray(source)) {
      return source as ModuleType[]
    }
  }

  return []
}

function pickToken(payload: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const direct = payload[key]
    if (typeof direct === "string" && direct) return direct
  }

  const data = payload.data
  if (data && typeof data === "object") {
    const dataRecord = data as Record<string, unknown>
    for (const key of keys) {
      const nested = dataRecord[key]
      if (typeof nested === "string" && nested) return nested
    }
  }

  return ""
}

function pickUser(payload: Record<string, unknown>): User | null {
  const directUser = payload.user
  if (directUser && typeof directUser === "object") {
    const user = directUser as any
    return {
      ...user,
      modules: user.modules || payload.modules || []
    } as User
  }

  const data = payload.data
  if (data && typeof data === "object") {
    const dataRecord = data as Record<string, unknown>
    const nestedUser = dataRecord.user
    if (nestedUser && typeof nestedUser === "object") {
      const user = nestedUser as any
      return {
        ...user,
        modules: user.modules || dataRecord.modules || payload.modules || []
      } as User
    }
  }

  return null
}

function pickExpiryDate(...sources: unknown[]): string | undefined {
  for (const source of sources) {
    if (typeof source === "string" && source) return source

    if (source && typeof source === "object") {
      const record = source as Record<string, unknown>
      const expiryDate = record.expiryDate
      if (typeof expiryDate === "string" && expiryDate) return expiryDate
    }
  }

  return undefined
}

function resolveSubscriptionInfo(payload: any, expiryDate?: string): SubscriptionInfo | null {
  const rawSubscription = payload?.subscription || payload?.data?.subscription
  const resolvedExpiryDate = pickExpiryDate(expiryDate, rawSubscription, payload?.hotel, payload?.data?.hotel)

  if (resolvedExpiryDate) {
    return getSubscriptionInfo(resolvedExpiryDate)
  }

  if (rawSubscription?.status) {
    return {
      status: normalizeSubscriptionStatus(rawSubscription.status),
      daysLeft: Number(rawSubscription.daysLeft || 0),
      message: String(rawSubscription.message || ""),
      expiryDate: rawSubscription.expiryDate || null,
    } as SubscriptionInfo
  }

  return null
}

function getStoredAccessToken(): string | null {
  try {
    const tokensRaw = sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
    if (!tokensRaw) return null

    const { accessToken } = JSON.parse(tokensRaw)
    return typeof accessToken === "string" && accessToken ? accessToken : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const subscriptionRefreshKeyRef = useRef<string | null>(null)

  const logout = useCallback((message?: string) => {
    const tokensRaw = sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)

    if (tokensRaw) {
      try {
        const { accessToken } = JSON.parse(tokensRaw)

        if (accessToken) {
          fetch(`${API_BASE_URL}/auth/logout`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }).catch(() => { })
        }
      } catch { }
    }

    setUser(null)
    setSubscriptionInfo(null)
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
    sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    sessionStorage.removeItem(SUBSCRIPTION_STORAGE_KEY)
    window.location.href = message ? `/?error=${encodeURIComponent(message)}` : "/"
  }, [])

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(AUTH_STORAGE_KEY)
      if (stored) {
        const restoredUser = JSON.parse(stored) as User
        setUser(restoredUser)

        if (restoredUser.expiryDate) {
          const nextSubscriptionInfo = getSubscriptionInfo(restoredUser.expiryDate)
          setSubscriptionInfo(nextSubscriptionInfo)
          sessionStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(nextSubscriptionInfo))
        } else {
          const storedSubscription = sessionStorage.getItem(SUBSCRIPTION_STORAGE_KEY)
          if (storedSubscription) {
            const parsedSubscription = JSON.parse(storedSubscription) as SubscriptionInfo
            setSubscriptionInfo({
              ...parsedSubscription,
              status: normalizeSubscriptionStatus(parsedSubscription.status),
            })
          }
        }
      }
    } catch (e) {
      console.error("Restore failed:", e)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!user?.expiryDate || user.role === "super-admin") {
      return
    }

    const refreshSubscriptionInfo = () => {
      const nextSubscriptionInfo = getSubscriptionInfo(user.expiryDate as string)
      setSubscriptionInfo(nextSubscriptionInfo)
      sessionStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(nextSubscriptionInfo))

      if (nextSubscriptionInfo.status === "EXPIRED") {
        logout(nextSubscriptionInfo.message)
      }
    }

    refreshSubscriptionInfo()
    const interval = window.setInterval(refreshSubscriptionInfo, 60 * 60 * 1000)

    return () => window.clearInterval(interval)
  }, [logout, user?.expiryDate, user?.role])

  useEffect(() => {
    if (!user || user.role === "super-admin") {
      return
    }

    const refreshKey = `${user.id || ""}:${user.hotelId || ""}`
    if (subscriptionRefreshKeyRef.current === refreshKey) {
      return
    }

    subscriptionRefreshKeyRef.current = refreshKey
    let isCancelled = false

    const loadHotelSubscription = async () => {
      const accessToken = getStoredAccessToken()
      if (!accessToken) {
        subscriptionRefreshKeyRef.current = null
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/admin/setup/hotel-config`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        })

        if (!response.ok) {
          subscriptionRefreshKeyRef.current = null
          return
        }

        const hotelConfig = await response.json()
        const expiryDate = pickExpiryDate(hotelConfig)
        if (!expiryDate || isCancelled) return

        const nextUser = {
          ...user,
          expiryDate,
          hotelName: user.hotelName || String(hotelConfig.name || ""),
        }
        const nextSubscriptionInfo = getSubscriptionInfo(expiryDate)

        setUser(nextUser)
        setSubscriptionInfo(nextSubscriptionInfo)
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser))
        sessionStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(nextSubscriptionInfo))

        if (nextSubscriptionInfo.status === "EXPIRED") {
          logout(nextSubscriptionInfo.message)
        }
      } catch {
        // Keep the existing session usable if the config lookup fails.
      }
    }

    loadHotelSubscription()

    return () => {
      isCancelled = true
    }
  }, [logout, user])

  useEffect(() => {
    const tokensRaw = sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)

    if (!tokensRaw) return

    try {
      const { accessToken } = JSON.parse(tokensRaw)

      if (!accessToken) {
        logout()
        return
      }

      const parts = accessToken.split(".")

      if (parts.length !== 3) {
        logout()
        return
      }

      const decoded = JSON.parse(atob(parts[1]))

      if (!decoded.exp) {
        logout()
        return
      }

      const expiryTime = decoded.exp * 1000
      const timeLeft = expiryTime - Date.now()

      if (timeLeft <= 0) {
        logout()
        return
      }

      const timer = setTimeout(() => logout(), timeLeft)

      return () => clearTimeout(timer)
    } catch {
      logout()
    }
  }, [logout])

  useEffect(() => {
    const checkToken = () => {
      const tokensRaw = sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)

      if (!tokensRaw) {
        logout()
        return
      }

      try {
        const { accessToken } = JSON.parse(tokensRaw)
        const parts = accessToken.split(".")

        if (parts.length !== 3) {
          logout()
        }
      } catch {
        logout()
      }
    }

    window.addEventListener("storage", checkToken)

    return () => {
      window.removeEventListener("storage", checkToken)
    }
  }, [logout])

  const login = useCallback(async (identifier: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, password }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || "Login failed")
      }

      const accessToken =
        payload.accessToken ||
        payload.data?.token ||
        payload.data?.accessToken

      const refreshToken =
        payload.refreshToken || payload.data?.refreshToken

      if (!accessToken) return null

      sessionStorage.setItem(
        AUTH_TOKEN_STORAGE_KEY,
        JSON.stringify({ accessToken, refreshToken })
      )

      const mapRole = (r: string): UserRole => {
        const normalized = String(r || "").toLowerCase()
        if (normalized === "superadmin" || normalized === "super-admin")
          return "super-admin"
        if (normalized === "hoteladmin" || normalized === "admin")
          return "admin"
        return "staff"
      }

      let userProfile: User
      const payloadSubscriptionInfo = resolveSubscriptionInfo(payload)
      const payloadExpiryDate = payloadSubscriptionInfo?.expiryDate || pickExpiryDate(
        payload.subscription,
        payload.hotel,
        payload.data?.subscription,
        payload.data?.hotel
      )

      const resolveName = (data: any) => {
        const email = String(data?.email || "")
        const fallbackName = email.includes("@") ? email.split("@")[0] : email
        return (
          data?.name ||
          data?.username ||
          data?.hotelName ||
          fallbackName
        )
      }

      try {
        const decoded = JSON.parse(atob(accessToken.split(".")[1]))
        const userData = decoded.user || decoded
        const hotelData = userData?.hotel

        userProfile = {
          id: userData.id || userData._id || userData.sub || "",
          email: userData.email || "",
          role: mapRole(userData.role),
          name: resolveName(userData),
          modules: pickModules(userData.modules, hotelData?.modules),
          hotelId: userData.hotelId || hotelData?._id || hotelData?.id,
          hotelName: userData.hotelName || hotelData?.name,
          expiryDate: payloadExpiryDate,
          needsSetup: payload.needsSetup || payload.data?.needsSetup || false,
        }
      } catch {
        const data = payload.data?.user || payload.user || payload
        const hotelData = data?.hotel || payload.data?.hotel || payload.hotel

        userProfile = {
          id: data.id || "",
          email: data.email || "",
          role: mapRole(data.role),
          name: resolveName(data),
          modules: pickModules(data.modules, payload.data?.modules, payload.modules, hotelData?.modules),
          hotelId: data.hotelId || hotelData?._id || hotelData?.id,
          hotelName: data.hotelName || hotelData?.name,
          expiryDate: payloadExpiryDate || pickExpiryDate(data, hotelData),
          needsSetup: payload.needsSetup || payload.data?.needsSetup || false,
        }
      }

      const nextSubscriptionInfo = userProfile.expiryDate
        ? getSubscriptionInfo(userProfile.expiryDate)
        : payloadSubscriptionInfo

      if (nextSubscriptionInfo?.status === "EXPIRED") {
        sessionStorage.removeItem(AUTH_STORAGE_KEY)
        sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
        sessionStorage.removeItem(SUBSCRIPTION_STORAGE_KEY)
        throw new Error(nextSubscriptionInfo.message)
      }

      setUser(userProfile)
      setSubscriptionInfo(nextSubscriptionInfo)
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile))
      if (nextSubscriptionInfo) {
        sessionStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(nextSubscriptionInfo))
      } else {
        sessionStorage.removeItem(SUBSCRIPTION_STORAGE_KEY)
      }

      return { accessToken, refreshToken, role: userProfile.role, needsSetup: userProfile.needsSetup }
    } catch (error) {
      throw error instanceof Error ? error : new Error("Login failed")
    }
  }, [])



  const hasAccess = useCallback(
    (module: ModuleType) => {
      if (!user) return false
      if (user.role === "super-admin") return true

      if (!user.modules || !Array.isArray(user.modules)) return false

      return user.modules.some(m => {
        const normalizedM = String(m).toLowerCase().trim()
        const normalizedTarget = String(module).toLowerCase().trim()
        return normalizedM === normalizedTarget ||
          normalizedM.replace(/-/g, '') === normalizedTarget.replace(/-/g, '')
      })
    },
    [user]
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        subscriptionInfo,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
