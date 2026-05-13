"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function SetupPopup() {
  const router = useRouter()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (user?.role === "admin" && user?.needsSetup) {
      setOpen(true)
    }
  }, [user])

  const handleConfirm = () => {
    setOpen(false)
    router.push("/admin/front-office/setup")
  }

  const handleCancel = () => {
    setOpen(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Complete Hotel Setup</AlertDialogTitle>
          <AlertDialogDescription>
            Your hotel setup is incomplete. Would you like to complete it now?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>No</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Yes</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
