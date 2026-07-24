import { apiRequest } from "./client"
export async function changeAdminPassword(payload: { currentPassword: string; newPassword: string; confirmPassword: string }) {
  return apiRequest<{ success: boolean; message: string }>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function requestPasswordReset(identifier: string) {
  return apiRequest<{ success: boolean; message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ identifier }),
  })
}

export async function verifyOtp(identifier: string, otp: string) {
  return apiRequest<{ success: boolean; message: string }>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ identifier, otp }),
  })
}

export async function resetPassword(payload: { identifier: string; password: string; confirmPassword: string }) {
  return apiRequest<{ success: boolean; message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

