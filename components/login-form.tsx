"use client"

import { useEffect, useState, type FormEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowRight,
  BedDouble,
  Bell,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserRound,
  KeyRound,
  RefreshCw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { useBranding } from "@/lib/branding-context"
import { requestPasswordReset, verifyOtp as verifyOtpApi } from "@/lib/backend-api"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

const REMEMBERED_IDENTIFIER_KEY = "zentric.rememberedIdentifier"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const { companyName, logoUrl } = useBranding()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // View state: login or forgot-password
  const [view, setView] = useState<"login" | "forgot-password">("login")
  
  // Forgot Password / OTP states
  const [forgotIdentifier, setForgotIdentifier] = useState("")
  const [otp, setOtp] = useState("")
  const [forgotStep, setForgotStep] = useState<"request" | "verify">("request")
  const [isRequesting, setIsRequesting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [forgotError, setForgotError] = useState("")
  const [forgotMessage, setForgotMessage] = useState("")
  const [timer, setTimer] = useState(0)

  useEffect(() => {
    let interval: any
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timer])

  const handleRequestOtp = async (event?: FormEvent) => {
    if (event) event.preventDefault()
    setIsRequesting(true)
    setForgotError("")
    setForgotMessage("")
    setOtp("") // Clear OTP field on resend

    try {
      const result = await requestPasswordReset(forgotIdentifier)
      setForgotMessage(result.message || "If an account exists, an OTP has been sent.")
      setForgotStep("verify")
      setTimer(60)
    } catch (err: any) {
      setForgotError(err.message || "Failed to send OTP")
    } finally {
      setIsRequesting(false)
    }
  }

  const handleVerifyOtp = async (event: FormEvent) => {
    event.preventDefault()
    setIsVerifying(true)
    setForgotError("")

    try {
      await verifyOtpApi(forgotIdentifier, otp)
      router.push(`/reset-password?identifier=${encodeURIComponent(forgotIdentifier)}`)
    } catch (err: any) {
      setForgotError(err.message || "Invalid or expired OTP")
    } finally {
      setIsVerifying(false)
    }
  }

  useEffect(() => {
    const rememberedIdentifier = window.localStorage.getItem(REMEMBERED_IDENTIFIER_KEY)
    if (rememberedIdentifier) {
      setIdentifier(rememberedIdentifier)
      setRememberMe(true)
    }

    const errorParam = searchParams.get("error")
    if (errorParam) {
      const message = decodeURIComponent(errorParam)
      if (message.toLowerCase() === "user is not authorized") {
        router.replace("/")
        return
      }
      setError(message)
    }

    const forgotParam = searchParams.get("forgot")
    if (forgotParam === "true") {
      setView("forgot-password")
      setForgotStep("request")
      router.replace("/")
    }
  }, [router, searchParams])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await login(identifier, password)

      if (response?.accessToken) {
        if (rememberMe) {
          window.localStorage.setItem(REMEMBERED_IDENTIFIER_KEY, identifier)
        } else {
          window.localStorage.removeItem(REMEMBERED_IDENTIFIER_KEY)
        }

        const role = String(response.role || "").toLowerCase()
        if (response.mustChangePassword) {
          router.push("/change-password")
        } else {
          router.push(role === "superadmin" || role === "super-admin" ? "/super-admin" : "/admin")
        }
      } else {
        setError("Login failed. Please try again.")
      }
    } catch (caughtError: any) {
      const message = caughtError?.response?.data?.message || caughtError?.message
      setError(message || "Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col justify-between overflow-x-hidden bg-[radial-gradient(circle_at_30%_20%,#ffffff_0%,#f7faf9_40%,#eef5f4_75%,#e5efed_100%)] px-6 pt-6 text-[#14202b] sm:px-10 lg:px-16 lg:pt-8 dark:bg-[radial-gradient(circle_at_30%_20%,#11203b_0%,#09162c_55%,#050e1f_100%)] dark:text-white">
      {/* Background Decorative Arcs */}
      <svg
        className="pointer-events-none absolute left-[28%] -top-[12%] h-[620px] w-[620px] text-[#1f7c7c]/10 dark:text-blue-400/10"
        viewBox="0 0 560 560"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="280" cy="280" r="236" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="280" cy="280" r="166" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="280" cy="280" r="96" stroke="currentColor" strokeWidth="1.5" />
      </svg>

      {/* Top Right Decorative Dot Pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-8 top-8 hidden h-64 w-64 opacity-35 [background-image:radial-gradient(#247f80_1.5px,transparent_1.5px)] [background-size:18px_18px] md:block dark:opacity-20"
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl flex-1 flex flex-col justify-between">
        {/* Header Logo */}
        <header className="flex items-center gap-3">
          <Image
            src={logoUrl || "/logo.png"}
            alt={companyName}
            width={48}
            height={54}
            priority
            className="h-10 w-auto object-contain drop-shadow-[0_4px_12px_rgba(31,124,124,0.2)] lg:h-12"
          />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#14202b] sm:text-2xl dark:text-white">
              {companyName}
            </h1>
            <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-[#247f80] sm:text-[10px] dark:text-blue-300">
              Precision Hospitality Platform
            </p>
          </div>
        </header>

        {/* Main Grid Content */}
        <div className="my-auto py-6 grid grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-6 lg:gap-8">
          {/* Left Column: Hero Text & Features */}
          <div className="hidden flex-col justify-center md:col-span-6 md:flex lg:col-span-7">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#1f7c7c] dark:text-blue-400">
              <span className="h-4 w-[2px] rounded-full bg-[#1f7c7c]" />
              <Sparkles className="h-4 w-4 text-[#1f7c7c]" />
              <span>Modern Hotel Operations</span>
            </div>

            <h2 className="mt-3 text-4xl font-extrabold leading-[1.08] tracking-tight text-[#14202b] sm:text-5xl md:text-4xl lg:text-5xl xl:text-6xl dark:text-white">
              Every stay begins<br />
              with <span className="text-[#1f7c7c]">effortless</span><br />
              <span className="text-[#1f7c7c]">
                operations.
              </span>
            </h2>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-[#667382] sm:text-lg dark:text-teal-100/80">
              A calm, connected workspace for front desk, rooms, housekeeping, accounts, and the people who make hospitality memorable.
            </p>

            {/* Feature Pills */}
            <div className="mt-7 flex flex-wrap items-center gap-4 sm:gap-6 text-sm font-semibold text-[#1e293b] dark:text-blue-100">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-100/80 text-[#1f7c7c] shadow-xs dark:bg-blue-900/40 dark:text-blue-300">
                  <BedDouble className="h-5 w-5" />
                </span>
                <span>Rooms</span>
              </div>
              <span className="h-6 w-px bg-slate-300/70 dark:bg-white/15" />
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100/80 text-[#1f7c7c] shadow-xs dark:bg-emerald-900/40 dark:text-emerald-300">
                  <Bell className="h-5 w-5" />
                </span>
                <span>Service</span>
              </div>
              <span className="h-6 w-px bg-slate-300/70 dark:bg-white/15" />
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-100/80 text-[#1f7c7c] shadow-xs dark:bg-purple-900/40 dark:text-purple-300">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <span>Secure</span>
              </div>
            </div>
          </div>

          {/* Right Column: Floating Login Card */}
          <div className="w-full md:col-span-6 lg:col-span-5">
            <div className="mx-auto max-w-[420px] rounded-[28px] border border-white/80 bg-white/92 p-7 shadow-[0_25px_60px_-15px_rgba(31,124,124,0.2),0_10px_25px_rgba(0,0,0,0.03)] backdrop-blur-xl sm:p-8 dark:border-white/10 dark:bg-[#0f1d36]/92 dark:shadow-[0_25px_65px_-20px_rgba(0,0,0,0.7)]">
              {view === "login" ? (
                <>
                  {/* Card Header */}
                  <div className="text-center">
                    <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-full bg-[#eaf3f2] text-[#1f7c7c] shadow-inner dark:bg-blue-500/15 dark:text-blue-300">
                      <Building2 className="h-6 w-6 stroke-[1.75]" />
                    </div>
                    <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#1f7c7c] dark:text-blue-300">
                      Welcome Back
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-[#14202b] sm:text-[26px] dark:text-white">
                      <span className="text-[#1f7c7c] dark:text-blue-400">Sign in</span> to your hotel
                    </h2>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#667382] dark:text-blue-100/65">
                      Enter your credentials to continue to the operations workspace.
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="identifier" className="text-xs font-semibold text-[#1e293b] dark:text-blue-50">
                        Username or Email
                      </Label>
                      <div className="relative">
                        <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                        <Input
                          id="identifier"
                          type="text"
                          placeholder="Enter username or email"
                          value={identifier}
                          onChange={(event) => setIdentifier(event.target.value)}
                          required
                          autoComplete="username"
                          disabled={isLoading}
                          className="h-11 rounded-xl border-[#cbd5e1] bg-white pl-10 text-sm text-[#14202b] shadow-xs placeholder:text-[#94a3b8] focus-visible:border-[#1f7c7c] focus-visible:ring-[#1f7c7c] dark:border-white/15 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-blue-100/40"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-4">
                        <Label htmlFor="password" className="text-xs font-semibold text-[#1e293b] dark:text-blue-50">
                          Password
                        </Label>
                        <button
                          type="button"
                          onClick={() => {
                            setView("forgot-password")
                            setForgotStep("request")
                            setForgotError("")
                            setForgotMessage("")
                            setForgotIdentifier("")
                          }}
                          className="text-xs font-semibold text-[#1f7c7c] transition-colors hover:text-[#176869] hover:underline focus-visible:outline-none dark:text-blue-400"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          required
                          autoComplete="current-password"
                          disabled={isLoading}
                          className="h-11 rounded-xl border-[#cbd5e1] bg-white px-10 text-sm text-[#14202b] shadow-xs placeholder:text-[#94a3b8] focus-visible:border-[#1f7c7c] focus-visible:ring-[#1f7c7c] dark:border-white/15 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-blue-100/40"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((visible) => !visible)}
                          disabled={isLoading}
                          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#94a3b8] transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7c7c] dark:hover:bg-white/10 dark:hover:text-white"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 pt-0.5">
                      <Checkbox
                        id="remember-me"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked === true)}
                        disabled={isLoading}
                        className="h-4 w-4 rounded border-[#cbd5e1] data-[state=checked]:border-[#1f7c7c] data-[state=checked]:bg-[#1f7c7c]"
                      />
                      <Label htmlFor="remember-me" className="cursor-pointer text-xs font-medium text-[#667382] dark:text-blue-100/70">
                        Remember me
                      </Label>
                    </div>

                    {error && (
                      <div
                        role="alert"
                        aria-live="polite"
                        className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-600 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
                      >
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="group h-11 w-full rounded-xl bg-[#1f7c7c] text-sm font-semibold text-white shadow-md shadow-teal-700/20 transition-all hover:bg-[#176869] focus-visible:ring-[#1f7c7c]"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          <span>Sign In</span>
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Footer Notice */}
                  <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] font-medium text-[#667382] dark:text-blue-100/55">
                    <ShieldCheck className="h-4 w-4 text-[#1f7c7c] dark:text-blue-400" />
                    Protected access for authorized hotel staff
                  </div>
                </>
              ) : (
                <>
                  {/* Card Header for Forgot Password */}
                  <div className="text-center">
                    <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-full bg-[#eaf3f2] text-[#1f7c7c] shadow-inner dark:bg-blue-500/15 dark:text-blue-300">
                      {forgotStep === "request" ? (
                        <KeyRound className="h-6 w-6 stroke-[1.75]" />
                      ) : (
                        <ShieldCheck className="h-6 w-6 stroke-[1.75]" />
                      )}
                    </div>
                    <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#1f7c7c] dark:text-blue-300">
                      Security Portal
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-[#14202b] sm:text-[26px] dark:text-white">
                      {forgotStep === "request" ? "Forgot Password" : "Verify OTP"}
                    </h2>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#667382] dark:text-blue-100/65">
                      {forgotStep === "request" 
                        ? "Enter your username, email or mobile number to receive an OTP" 
                        : "Enter the 6-digit code sent to your registered contact"}
                    </p>
                  </div>

                  {forgotStep === "request" ? (
                    <form onSubmit={handleRequestOtp} className="mt-6 space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="forgot-identifier" className="text-xs font-semibold text-[#1e293b] dark:text-blue-50">
                          Username, Email or Mobile
                        </Label>
                        <div className="relative">
                          <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                          <Input
                            id="forgot-identifier"
                            type="text"
                            placeholder="Enter username, email or mobile"
                            value={forgotIdentifier}
                            onChange={(event) => setForgotIdentifier(event.target.value)}
                            required
                            disabled={isRequesting}
                            className="h-11 rounded-xl border-[#cbd5e1] bg-white pl-10 text-sm text-[#14202b] shadow-xs placeholder:text-[#94a3b8] focus-visible:border-[#1f7c7c] focus-visible:ring-[#1f7c7c] dark:border-white/15 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-blue-100/40"
                          />
                        </div>
                      </div>

                      {forgotError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-600 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
                          {forgotError}
                        </div>
                      )}
                      {forgotMessage && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs font-medium text-blue-600 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">
                          {forgotMessage}
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={isRequesting}
                        className="group h-11 w-full rounded-xl bg-[#1f7c7c] text-sm font-semibold text-white shadow-md shadow-teal-700/20 transition-all hover:bg-[#176869] focus-visible:ring-[#1f7c7c]"
                      >
                        {isRequesting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <span>Send OTP</span>
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setView("login")
                          setForgotError("")
                          setForgotMessage("")
                        }}
                        className="h-11 w-full rounded-xl border-[#cbd5e1] text-sm font-semibold text-slate-700 bg-white transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-blue-100 dark:hover:bg-white/10"
                      >
                        Back to Sign In
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
                      <div className="flex flex-col items-center justify-center space-y-3.5 py-2">
                        <Label htmlFor="otp" className="text-xs font-semibold text-[#1e293b] dark:text-blue-50">
                          Enter 6-digit OTP
                        </Label>
                        <InputOTP
                          maxLength={6}
                          value={otp}
                          onChange={(value) => setOtp(value)}
                          disabled={isVerifying}
                          className="mx-auto"
                        >
                          <InputOTPGroup className="gap-2">
                            <InputOTPSlot index={0} className="h-11 w-11 rounded-lg border border-slate-300 text-center font-bold text-lg dark:border-white/15 dark:bg-white/[0.06]" />
                            <InputOTPSlot index={1} className="h-11 w-11 rounded-lg border border-slate-300 text-center font-bold text-lg dark:border-white/15 dark:bg-white/[0.06]" />
                            <InputOTPSlot index={2} className="h-11 w-11 rounded-lg border border-slate-300 text-center font-bold text-lg dark:border-white/15 dark:bg-white/[0.06]" />
                            <InputOTPSlot index={3} className="h-11 w-11 rounded-lg border border-slate-300 text-center font-bold text-lg dark:border-white/15 dark:bg-white/[0.06]" />
                            <InputOTPSlot index={4} className="h-11 w-11 rounded-lg border border-slate-300 text-center font-bold text-lg dark:border-white/15 dark:bg-white/[0.06]" />
                            <InputOTPSlot index={5} className="h-11 w-11 rounded-lg border border-slate-300 text-center font-bold text-lg dark:border-white/15 dark:bg-white/[0.06]" />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>

                      {forgotError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-600 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
                          {forgotError}
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={isVerifying || otp.length !== 6}
                        className="group h-11 w-full rounded-xl bg-[#1f7c7c] text-sm font-semibold text-white shadow-md shadow-teal-700/20 transition-all hover:bg-[#176869] focus-visible:ring-[#1f7c7c]"
                      >
                        {isVerifying ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <span>Verify OTP</span>
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </Button>

                      <div className="flex flex-col gap-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 w-full rounded-xl border-[#cbd5e1] text-sm font-semibold text-slate-700 bg-white transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-blue-100 dark:hover:bg-white/10"
                          onClick={() => handleRequestOtp()}
                          disabled={isRequesting || timer > 0}
                        >
                          {isRequesting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                          )}
                          {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP"}
                        </Button>

                        <div className="text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setForgotStep("request")
                              setTimer(0)
                              setOtp("")
                              setForgotError("")
                            }}
                            className="text-xs font-semibold text-[#1f7c7c] hover:underline focus-visible:outline-none dark:text-blue-400"
                          >
                            Try another identifier
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="relative mt-8 -mx-6 hidden overflow-hidden border-t border-white/10 bg-gradient-to-r from-[#13232e] to-[#182b36] px-8 py-8 sm:-mx-10 md:block lg:-mx-16 lg:px-12">
        <Building2 className="pointer-events-none absolute left-14 top-1/2 h-24 w-24 -translate-y-1/2 text-[#6fa4a2]/15" strokeWidth={1} aria-hidden="true" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 max-w-6xl mx-auto">
          <div className="ml-20 flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#57aaa8]">
              {companyName}
            </span>
            <h3 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
              Precision Hospitality Platform
            </h3>
          </div>
          
          <div className="relative max-w-md md:text-right">
            <span className="absolute -left-6 -top-4 text-5xl font-serif text-[#75aaa8]/20 leading-none select-none">&ldquo;</span>
            <p className="text-base font-light italic leading-relaxed text-slate-300 sm:text-lg">
              One property or many &mdash; always <span className="font-extrabold not-italic text-white underline decoration-[#4c9998] decoration-2 underline-offset-4">in view.</span>
            </p>
            <span className="absolute -right-4 -bottom-6 text-5xl font-serif text-[#75aaa8]/20 leading-none select-none">&rdquo;</span>
          </div>
        </div>
      </footer>
    </main>
  )
}
