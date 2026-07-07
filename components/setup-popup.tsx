"use client"

import { useEffect, useState } from "react"
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
    if ((user?.role === "admin" || user?.role === "company-admin") && user?.needsSetup) {
      setOpen(true)
    }
  }, [user])

  const handleConfirm = () => {
    setOpen(false)
    router.push("/admin/front-office/setup")
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Complete Hotel Setup</AlertDialogTitle>
          <AlertDialogDescription>
            Your hotel setup is incomplete. Would you like to configure it now?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setOpen(false)}>No</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Yes</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
