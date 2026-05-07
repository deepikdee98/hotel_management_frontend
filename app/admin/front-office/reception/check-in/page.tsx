"use client"

import { useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CheckInForm } from "@/components/front-office/reception/check-in-form"

export default function CheckInPage() {
  const searchParams = useSearchParams()
  const checkInId = searchParams.get("id") || ""
  const isEditMode = searchParams.get("mode") === "edit" && Boolean(checkInId)

  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
      <CheckInForm 
        mode="check-in" 
        editId={checkInId} 
        isEditMode={isEditMode} 
      />
    </DashboardLayout>
  )
}
