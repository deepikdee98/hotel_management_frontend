"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Save, X, ArrowRight, Loader2 } from "lucide-react"
import { getCheckedInRooms, getFrontOfficeRooms, getSetupRatePlans, shiftRoom } from "@/lib/backend-api"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function ShiftRoomPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [occupiedRooms, setOccupiedRooms] = useState<any[]>([])
  const [availableRooms, setAvailableRooms] = useState<any[]>([])
  const [ratePlans, setRatePlans] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    checkinId: "",
    currentRoom: "",
    guestName: "",
    checkInDate: "",
    oldRoomType: "",
    oldPlanType: "",
    newRoomId: "",
    newRoomNumber: "",
    newRoomType: "",
    newRoomTypeId: "",
    newPlanType: "",
    referredBy: "",
    remark: "",
  })

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const [occupied, available, plans] = await Promise.all([
          getCheckedInRooms(),
          getFrontOfficeRooms({ status: "available" }),
          getSetupRatePlans(),
        ])
        setOccupiedRooms(occupied)
        setAvailableRooms(available)
        setRatePlans(plans)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch room data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [toast])

  const handleCurrentRoom = (value: string) => {
    const checkin = occupiedRooms.find((c) => c._id === value)
    if (checkin) {
      setForm((prev) => ({
        ...prev,
        checkinId: value,
        currentRoom: checkin.roomNumber,
        guestName: checkin.guestName,
        checkInDate: checkin.checkInDate,
        oldRoomType: checkin.roomType,
        oldPlanType: checkin.planType,
      }))
    }
  }

  const handleNewRoom = (value: string) => {
    const room = availableRooms.find((r) => r.id === value)
    if (room) {
      setForm((prev) => ({
        ...prev,
        newRoomId: value,
        newRoomNumber: room.number,
        newRoomType: room.type,
        newRoomTypeId: room.roomTypeId,
      }))
    }
  }

  const handleSave = async () => {
    if (!form.checkinId || !form.newRoomId || !form.newPlanType || !form.remark) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    if (form.remark.length < 5) {
      toast({
        title: "Validation Error",
        description: "Remark must be at least 5 characters",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await shiftRoom({
        checkinId: form.checkinId,
        newRoomNumber: form.newRoomId, // The API expects room ID as newRoomNumber
        roomType: form.newRoomTypeId, // The API expects roomType ID
        planType: form.newPlanType, // The API expects planType ID
        referredBy: form.referredBy,
        remark: form.remark,
      })
      toast({
        title: "Success",
        description: "Room shifted successfully",
      })
      router.push("/admin/front-office/reception")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to shift room",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
      <div className="space-y-4 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shift Room</h1>
          <p className="text-sm text-muted-foreground">Transfer a guest from one room to another</p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Current Room */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Current Room Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Room No <span className="text-destructive">*</span></Label>
                <Select value={form.checkinId} onValueChange={handleCurrentRoom} disabled={isLoading}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={isLoading ? "Loading..." : "Select occupied room"} />
                  </SelectTrigger>
                  <SelectContent>
                    {occupiedRooms.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.roomNumber} - {c.guestName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Guest Name</Label>
                <Input className="h-8 text-xs bg-muted" value={form.guestName} readOnly />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Check-In Date</Label>
                <Input className="h-8 text-xs bg-muted" value={form.checkInDate ? new Date(form.checkInDate).toLocaleDateString() : ""} readOnly />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Room Type</Label>
                  <Input className="h-8 text-xs bg-muted" value={form.oldRoomType} readOnly />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Plan Type</Label>
                  <Input className="h-8 text-xs bg-muted" value={form.oldPlanType} readOnly />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* New Room */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-primary">New Room Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">New Room No <span className="text-destructive">*</span></Label>
                <Select value={form.newRoomId} onValueChange={handleNewRoom} disabled={isLoading}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={isLoading ? "Loading..." : "Select available room"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRooms.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.number} - {r.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">New Room Type</Label>
                <Input className="h-8 text-xs bg-muted" value={form.newRoomType} readOnly />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">New Plan Type <span className="text-destructive">*</span></Label>
                <Select value={form.newPlanType} onValueChange={(v) => setForm((prev) => ({ ...prev, newPlanType: v }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {ratePlans.map((p) => (
                      <SelectItem key={p._id || p.id} value={p._id || p.id}>
                        {p.name} ({p.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Referred By</Label>
                <Input className="h-8 text-xs" value={form.referredBy} onChange={(e) => setForm((prev) => ({ ...prev, referredBy: e.target.value }))} placeholder="Guest / Manager / Housekeeping" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Shift Remark <span className="text-destructive">*</span></CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea className="text-xs min-h-16" value={form.remark} onChange={(e) => setForm((prev) => ({ ...prev, remark: e.target.value }))} placeholder="Reason for room shift (min 5 characters)..." />
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 justify-end">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => router.back()}>
            <X className="h-3.5 w-3.5" /> Close
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Shift
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
