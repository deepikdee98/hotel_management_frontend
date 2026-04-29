import { Suspense } from "react"
import { LoginForm } from "@/components/login-form"

export default function Home() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
