"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { User, UserRole, ModuleType } from "./types"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<any>
  logout: () => void
  hasAccess: (module: ModuleType) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AUTH_STORAGE_KEY = "hotel_manager_auth"
const AUTH_TOKEN_STORAGE_KEY = "hotel_manager_tokens"
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

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
    return directUser as User
  }

  const data = payload.data
  if (data && typeof data === "object") {
    const dataRecord = data as Record<string, unknown>
    const nestedUser = dataRecord.user
    if (nestedUser && typeof nestedUser === "object") {
      return nestedUser as User
    }
  }

  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
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
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
    sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    window.location.href = "/"
  }, [])

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(AUTH_STORAGE_KEY)
      if (stored) {
        setUser(JSON.parse(stored))
      }
    } catch (e) {
      console.error("Restore failed:", e)
    }
    setIsLoading(false)
  }, [])

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

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const payload = await response.json()

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

        userProfile = {
          id: userData.id || userData._id || userData.sub || "",
          email: userData.email || "",
          role: mapRole(userData.role),
          name: resolveName(userData),
          modules: userData.modules || [],
          hotelId: userData.hotelId,
          hotelName: userData.hotelName,
        }
      } catch {
        const data = payload.data?.user || payload.user || payload

        userProfile = {
          id: data.id || "",
          email: data.email || "",
          role: mapRole(data.role),
          name: resolveName(data),
          modules: data.modules || [],
          hotelId: data.hotelId,
          hotelName: data.hotelName,
        }
      }

      setUser(userProfile)
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile))

      return { accessToken, refreshToken, role: userProfile.role }
    } catch {
      return null
    }
  }, [])



  const hasAccess = useCallback(
    (module: ModuleType) => {
      if (!user) return false
      // All authenticated roles have access to their defined modules in this version
      return true
    },
    [user]
  )

  return (
    <AuthContext.Provider
      value={{
        user,
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
