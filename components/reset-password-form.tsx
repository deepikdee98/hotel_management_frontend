"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, type FormEvent } from "react"
import { ArrowRight, Eye, EyeOff, KeyRound, Loader2, LockKeyhole, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resetPassword } from "@/lib/backend-api"
import { useBranding } from "@/lib/branding-context"

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { companyName, logoUrl } = useBranding()
  const identifier = searchParams.get("identifier") || ""
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      const result = await resetPassword({ identifier, password, confirmPassword })
      setMessage(result.message || "Password reset successfully")
      setTimeout(() => router.push("/"), 1200)
    } catch (error: any) {
      setError(error.message || "Failed to reset password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-x-hidden bg-[radial-gradient(circle_at_30%_20%,#ffffff_0%,#f3f8ff_40%,#e7f1ff_75%,#dbe9ff_100%)] px-6 py-6 text-[#0b172c] sm:px-10 lg:px-16 lg:py-8 dark:bg-[radial-gradient(circle_at_30%_20%,#11203b_0%,#09162c_55%,#050e1f_100%)] dark:text-white">
      <svg className="pointer-events-none absolute left-[28%] -top-[12%] h-[620px] w-[620px] text-[#2563eb]/10 dark:text-blue-400/10" viewBox="0 0 560 560" fill="none" aria-hidden="true">
        <circle cx="280" cy="280" r="236" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="280" cy="280" r="166" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="280" cy="280" r="96" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <div aria-hidden="true" className="pointer-events-none absolute right-8 top-8 hidden h-64 w-64 opacity-35 [background-image:radial-gradient(#3b82f6_1.5px,transparent_1.5px)] [background-size:18px_18px] md:block dark:opacity-20" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col">
        <header className="flex items-center gap-3">
          <Image src={logoUrl || "/logo.png"} alt={companyName} width={48} height={54} priority className="h-10 w-auto object-contain drop-shadow-[0_4px_12px_rgba(37,99,235,0.2)] lg:h-12" />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#0f172a] sm:text-2xl dark:text-white">{companyName}</h1>
            <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-[#3b82f6] sm:text-[10px] dark:text-blue-300">Precision Hospitality Platform</p>
          </div>
        </header>

        <section className="flex flex-1 items-center justify-center py-8 sm:py-10" aria-labelledby="reset-password-title">
          <div className="w-full max-w-[420px] rounded-[28px] border border-white/80 bg-white/92 p-7 shadow-[0_25px_60px_-15px_rgba(37,99,235,0.2),0_10px_25px_rgba(0,0,0,0.03)] backdrop-blur-xl sm:p-8 dark:border-white/10 dark:bg-[#0f1d36]/92 dark:shadow-[0_25px_65px_-20px_rgba(0,0,0,0.7)]">
            <div className="text-center">
              <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-full bg-[#eff6ff] text-[#2563eb] shadow-inner dark:bg-blue-500/15 dark:text-blue-300">
                <KeyRound className="h-6 w-6 stroke-[1.75]" />
              </div>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#2563eb] dark:text-blue-300">Security Portal</p>
              <h2 id="reset-password-title" className="mt-1 text-2xl font-bold text-[#0f172a] sm:text-[26px] dark:text-white">Reset Password</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-[#64748b] dark:text-blue-100/65">Create a new password for your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {!identifier && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-center text-xs font-medium text-red-600 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">User identifier is missing. Please start over from the forgot password page.</div>}

              <div className={`${identifier ? "mt-6" : ""} space-y-1.5`}>
                <Label htmlFor="password" className="text-xs font-semibold text-[#1e293b] dark:text-blue-50">New Password</Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="h-11 rounded-xl border-[#cbd5e1] bg-white px-10 text-sm text-[#0f172a] shadow-xs placeholder:text-[#94a3b8] focus-visible:border-[#2563eb] focus-visible:ring-[#2563eb] dark:border-white/15 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-blue-100/40"
                  />
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#94a3b8] transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold text-[#1e293b] dark:text-blue-50">Confirm Password</Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    className="h-11 rounded-xl border-[#cbd5e1] bg-white pl-10 text-sm text-[#0f172a] shadow-xs placeholder:text-[#94a3b8] focus-visible:border-[#2563eb] focus-visible:ring-[#2563eb] dark:border-white/15 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-blue-100/40"
                  />
                </div>
              </div>

              {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-center text-xs font-medium text-red-600 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">{error}</div>}
              {message && <div className="rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-center text-xs font-medium text-blue-600 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">{message}</div>}

              <Button type="submit" className="group h-11 w-full rounded-xl bg-[#2563eb] text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-[#1d4ed8] focus-visible:ring-[#2563eb]" disabled={isLoading || !identifier}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <><span>Reset Password</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>
                )}
              </Button>

              <Button type="button" variant="outline" className="h-11 w-full rounded-xl border-[#cbd5e1] bg-white text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-blue-100 dark:hover:bg-white/10" asChild>
                <Link href="/">Back to Sign In</Link>
              </Button>
            </form>
            <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] font-medium text-[#64748b] dark:text-blue-100/55">
              <ShieldCheck className="h-4 w-4 text-[#2563eb] dark:text-blue-400" />
              Your password is protected with secure encryption
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
