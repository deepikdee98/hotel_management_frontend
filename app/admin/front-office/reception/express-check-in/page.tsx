"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createExpressCheckIn, getBookingNumberPreview, getCheckInData, getGuestByMobile } from "@/lib/backend-api"
import { Save, RotateCcw, X, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useSetupOptions } from "@/hooks/use-setup-options"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

type ExistingGuest = {
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
  idProofType?: string
  idProofNumber?: string
}

export default function ExpressCheckInPage() {
  const router = useRouter()
  const { toast } = useToast()
  const titleOptions = useSetupOptions("title")
  const checkoutPlanOptions = useSetupOptions("checkoutPlan")
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false)
  const [bookingPreview, setBookingPreview] = useState("Loading...")
  const [mobileLookupStatus, setMobileLookupStatus] = useState<"idle" | "loading" | "found" | "not-found" | "error">("idle")
  const [existingGuest, setExistingGuest] = useState<ExistingGuest | null>(null)
  const [showGuestDialog, setShowGuestDialog] = useState(false)
  const [loadedGuestId, setLoadedGuestId] = useState("")
  const lastCheckedMobile = useRef("")

  const [form, setForm] = useState({
    bookingNo: "Auto-generated",
    title: "",
    mobile: "",
    guestName: "",
    checkInDate: new Date().toISOString().slice(0, 10),
    checkInTime: new Date().toTimeString().slice(0, 5),
    noOfNights: "1",
    roomType: "",
    roomNo: "",
    checkoutPlan: "",
    email: "",
    address: "",
    gender: "",
    nationality: "",
    city: "",
    zip: "",
    state: "",
    country: "",
    gstIn: "",
  })

  useEffect(() => {
    let cancelled = false
    getBookingNumberPreview()
      .then((preview) => {
        if (!cancelled) setBookingPreview(preview)
      })
      .catch(() => {
        if (!cancelled) setBookingPreview("Pending")
      })

    return () => {
      cancelled = true
    }
  }, [])

  const filteredRooms = useMemo(() => {
    if (!form.roomType) return rooms
    return rooms.filter((room: any) => String(room.roomTypeId || "") === String(form.roomType))
  }, [form.roomType, rooms])

  const handleChange = (field: string, value: string) => {
    if (field === "mobile") {
      setLoadedGuestId("")
      lastCheckedMobile.current = ""
    }
    if (field === "roomType") {
      setForm(prev => ({ ...prev, roomType: value, roomNo: "" }))
      return
    }
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const renderSetupItems = (options: { data: Array<{ _id: string; value: string }>; loading: boolean }) => {
    if (options.loading) return <SelectItem value="__loading__" disabled>Loading...</SelectItem>
    if (!options.data.length) return <SelectItem value="__empty__" disabled>No options configured</SelectItem>
    return options.data.map((option) => <SelectItem key={option._id} value={option.value}>{option.value}</SelectItem>)
  }

  const handleReset = () => {
    setForm({
      bookingNo: "Auto-generated",
      title: "", 
      mobile: "",
      guestName: "",
      checkInDate: new Date().toISOString().slice(0, 10),
      checkInTime: new Date().toTimeString().slice(0, 5),
      noOfNights: "1", 
      roomType: "", 
      roomNo: "", 
      checkoutPlan: "",
      email: "",
      address: "",
      gender: "",
      nationality: "",
      city: "",
      zip: "",
      state: "",
      country: "",
      gstIn: "",
    })
    setExistingGuest(null)
    setLoadedGuestId("")
    setMobileLookupStatus("idle")
    lastCheckedMobile.current = ""
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getCheckInData();
        setRooms(data.rooms);
        setRoomTypes(data.roomTypes);
      } catch (error) {
        console.error("Failed to load data", error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const mobile = form.mobile.trim()
    if (mobile.length < 4) {
      setMobileLookupStatus("idle")
      setExistingGuest(null)
      lastCheckedMobile.current = ""
      return
    }

    if (mobile === lastCheckedMobile.current) return

    const timer = window.setTimeout(async () => {
      setMobileLookupStatus("loading")
      try {
        const response = await getGuestByMobile(mobile)
        lastCheckedMobile.current = mobile
        if (response.exists && response.data) {
          setExistingGuest(response.data as ExistingGuest)
          setMobileLookupStatus("found")
          setShowGuestDialog(true)
        } else {
          setExistingGuest(null)
          setMobileLookupStatus("not-found")
        }
      } catch {
        setExistingGuest(null)
        setMobileLookupStatus("error")
      }
    }, 500)

    return () => window.clearTimeout(timer)
  }, [form.mobile])

  const handleLoadExistingGuest = () => {
    if (!existingGuest) return

    setForm(prev => ({
      ...prev,
      title: existingGuest.title || prev.title,
      guestName: existingGuest.guestName || existingGuest.fullName || prev.guestName,
      email: existingGuest.email || prev.email,
      gender: existingGuest.gender || prev.gender,
      nationality: existingGuest.nationality || prev.nationality,
      address: existingGuest.address || prev.address,
      country: existingGuest.country || prev.country,
      state: existingGuest.state || prev.state,
      city: existingGuest.city || prev.city,
      zip: existingGuest.zip || prev.zip,
      gstIn: existingGuest.gstIn || existingGuest.gstNumber || prev.gstIn,
    }))
    setLoadedGuestId(existingGuest.id || "")
    toast({
      title: "Guest Loaded",
      description: "Existing guest details loaded.",
    })
    setShowGuestDialog(false)
  }

  const handleCheckIn = async () => {
    if (!form.title || !form.guestName || !form.mobile || !form.roomNo || !form.noOfNights) {
      toast({
        title: "Missing Fields",
        description: "Please fill all required fields marked with *",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const checkInDateTime = new Date(`${form.checkInDate}T${form.checkInTime}`).toISOString();
      const payload = {
        title: form.title,
        guestName: form.guestName,
        mobileNo: form.mobile,
        email: form.email,
        address: form.address,
        city: form.city,
        zip: form.zip,
        state: form.state,
        country: form.country,
        gender: form.gender,
        nationality: form.nationality,
        gstNumber: form.gstIn,
        roomNumber: form.roomNo,
        roomType: form.roomType,
        nights: Number(form.noOfNights),
        checkInDate: checkInDateTime,
        checkoutPlan: form.checkoutPlan,
        isExpress: true,
      };

      await createExpressCheckIn(payload);
      toast({
        title: "Success",
        description: "Express check-in successful.",
      })
      handleReset();
      router.push("/admin/front-office/in-house")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to check-in",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  };

  const isFormValid = Boolean(form.title && form.guestName && form.mobile && form.roomNo && form.noOfNights)

  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
      <div className="space-y-4 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Express Check-In</h1>
            <p className="text-sm text-muted-foreground">Fast-track check-in with minimal required fields</p>
          </div>
          <Badge variant="outline" className="text-xs font-semibold">Booking ID: {bookingPreview}</Badge>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Quick Guest Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Mobile Number <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input 
                    className="h-8 text-xs pr-8" 
                    value={form.mobile} 
                    onChange={e => handleChange("mobile", e.target.value)} 
                    placeholder="Enter mobile number" 
                  />
                  {mobileLookupStatus === "loading" && (
                    <Loader2 className="h-3 w-3 animate-spin absolute right-2.5 top-2.5 text-muted-foreground" />
                  )}
                </div>
                {loadedGuestId && (
                  <p className="text-[10px] text-green-600 font-medium">Existing guest loaded</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Title <span className="text-destructive">*</span></Label>
                <Select value={form.title} onValueChange={v => handleChange("title", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {renderSetupItems(titleOptions)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Guest Name <span className="text-destructive">*</span></Label>
                <Input className="h-8 text-xs" value={form.guestName} onChange={e => handleChange("guestName", e.target.value)} placeholder="Full name" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Check-In Date <span className="text-destructive">*</span></Label>
                  <Input className="h-8 text-xs" type="date" value={form.checkInDate} onChange={e => handleChange("checkInDate", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Check-In Time <span className="text-destructive">*</span></Label>
                  <Input className="h-8 text-xs" type="time" value={form.checkInTime} onChange={e => handleChange("checkInTime", e.target.value)} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">No of Nights <span className="text-destructive">*</span></Label>
                <Input className="h-8 text-xs" type="number" min="1" value={form.noOfNights} onChange={e => handleChange("noOfNights", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Room Type</Label>
                <Select value={form.roomType} onValueChange={v => handleChange("roomType", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((r: any) => (
                      <SelectItem key={r._id} value={r._id}>
                        {r.code || r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Room No <span className="text-destructive">*</span></Label>
                <Select value={form.roomNo} onValueChange={v => handleChange("roomNo", v)} disabled={!form.roomType}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={form.roomType ? "Select" : "Select room type first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredRooms.length === 0 ? (
                      <SelectItem value="__empty__" disabled>No rooms available</SelectItem>
                    ) : filteredRooms.map((room: any) => (
                      <SelectItem key={room.id} value={room.number}>
                        {room.number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Checkout Plan <span className="text-destructive">*</span></Label>
                <Select value={form.checkoutPlan} onValueChange={v => handleChange("checkoutPlan", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {renderSetupItems(checkoutPlanOptions)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 justify-end">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleReset} disabled={isLoading}><RotateCcw className="h-3.5 w-3.5" /> Reset</Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => router.back()} disabled={isLoading}><X className="h-3.5 w-3.5" /> Close</Button>
          <Button 
            size="sm" 
            className="gap-1.5 bg-green-600 hover:bg-green-700 text-white" 
            onClick={handleCheckIn} 
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Checking in...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                Check-In
              </>
            )}
          </Button>
        </div>
      </div>

      <Dialog open={showGuestDialog} onOpenChange={setShowGuestDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Existing guest found</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 pt-2 text-foreground text-sm">
                <div className="flex flex-col gap-1">
                  <p><strong>Name:</strong> {existingGuest?.guestName || existingGuest?.fullName}</p>
                  <p><strong>Mobile:</strong> {existingGuest?.gstIn || form.mobile}</p> 
                </div>
                <p className="pt-2">Do you want to load the guest details?</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowGuestDialog(false)}>
              No, continue as new
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleLoadExistingGuest}>
              Yes, load details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
