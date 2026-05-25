import type { CheckoutPlanMetadata } from "@/lib/pms-helpers"

export interface CheckInFormProps {
  mode?: "check-in" | "pax"
  editId?: string
  isEditMode?: boolean
  preSelectedRoomId?: string
  preSelectedRoomNo?: string
  reservationId?: string
}

export type TabType = "guest-info" | "guest-id" | "companion" | "vehicle-company"

export type Companion = {
  name: string
  mobile: string
  gender: string
  type: string
  idType: string
  idNumber: string
  separateBill: boolean
}

export type ExistingGuest = {
  id?: string
  guestName?: string
  fullName?: string
  title?: string
  email?: string
  gender?: string
  nationality?: string
  address?: string
  country?: string
  state?: string
  city?: string
  zip?: string
  company?: string
  gstNumber?: string
  gstIn?: string
  referredByType?: string
  referredById?: string
  referredByName?: string
  idProofType?: string
  idProofNumber?: string
}

export type SelectedService = {
  serviceId: string
  name: string
  price: number
  chargeType: string
}

export type CheckoutMetadataOption = CheckoutPlanMetadata | undefined
