"use client"

import Link from "next/link"
import { useState, type FormEvent, useEffect } from "react"
import { Building2, Loader2, KeyRound, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requestPasswordReset, verifyOtp as verifyOtpApi } from "@/lib/backend-api"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

export function ForgotPasswordForm() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"request" | "verify">("request")
  const [isRequesting, setIsRequesting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
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
    setError("")
    setMessage("")
    setOtp("") // Clear OTP field on resend

    try {
      const result = await requestPasswordReset(identifier)
      setMessage(result.message || "If an account exists, an OTP has been sent.")
      setStep("verify")
      setTimer(60)
    } catch (error: any) {
      setError(error.message || "Failed to send OTP")
    } finally {
      setIsRequesting(false)
    }
  }

  const handleVerifyOtp = async (event: FormEvent) => {
    event.preventDefault()
    setIsVerifying(true)
    setError("")

    try {
      await verifyOtpApi(identifier, otp)
      router.push(`/reset-password?identifier=${encodeURIComponent(identifier)}`)
    } catch (error: any) {
      setError(error.message || "Invalid or expired OTP")
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="rounded-lg bg-primary p-2">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">HotelManager Pro</h1>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">
              {step === "request" ? "Forgot Password" : "Verify OTP"}
              <p className="mt-1 text-sm font-normal text-muted-foreground">
                {step === "request" 
                  ? "Enter your username, email or mobile number to receive an OTP" 
                  : `Enter the 6-digit code sent to your registered contact`}
              </p>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === "request" ? (
              <form onSubmit={handleRequestOtp} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="identifier">Identifier</Label>
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="Username, Email or Mobile"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    required
                    className="bg-background"
                  />
                </div>

                {error && <div className="rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive">{error}</div>}
                {message && <div className="rounded-lg bg-primary/10 p-3 text-center text-sm text-primary">{message}</div>}

                <Button type="submit" className="w-full" disabled={isRequesting || isVerifying}>
                  {isRequesting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </Button>

                <Button type="button" variant="outline" className="w-full" asChild disabled={isRequesting || isVerifying}>
                  <Link href="/">Back to Sign In</Link>
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <Label htmlFor="otp">Enter 6-digit OTP</Label>
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => setOtp(value)}
                    disabled={isRequesting || isVerifying}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {error && <div className="rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive">{error}</div>}

                <Button type="submit" className="w-full" disabled={isRequesting || isVerifying || otp.length !== 6}>
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </Button>

                <div className="flex flex-col space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleRequestOtp()}
                    disabled={isRequesting || isVerifying || timer > 0}
                  >
                    {isRequesting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP"}
                  </Button>

                  <div className="text-center">
                    <Button 
                      type="button" 
                      variant="link" 
                      onClick={() => {
                        setStep("request")
                        setTimer(0)
                        setOtp("")
                      }}
                      className="text-sm"
                      disabled={isRequesting || isVerifying}
                    >
                      Try another identifier
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
