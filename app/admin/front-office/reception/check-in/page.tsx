"use client"

import { useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CheckInFeature } from "@/features/checkin"

export default function CheckInPage() {
  const searchParams = useSearchParams()
  const checkInId = searchParams.get("id") || ""
  const reservationId = searchParams.get("reservationId") || ""
  const roomId = searchParams.get("roomId") || ""
  const roomNo = searchParams.get("roomNo") || ""
  const isEditMode = searchParams.get("mode") === "edit" && Boolean(checkInId)

  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
      <CheckInFeature
        mode="check-in" 
        editId={checkInId} 
        isEditMode={isEditMode} 
        preSelectedRoomId={roomId}
        preSelectedRoomNo={roomNo}
        reservationId={reservationId}
      />
    </DashboardLayout>
  )
}
