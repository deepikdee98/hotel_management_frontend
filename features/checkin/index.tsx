"use client"

import { CheckInForm } from "@/components/front-office/reception/check-in-form"
import type { CheckInFormProps } from "./types/checkin.types"

export function CheckInFeature(props: CheckInFormProps) {
  return <CheckInForm {...props} />
}

export default CheckInFeature
