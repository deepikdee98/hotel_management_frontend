"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { CheckInForm } from "@/components/front-office/reception/check-in-form"

export default function PaxCheckInPage() {
  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
      <CheckInForm mode="pax" />
    </DashboardLayout>
  )
}
