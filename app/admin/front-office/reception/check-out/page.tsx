"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { DoorOpen, Printer, Pencil, CalendarClock, CreditCard, Loader2, Star, CheckCircle2, X } from "lucide-react"
import { getInHouseGuests, getFolioDetails, createCheckOut, getSetupRoomTypes, getSetupRatePlans, updateCheckIn } from "@/lib/backend-api"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import EditDetailsModal from "@/components/common/EditDetailsModal"

export default function CheckOutPage() {
  const [selectedRoom, setSelectedRoom] = useState("")
  const [billingType, setBillingType] = useState("complete")
  const [inHouseGuests, setInHouseGuests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [folioData, setFolioData] = useState<any>(null)
  const [fetchingFolio, setFetchingFolio] = useState(false)
  const [processingCheckout, setProcessingCheckout] = useState(false)
  const [roomTypes, setRoomTypes] = useState<any[]>([])
  const [ratePlans, setRatePlans] = useState<any[]>([])
  const [checkoutResult, setCheckoutResult] = useState<any>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const getGuestRoomNumber = (guest: any) => {
    return String(guest?.roomNumber ?? guest?.room?.roomNumber ?? guest?.room?.number ?? guest?.room?.roomNo ?? "").trim()
  }

  const getGuestDisplayName = (guest: any) => {
    return String(guest?.guestName ?? guest?.name ?? "").trim()
  }

  const getGuestFolioNumber = (guest: any) => {
    return String(guest?.folioNumber ?? guest?.folio?.folioNumber ?? "").trim()
  }

  // Extra checkout fields
  const [keyCardsReturned, setKeyCardsReturned] = useState(1)
  const [minibarChecked, setMinibarChecked] = useState(true)
  const [minibarCharges, setMinibarCharges] = useState(0)
  const [roomInspected, setRoomInspected] = useState(true)
  const [damageCharges, setDamageCharges] = useState(0)
  const [rating, setRating] = useState(5)
  const [comments, setComments] = useState("")
  const [invoiceRequired, setInvoiceRequired] = useState(true)
  const [emailInvoice, setEmailInvoice] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    guestName: "",
    mobileNo: "",
    email: "",
    address: "",
    gstNumber: ""
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  const handleEditCheckIn = () => {
    if (!room) return
    setEditFormData({
      guestName: room.guestName || room.name || "",
      mobileNo: room.mobileNo || "",
      email: room.email || "",
      address: room.address || "",
      gstNumber: room.gstNumber || ""
    })
    setIsEditModalOpen(true)
  }

  const handleUpdateCheckIn = async () => {
    if (!room) return
    try {
      const response = await updateCheckIn(room.checkinId || room.id, editFormData)
      if (response.success) {
        toast.success("Check-in details updated")
        setIsEditModalOpen(false)
        fetchInHouseGuests() // Refresh data
      }
    } catch (error: any) {
      console.error("Update failed:", error)
      toast.error(error.message || "Failed to update details")
    }
  }

  async function fetchInitialData() {
    setLoading(true)
    try {
      const [guestsRes, roomTypesRes, ratePlansRes] = await Promise.all([
        getInHouseGuests(),
        getSetupRoomTypes(),
        getSetupRatePlans()
      ])

      if (guestsRes.success) {
        setInHouseGuests(guestsRes.data.guests || [])
      }
      setRoomTypes(roomTypesRes)
      setRatePlans(ratePlansRes)
    } catch (error) {
      console.error("Failed to fetch initial data:", error)
      toast.error("Failed to load initial data")
    } finally {
      setLoading(false)
    }
  }

  async function fetchInHouseGuests() {
    try {
      const response = await getInHouseGuests()
      if (response.success) {
        setInHouseGuests(response.data.guests || [])
      }
    } catch (error) {
      console.error("Failed to fetch in-house guests:", error)
      toast.error("Failed to load in-house guests")
    }
  }

  const handleRoomChange = async (roomNumber: string) => {
    setShowSuccess(false)
    setSelectedRoom(roomNumber)
    setFolioData(null)
    const guest = inHouseGuests.find(g => getGuestRoomNumber(g) === String(roomNumber).trim())
    if (guest && (guest.folioId || guest.id)) {
      setFetchingFolio(true)
      try {
        const response = await getFolioDetails(guest.folioId || guest.id)
        if (response.success) {
          setFolioData(response.data.folio || response.data)
        }
      } catch (error) {
        console.error("Failed to fetch folio details:", error)
        toast.error("Failed to load billing details")
      } finally {
        setFetchingFolio(false)
      }
    }
  }

  const handleCheckout = async () => {
    if (!selectedRoom || !folioData) return

    setProcessingCheckout(true)
    try {
      const guest = inHouseGuests.find(g => getGuestRoomNumber(g) === String(selectedRoom).trim())
      if (!guest) {
        toast.error("Selected room details were not found")
        return
      }
      const payload = {
        folioId: guest.folioId || guest.id,
        actualCheckOutTime: new Date().toISOString(),
        settlementComplete: true,
        keyCardsReturned,
        minibarChecked,
        minibarCharges,
        roomInspected,
        damageCharges,
        guestFeedback: {
          rating,
          comments,
        },
        invoiceRequired,
        emailInvoice,
      }

      const response = await createCheckOut(payload)
      if (response.success) {
        toast.success("Checkout processed successfully")
        setCheckoutResult(response.data)
        setShowSuccess(true)

        // Reset and refresh
        // setSelectedRoom("")
        // setFolioData(null)
        setKeyCardsReturned(1)
        setMinibarChecked(true)
        setMinibarCharges(0)
        setRoomInspected(true)
        setDamageCharges(0)
        setRating(5)
        setComments("")

        fetchInHouseGuests()
      }
    } catch (error: any) {
      console.error("Checkout failed:", error)
      toast.error(error.message || "Checkout failed")
    } finally {
      setProcessingCheckout(false)
    }
  }

  const handlePrint = () => {
    const content = document.getElementById("gr-card-print")

    if (!content) return

    const win = window.open("", "", "width=900,height=700")

    if (win) {
      win.document.write(`
      <html>
        <head>
          <title>Bill</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body {
              margin: 0;
              padding: 20px;
              background: white;
            }
          </style>
        </head>

        <body>
          ${content.outerHTML}
        </body>
      </html>
    `)

      win.document.close()
      setTimeout(() => {
        win.print()
        win.close()
      }, 500)
    }
  }

  const room = inHouseGuests.find(g => getGuestRoomNumber(g) === String(selectedRoom).trim())
  const roomOptions = Array.from(
    new Map(
      inHouseGuests
        .map((guest) => {
          const roomNumber = getGuestRoomNumber(guest)
          if (!roomNumber) return null

          return [
            roomNumber,
            {
              roomNumber,
              guestName: getGuestDisplayName(guest),
              folioNumber: getGuestFolioNumber(guest),
            },
          ] as const
        })
        .filter((entry): entry is readonly [string, { roomNumber: string; guestName: string; folioNumber: string }] => Boolean(entry))
    ).values()
  ).sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true, sensitivity: "base" }))

  // Calculate billing from folioData or fallback to room data
  const charges = folioData?.charges || []
  const roomCharges = charges.filter((c: any) => c.category === "room-tariff").reduce((sum: number, c: any) => sum + (c.amount || 0), 0) || (room?.planCharges * room?.nights) || 0
  const serviceCharges = charges.filter((c: any) => c.category !== "room-tariff").reduce((sum: number, c: any) => sum + (c.amount || 0), 0) || 0

  const cgst = folioData?.cgst || 0
  const sgst = folioData?.sgst || 0
  const totalTax = cgst + sgst
  const grossTotal = folioData?.summary?.totalCharges || (roomCharges + serviceCharges + totalTax)
  const advance = folioData?.summary?.totalPayments || room?.advanceAmount || 0
  const netPayable = grossTotal - advance

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Check-Out</h1>
          <p className="text-sm text-muted-foreground">Process guest departure and finalize billing</p>
        </div>

        {showSuccess && checkoutResult && (
          <Card className="bg-green-50/50 border-green-200 shadow-none">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-900">Checkout Successful</p>
                  <p className="text-xs text-green-700 font-medium">Ref: {checkoutResult.checkOutId} | Booking: {checkoutResult.bookingId}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" className="h-8 text-xs gap-1.5 bg-green-600 hover:bg-green-700" onClick={() => window.print()}>
                  <Printer className="h-3.5 w-3.5" /> Generate Bill
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100" onClick={() => setShowSuccess(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div id="gr-card-print" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Room Selection */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Room Selection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Room No <span className="text-destructive">*</span></Label>
                  <Select value={selectedRoom} onValueChange={handleRoomChange}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select room" /></SelectTrigger>
                    <SelectContent>
                      {roomOptions.length > 0 ? (
                        roomOptions.map((option) => (
                          <SelectItem key={option.roomNumber} value={option.roomNumber}>
                            {[option.roomNumber, option.guestName, option.folioNumber].filter(Boolean).join(" - ")}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-rooms" disabled>No occupied rooms available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Billing Type</Label>
                  <Select value={billingType} onValueChange={setBillingType}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="complete">Complete Billing</SelectItem>
                      <SelectItem value="room">Room Billing</SelectItem>
                      <SelectItem value="split">Split Billing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {room && (
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Room:</span><span className="font-medium text-foreground">{getGuestRoomNumber(room) || "N/A"}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Guest:</span><span className="font-medium text-foreground">{room.guestName || room.name}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Folio:</span><span className="text-foreground">{folioData?.folioNumber || room.folioNumber || "N/A"}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Booking:</span><span className="text-foreground">{room.bookingNo || room.bookingId || room.reservationId || "N/A"}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Check-In:</span><span className="text-foreground">{room.checkInDate || room.checkIn}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Check-Out:</span><span className="text-foreground">{room.checkOutDate || room.checkOut || "N/A"}</span></div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Room Type:</span>
                      <span className="text-foreground">
                        {room.roomType?.name ||
                          room.type ||
                          roomTypes.find(rt => (rt._id === (room.roomType?.$oid || room.roomType)) || (rt.id === (room.roomType?.$oid || room.roomType)))?.name ||
                          "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Plan:</span>
                      <span className="text-foreground">
                        {room.ratePlan?.name ||
                          ratePlans.find(rp => (rp._id === (room.planType?.$oid || room.planType)) || (rp.id === (room.planType?.$oid || room.planType)))?.name ||
                          "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Nights:</span><span className="text-foreground">{room.nights || 0}</span></div>
                  </div>
                )}
                <div className="flex flex-col gap-2 pt-2">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs justify-start" onClick={handleEditCheckIn}><Pencil className="h-3 w-3" /> Check-in Details Update</Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs justify-start"><CalendarClock className="h-3 w-3" /> Change Date (F2)</Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs justify-start"><CreditCard className="h-3 w-3" /> Change Tariff (F1)</Button>
                </div>
              </CardContent>
            </Card>

            {/* Billing Summary */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Billing Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {fetchingFolio ? (
                  <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : folioData ? (
                  <div className="space-y-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Description</TableHead>
                          <TableHead className="text-xs text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="text-xs">Room Charges ({room?.nights || 0} nights)</TableCell>
                          <TableCell className="text-xs text-right">{roomCharges.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-xs">Other Services (Laundry, Minibar)</TableCell>
                          <TableCell className="text-xs text-right">{serviceCharges.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-xs text-muted-foreground">CGST</TableCell>
                          <TableCell className="text-xs text-right text-muted-foreground">{cgst.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-xs text-muted-foreground">SGST</TableCell>
                          <TableCell className="text-xs text-right text-muted-foreground">{sgst.toFixed(2)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                    <Separator />
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs"><span>Gross Total</span><span className="font-medium">{grossTotal.toFixed(2)}</span></div>
                      <div className="flex justify-between text-xs text-green-600"><span>Advance Paid</span><span>-{advance.toFixed(2)}</span></div>
                      <Separator />
                      <div className="flex justify-between text-sm font-bold"><span>Net Payable</span><span className="text-primary">{netPayable.toFixed(2)}</span></div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="minibar" checked={minibarChecked} onCheckedChange={(v) => setMinibarChecked(!!v)} />
                          <Label htmlFor="minibar" className="text-xs">Minibar Checked</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="inspected" checked={roomInspected} onCheckedChange={(v) => setRoomInspected(!!v)} />
                          <Label htmlFor="inspected" className="text-xs">Room Inspected</Label>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground uppercase">Key Cards Returned</Label>
                          <Input
                            type="number"
                            className="h-7 text-xs"
                            value={keyCardsReturned}
                            onChange={(e) => setKeyCardsReturned(parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground uppercase">Minibar Charges</Label>
                          <Input
                            type="number"
                            className="h-7 text-xs"
                            value={minibarCharges}
                            onChange={(e) => setMinibarCharges(parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground uppercase">Damage Charges</Label>
                          <Input
                            type="number"
                            className="h-7 text-xs"
                            value={damageCharges}
                            onChange={(e) => setDamageCharges(parseFloat(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <Label className="text-xs">Guest Feedback</Label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-4 w-4 cursor-pointer ${s <= rating ? "fill-warning text-warning" : "text-muted-foreground"}`}
                            onClick={() => setRating(s)}
                          />
                        ))}
                      </div>
                      <Textarea
                        placeholder="Comments..."
                        className="text-xs h-16"
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="invoice" checked={invoiceRequired} onCheckedChange={(v) => setInvoiceRequired(!!v)} />
                        <Label htmlFor="invoice" className="text-xs">Invoice Required</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="email" checked={emailInvoice} onCheckedChange={(v) => setEmailInvoice(!!v)} />
                        <Label htmlFor="email" className="text-xs">Email Invoice</Label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-12">Select a room to view billing details</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {selectedRoom && folioData && (
          <div className="flex items-center gap-2 justify-end">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5" /> Print Payment Statement (F3)
            </Button>
            {billingType === "split" && (
              <Button variant="outline" size="sm" className="gap-1.5"><Printer className="h-3.5 w-3.5" /> Split Print (F5)</Button>
            )}
            <Button
              size="sm"
              className="gap-1.5"
              onClick={handleCheckout}
              disabled={processingCheckout}
            >
              {processingCheckout ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <DoorOpen className="h-3.5 w-3.5" />}
              Checkout (F10)
            </Button>
          </div>
        )}
      </div>

      <EditDetailsModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Update Guest Details"
        formData={editFormData}
        setFormData={setEditFormData}
        onSubmit={handleUpdateCheckIn}
        fields={[
          { name: "guestName", label: "Guest Name" },
          { name: "mobileNo", label: "Mobile Number" },
          { name: "email", label: "Email Address" },
          { name: "address", label: "Address" },
          { name: "gstNumber", label: "GST Number" },
        ]}
      />
    </DashboardLayout>
  )
}
