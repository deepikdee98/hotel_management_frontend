import type { Companion } from "../types/checkin.types"
import type { CheckoutPlanMetadata } from "@/lib/pms-helpers"

export const createEmptyCompanion = (): Companion => ({
  name: "",
  mobile: "",
  gender: "",
  type: "",
  idType: "",
  idNumber: "",
  separateBill: false,
})

export const normalizeCompanion = (companion: Partial<Companion> = {}): Companion => ({
  name: String(companion.name || ""),
  mobile: String(companion.mobile || ""),
  gender: String(companion.gender || ""),
  type: String(companion.type || ""),
  idType: String(companion.idType || ""),
  idNumber: String(companion.idNumber || ""),
  separateBill: Boolean(companion.separateBill),
})

export const toMoneyString = (value: number | string) => (Number(value) || 0).toFixed(2)

export const normalizeRoomTypeName = (name: string) => {
  if (!name) return ""
  const normalized = name.trim().toLowerCase()
  if (normalized === "excutiv" || normalized === "excutive") return "Executive"
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export const getNightlyCharge = (
  singleCharge: unknown,
  totalCharge: unknown,
  nights: unknown
) => {
  const single = Number(singleCharge)
  if (Number.isFinite(single) && single > 0) return single

  const total = Number(totalCharge)
  const totalNights = Math.max(1, Number(nights) || 1)
  if (Number.isFinite(total) && total > 0) return total / totalNights

  return 0
}

export const getCheckoutPlanMetadata = (
  planValue: string,
  optionMetadata?: CheckoutPlanMetadata
): CheckoutPlanMetadata | undefined => {
  const normalizedPlan = planValue.toLowerCase().replace(/[\s_-]+/g, "")

  if (/(^|[^0-9])24([^0-9]|$)/.test(normalizedPlan) || normalizedPlan.includes("24hour")) {
    return { type: "duration", hours: 24 }
  }

  if (normalizedPlan.includes("12noon") || normalizedPlan.includes("noon")) {
    return { type: "fixed", time: "12:00" }
  }

  return optionMetadata
}
