export type SubscriptionStatus = "ACTIVE" | "WARNING" | "GRACE" | "EXPIRED" | "INACTIVE"

export interface SubscriptionInfo {
  status: SubscriptionStatus
  daysLeft: number
  message: string
  expiryDate?: string | null
}

const DAY_MS = 24 * 60 * 60 * 1000
const GRACE_DAYS = 3

function formatDayLabel(days: number) {
  return `${days} day${days === 1 ? "" : "s"}`
}

export function normalizeSubscriptionStatus(status: unknown): SubscriptionStatus {
  const normalized = String(status || "").toUpperCase()

  if (normalized === "GRACE_PERIOD") return "GRACE"
  if (normalized === "WARNING") return "WARNING"
  if (normalized === "GRACE") return "GRACE"
  if (normalized === "EXPIRED") return "EXPIRED"
  if (normalized === "INACTIVE" || normalized === "NOT_FOUND") return "INACTIVE"

  return "ACTIVE"
}

function startOfLocalDay(value: Date) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

export function getSubscriptionInfo(expiryDate: string): SubscriptionInfo {
  if (!expiryDate) {
    return {
      status: "INACTIVE",
      daysLeft: 0,
      message: "Subscription expiry date is missing. Please contact Super Admin",
      expiryDate: null,
    }
  }

  const expiry = new Date(expiryDate)

  if (Number.isNaN(expiry.getTime())) {
    return {
      status: "INACTIVE",
      daysLeft: 0,
      message: "Subscription expiry date is invalid. Please contact Super Admin",
      expiryDate,
    }
  }

  const today = startOfLocalDay(new Date())
  const expiryDay = startOfLocalDay(expiry)
  const daysLeft = Math.ceil((expiryDay.getTime() - today.getTime()) / DAY_MS)

  if (daysLeft <= -GRACE_DAYS) {
    return {
      status: "EXPIRED",
      daysLeft,
      message: "Subscription expired. Please contact Super Admin",
      expiryDate,
    }
  }

  if (daysLeft <= 0) {
    const graceDaysLeft = GRACE_DAYS + daysLeft
    return {
      status: "GRACE",
      daysLeft,
      message: `Subscription expired. ${formatDayLabel(graceDaysLeft)} left in grace period`,
      expiryDate,
    }
  }

  if (daysLeft <= 30) {
    return {
      status: "WARNING",
      daysLeft,
      message: `Your subscription will expire in ${formatDayLabel(daysLeft)}`,
      expiryDate,
    }
  }

  return {
    status: "ACTIVE",
    daysLeft,
    message: "",
    expiryDate,
  }
}
