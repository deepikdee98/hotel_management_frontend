"use client"

import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Check, Circle, Eye, EyeOff, KeyRound, Loader2, LockKeyhole, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { useBranding } from "@/lib/branding-context"
import { changeAdminPassword } from "@/lib/backend-api"

const PASSWORD_REQUIREMENTS = [
  { label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { label: "One uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { label: "One lowercase letter", test: (value: string) => /[a-z]/.test(value) },
  { label: "One number", test: (value: string) => /[0-9]/.test(value) },
  { label: "One special character", test: (value: string) => /[^A-Za-z0-9\s]/.test(value) },
] as const

export default function ChangePasswordPage() {
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()
  const { companyName, logoUrl } = useBranding()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [succeeded, setSucceeded] = useState(false)
  const redirectTimer = useRef<number | null>(null)

  const isAdmin = user?.role === "admin" || user?.role === "company-admin"
  const adminName = user?.name?.trim() || "Administrator"
  const hotelName = user?.hotelName?.trim() || "Your Hotel"
  const requirements = useMemo(
    () => PASSWORD_REQUIREMENTS.map((requirement) => ({ ...requirement, met: requirement.test(newPassword) })),
    [newPassword]
  )
  const requirementsMet = requirements.every((requirement) => requirement.met)
  const satisfiedCount = requirements.filter((requirement) => requirement.met).length
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword
  const isReusedPassword = currentPassword.length > 0 && currentPassword === newPassword
  const canSubmit = currentPassword.length > 0 && requirementsMet && passwordsMatch && !isReusedPassword && !submitting
  const strength = !newPassword ? null : satisfiedCount === 5 ? "Strong" : satisfiedCount >= 3 ? "Medium" : "Weak"
  const strengthSegments = strength === "Strong" ? 3 : strength === "Medium" ? 2 : strength === "Weak" ? 1 : 0

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace("/")
    } else if (!isAdmin) {
      toast.error("Only administrators can change the password")
      router.replace("/admin")
    }
  }, [isAdmin, isLoading, router, user])

  useEffect(() => () => {
    if (redirectTimer.current) window.clearTimeout(redirectTimer.current)
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!canSubmit) {
      toast.error("Complete all password requirements before continuing")
      return
    }

    setSubmitting(true)
    try {
      await changeAdminPassword({ currentPassword, newPassword, confirmPassword })
      setSucceeded(true)
      toast.success("Password updated successfully")
      redirectTimer.current = window.setTimeout(() => logout(), 1500)
    } catch (error: any) {
      toast.error(error?.message || "Failed to change password")
      setSubmitting(false)
    }
  }

  if (isLoading || !user || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_30%_20%,#ffffff_0%,#f3f8ff_40%,#e7f1ff_75%,#dbe9ff_100%)] dark:bg-[radial-gradient(circle_at_30%_20%,#11203b_0%,#09162c_55%,#050e1f_100%)]">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" aria-label="Loading" />
      </main>
    )
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-x-hidden bg-[radial-gradient(circle_at_30%_20%,#ffffff_0%,#f3f8ff_40%,#e7f1ff_75%,#dbe9ff_100%)] px-6 py-6 text-[#0b172c] sm:px-10 lg:px-16 lg:py-8 dark:bg-[radial-gradient(circle_at_30%_20%,#11203b_0%,#09162c_55%,#050e1f_100%)] dark:text-white">
      <svg
        className="pointer-events-none absolute left-[28%] -top-[12%] h-[620px] w-[620px] text-[#2563eb]/10 dark:text-blue-400/10"
        viewBox="0 0 560 560"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="280" cy="280" r="236" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="280" cy="280" r="166" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="280" cy="280" r="96" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-8 top-8 hidden h-64 w-64 opacity-35 [background-image:radial-gradient(#3b82f6_1.5px,transparent_1.5px)] [background-size:18px_18px] md:block dark:opacity-20"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col">
        <header className="flex items-center gap-3">
          <Image
            src={logoUrl || "/logo.png"}
            alt={companyName}
            width={48}
            height={54}
            priority
            className="h-10 w-auto object-contain drop-shadow-[0_4px_12px_rgba(37,99,235,0.2)] lg:h-12"
          />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#0f172a] sm:text-2xl dark:text-white">
              {companyName}
            </h1>
            <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-[#3b82f6] sm:text-[10px] dark:text-blue-300">
              Precision Hospitality Platform
            </p>
          </div>
        </header>

        <section className="flex flex-1 items-center justify-center py-8 sm:py-10" aria-labelledby="change-password-title">
          <div className="w-full max-w-[460px] rounded-[28px] border border-white/80 bg-white/92 p-7 shadow-[0_25px_60px_-15px_rgba(37,99,235,0.2),0_10px_25px_rgba(0,0,0,0.03)] backdrop-blur-xl sm:p-8 dark:border-white/10 dark:bg-[#0f1d36]/92 dark:shadow-[0_25px_65px_-20px_rgba(0,0,0,0.7)]">
            <div className="text-center">
              <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-full bg-[#eff6ff] text-[#2563eb] shadow-inner dark:bg-blue-500/15 dark:text-blue-300">
                {succeeded ? <ShieldCheck className="h-6 w-6 text-emerald-600" /> : <KeyRound className="h-6 w-6 stroke-[1.75]" />}
              </div>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#2563eb] dark:text-blue-300">
                Secure First Login
              </p>
              <h2 id="change-password-title" className="mt-1 text-2xl font-bold text-[#0f172a] sm:text-[26px] dark:text-white">
                {succeeded ? "Password updated" : `Welcome, ${adminName} 👋`}
              </h2>
              {succeeded ? (
                <p className="mt-1.5 text-xs leading-relaxed text-[#64748b] dark:text-blue-100/65">
                  Your new password is ready. Redirecting you to sign in securely…
                </p>
              ) : (
                <div className="mt-1.5 text-xs leading-relaxed text-[#64748b] dark:text-blue-100/65">
                  <p>You&apos;re setting up your account for</p>
                  <p className="mt-0.5 text-sm font-bold text-[#2563eb] dark:text-blue-300">{hotelName}</p>
                  <p className="mt-2">Create your new password to continue.</p>
                  <p className="mt-1">
                    For security reasons, this is required only once before accessing your dashboard.
                  </p>
                </div>
              )}
            </div>

          {succeeded ? (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center dark:border-emerald-400/20 dark:bg-emerald-400/10" role="status" aria-live="polite">
              <div className="flex items-center justify-center gap-2 font-medium text-emerald-700 dark:text-emerald-300">
                <Check className="h-4 w-4" />
                Password changed successfully
              </div>
              <p className="mt-1.5 text-sm text-emerald-700/80 dark:text-emerald-300/80">
                Sign in again using your new password.
              </p>
              <Loader2 className="mx-auto mt-4 h-5 w-5 animate-spin text-emerald-600" aria-hidden="true" />
            </div>
          ) : (
            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword" className="text-xs font-semibold text-[#1e293b] dark:text-blue-50">Temporary password</Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                  <Input
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    className="h-11 rounded-xl border-[#cbd5e1] bg-white pl-10 text-sm text-[#0f172a] shadow-xs focus-visible:border-[#2563eb] focus-visible:ring-[#2563eb] dark:border-white/15 dark:bg-white/[0.06] dark:text-white"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-xs font-semibold text-[#1e293b] dark:text-blue-50">New password</Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className="h-11 rounded-xl border-[#cbd5e1] bg-white px-10 text-sm text-[#0f172a] shadow-xs focus-visible:border-[#2563eb] focus-visible:ring-[#2563eb] dark:border-white/15 dark:bg-white/[0.06] dark:text-white"
                      aria-describedby="password-strength password-requirements password-reuse"
                      required
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((visible) => !visible)}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#94a3b8] transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] dark:hover:bg-white/10 dark:hover:text-white"
                      aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                      aria-pressed={showNewPassword}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div id="password-strength" className="space-y-1.5" aria-live="polite">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#64748b] dark:text-blue-100/65">Password strength</span>
                    <span className={strength === "Strong" ? "font-medium text-emerald-600" : strength === "Medium" ? "font-medium text-amber-600" : strength === "Weak" ? "font-medium text-destructive" : "text-muted-foreground"}>
                      {strength ?? "Not entered"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1" aria-hidden="true">
                    {[1, 2, 3].map((segment) => (
                      <span
                        key={segment}
                        className={`h-1.5 rounded-sm transition-colors ${segment <= strengthSegments ? (strength === "Strong" ? "bg-emerald-500" : strength === "Medium" ? "bg-amber-500" : "bg-destructive") : "bg-slate-200 dark:bg-white/10"}`}
                      />
                    ))}
                  </div>
                </div>

                <ul id="password-requirements" className="grid gap-1.5 text-xs sm:grid-cols-2" aria-label="Password requirements">
                  {requirements.map((requirement) => (
                    <li key={requirement.label} className={`flex items-center gap-1.5 transition-colors ${requirement.met ? "text-emerald-600 dark:text-emerald-400" : "text-[#64748b] dark:text-blue-100/65"}`}>
                      {requirement.met ? <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : <Circle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                      <span>{requirement.label}</span>
                      <span className="sr-only">{requirement.met ? "met" : "not met"}</span>
                    </li>
                  ))}
                </ul>
                {isReusedPassword && (
                  <p id="password-reuse" className="text-xs text-destructive" role="alert">
                    Choose a password different from your temporary password.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold text-[#1e293b] dark:text-blue-50">Confirm new password</Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="h-11 rounded-xl border-[#cbd5e1] bg-white px-10 text-sm text-[#0f172a] shadow-xs focus-visible:border-[#2563eb] focus-visible:ring-[#2563eb] dark:border-white/15 dark:bg-white/[0.06] dark:text-white"
                    aria-describedby="password-match"
                    aria-invalid={confirmPassword.length > 0 && !passwordsMatch}
                    required
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#94a3b8] transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}
                    aria-pressed={showConfirmPassword}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p id="password-match" className={`flex items-center gap-1.5 text-xs ${passwordsMatch ? "text-emerald-600 dark:text-emerald-400" : confirmPassword ? "text-destructive" : "text-muted-foreground"}`} aria-live="polite">
                  {passwordsMatch && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                  {!confirmPassword ? "Re-enter your new password." : passwordsMatch ? "Passwords match." : "Passwords do not match."}
                </p>
              </div>

              <Button className="h-11 w-full rounded-xl bg-[#2563eb] text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-[#1d4ed8] focus-visible:ring-[#2563eb]" type="submit" disabled={!canSubmit}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {submitting ? "Updating password…" : "Update password"}
              </Button>
            </form>
          )}
          </div>
        </section>
      </div>
    </main>
  )
}
