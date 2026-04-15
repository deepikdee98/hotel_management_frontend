"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { User, UserRole, ModuleType } from "./types"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string, role: UserRole) => Promise<boolean>
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

  // Restore auth state from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(AUTH_STORAGE_KEY)
      if (stored) {
        const parsedUser = JSON.parse(stored)
        setUser(parsedUser)
      }
    } catch (e) {
      console.error("Failed to restore auth state:", e)
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string, role: UserRole): Promise<boolean> => {
    const roleMap: Record<UserRole, string> = {
      "super-admin": "superadmin",
      admin: "hoteladmin",
      staff: "staff",
    }
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role: roleMap[role],
        }),
      })

      if (!response.ok) {
        return false
      }

      const payload = (await response.json()) as Record<string, unknown>
      const accessToken = pickToken(payload, ["accessToken", "token", "jwt"])
      const refreshToken = pickToken(payload, ["refreshToken", "refresh"])

      if (!accessToken) {
        return false
      }

      sessionStorage.setItem(
        AUTH_TOKEN_STORAGE_KEY,
        JSON.stringify({
          accessToken,
          refreshToken,
        })
      )

      const apiUser = pickUser(payload)
      const userProfile: User = apiUser || {
        id: email,
        name: email.split("@")[0],
        email,
        role,
        modules: role === "staff" ? ["front-office"] : ["front-office", "point-of-sale", "housekeeping", "accounts", "reports"],
      }

      setUser(userProfile)
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile))
      return true
    } catch {
      return false
    }
  }, [])

  const logout = useCallback(() => {
    const tokensRaw = sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
    if (tokensRaw) {
      try {
        const parsed = JSON.parse(tokensRaw) as { accessToken?: string }
        if (parsed.accessToken) {
          fetch(`${API_BASE_URL}/auth/logout`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${parsed.accessToken}`,
            },
          }).catch(() => {})
        }
      } catch {
        // Ignore token parse errors on logout
      }
    }

    setUser(null)
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
    sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
  }, [])

  const hasAccess = useCallback(
    (module: ModuleType): boolean => {
      if (!user) return false
      if (user.role === "super-admin") return true
      return user.modules?.includes(module) ?? false
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
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
