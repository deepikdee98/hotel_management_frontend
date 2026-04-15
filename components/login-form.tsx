"use client"

import React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, Shield, UserCog, Users, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import type { UserRole } from "@/lib/types"
import { cn } from "@/lib/utils"

const ROLES: { id: UserRole; label: string; icon: typeof Shield; description: string }[] = [
  {
    id: "super-admin",
    label: "Super Admin",
    icon: Shield,
    description: "Manage all hotels and modules",
  },
  {
    id: "admin",
    label: "Hotel Admin",
    icon: UserCog,
    description: "Manage hotel staff and operations",
  },
  {
    id: "staff",
    label: "Staff",
    icon: Users,
    description: "Access assigned modules",
  },
]

export function LoginForm() {
  const router = useRouter()
  const { login } = useAuth()
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedRole) {
      setError("Please select a role")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const success = await login(email, password, selectedRole)

      if (success) {
        let targetPath = "/staff"
        if (selectedRole === "super-admin") {
          targetPath = "/super-admin"
        } else if (selectedRole === "admin") {
          targetPath = "/admin"
        }
        
        router.push(targetPath)
      } else {
        setError("Invalid credentials. Please try again.")
        setIsLoading(false)
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2 bg-primary rounded-lg">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">HotelManager Pro</h1>
          <p className="text-muted-foreground mt-1">Hotel Management System</p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">Sign In</CardTitle>
            <CardDescription>Select your role and enter credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label>Select Role</Label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map((role) => {
                    const Icon = role.icon
                    return (
                      <button
                        key={role.id}
                        type="button"
                        suppressHydrationWarning
                        onClick={() => setSelectedRole(role.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-lg border transition-all",
                          selectedRole === role.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-muted/30 hover:border-primary/50 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs font-medium text-center">{role.label}</span>
                      </button>
                    )
                  })}
                </div>
                {selectedRole && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {ROLES.find((r) => r.id === selectedRole)?.description}
                  </p>
                )}
              </div>

              {/* Credentials */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-background pr-10"
                    />
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg text-center">{error}</div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              {/* Demo Credentials */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground text-center">Demo Credentials</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium">Super Admin:</span> super@hotel.com / admin123
                  </p>
                  <p>
                    <span className="font-medium">Hotel Admin:</span> admin@grandhotel.com / admin123
                  </p>
                  <p>
                    <span className="font-medium">Staff:</span> staff@grandhotel.com / staff123
                  </p>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
