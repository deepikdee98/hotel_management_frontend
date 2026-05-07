"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Save, RotateCcw, X, Printer } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getCheckedInRooms, createRoomAdvance, getRoomGuests } from "@/lib/backend-api"
import { useSetupOptions } from "@/hooks/use-setup-options"

export default function RoomAdvancePage() {
  const [rooms, setRooms] = useState<any[]>([])
  const [guests, setGuests] = useState<any[]>([])
  const [isLoadingGuests, setIsLoadingGuests] = useState(false)
  const paymentModeOptions = useSetupOptions("paymentMode")
  const ledgerAccountOptions = useSetupOptions("ledgerAccount")
  const [form, setForm] = useState({
    receiptNo: "RCP-" + Date.now().toString().slice(-6),
    date: new Date().toISOString().slice(0, 16),
    roomNo: "",
    bookingNo: "",
    guestId: "",
    guestName: "",
    advanceAmount: "",
    paymentMode: "",
    ledgerAc: "",
    panNo: "",
    remark: "",
    noOfPrint: "1",
  })

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const data = await getCheckedInRooms("checked-in")

        const formatted = data
          .filter((c: any) => c.guestType !== "PAX") // Usually advance is on main guest
          .map((c: any) => ({
            id: c.roomId || c.roomNumber?._id,
            roomNo: c.roomNumber?.roomNumber || c.roomNumber,
            guest: c.guestName,
            booking: c.bookingNo || c._id
          }))

        // Deduplicate rooms by ID, keeping the newest one
        const uniqueRooms: any[] = []
        const seen = new Set()
        formatted.forEach(r => {
          if (r.id && !seen.has(r.id)) {
            uniqueRooms.push(r)
            seen.add(r.id)
          }
        })

        setRooms(uniqueRooms)
      } catch (err) {
        console.error(err)
      }
    }

    loadRooms()
  }, [])

  const handleChange = async (field: string, value: string) => {
    if (field === "roomNo") {
      const room = rooms.find(r => r.id === value)

      if (room) {
        setForm(prev => ({
          ...prev,
          roomNo: value,
          bookingNo: room.booking,
          guestName: room.guest,
          guestId: ""
        }))

        // Fetch all guests (Main + Companions) for this room
        setIsLoadingGuests(true)
        try {
          const res = await getRoomGuests(value)
          setGuests(res.data)
          
          // Default to Main guest
          const mainGuest = res.data.find((g: any) => g.type === "Main")
          if (mainGuest) {
            const compositeId = `${mainGuest.id}|${mainGuest.name}`
            setForm(prev => ({ 
              ...prev, 
              guestId: compositeId, 
              guestName: mainGuest.name 
            }))
          }
        } catch (err) {
          console.error("Failed to load guests", err)
        } finally {
          setIsLoadingGuests(false)
        }
      }
    } else if (field === "guestId") {
      // Handle composite value id|name for unique selection
      const [id, name] = value.split("|")
      const guest = guests.find(g => g.id === id && g.name === name)
      if (guest) {
        setForm(prev => ({ ...prev, guestId: value, guestName: name }))
      }
    } else {
      setForm(prev => ({ ...prev, [field]: value }))
    }

    if (field === "paymentMode" && (value === "Cash" || value === "Card")) {
      const ledgerValue = value === "Cash" ? "Cash Account" : "HDFC Hotel Account"
      setForm(prev => ({ ...prev, paymentMode: value, ledgerAc: ledgerValue }))
    }
  }

  const handleSave = async () => {
    try {
      if (!form.roomNo || !form.guestId || !form.advanceAmount || !form.paymentMode || !form.ledgerAc) {
        alert("Please fill all required fields")
        return
      }

      const actualGuestId = form.guestId.includes("|") ? form.guestId.split("|")[0] : form.guestId

      await createRoomAdvance({
        roomNumber: form.roomNo,
        guestId: actualGuestId,
        guestName: form.guestName,
        advanceAmount: Number(form.advanceAmount),
        paymentMode: form.paymentMode,
        ledgerAccount: form.ledgerAc,
        panNo: form.panNo,
        noOfPrint: Number(form.noOfPrint),
        remarks: form.remark
      })

      alert("Advance saved successfully ")
      handleReset()

    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to save")
    }
  }

  const handleReset = () => {
    setForm({
      receiptNo: "RCP-" + Date.now().toString().slice(-6),
      date: new Date().toISOString().slice(0, 16),
      roomNo: "", bookingNo: "", guestName: "", guestId: "", advanceAmount: "",
      paymentMode: "", ledgerAc: "", panNo: "", remark: "", noOfPrint: "1",
    })
    setGuests([])
  }

  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
      <div className="space-y-4 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Room Advance</h1>
            <p className="text-sm text-muted-foreground">Record advance payment for a checked-in room</p>
          </div>
          <Badge variant="outline" className="text-xs">Receipt: {form.receiptNo}</Badge>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Advance Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">Room No <span className="text-destructive">*</span></Label>
                <Select value={form.roomNo} onValueChange={v => handleChange("roomNo", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {rooms.map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.roomNo} - {r.guest}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Booking No</Label>
                <Input className="h-8 text-xs bg-muted" value={form.bookingNo} readOnly />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Guest Name <span className="text-destructive">*</span></Label>
                <Select value={form.guestId} onValueChange={v => handleChange("guestId", v)} disabled={!form.roomNo || isLoadingGuests}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={isLoadingGuests ? "Loading..." : "Select Guest"} />
                  </SelectTrigger>
                  <SelectContent>
                    {guests.map((g, index) => (
                      <SelectItem key={`${g.id}-${g.name}-${index}`} value={`${g.id}|${g.name}`}>
                        {g.name} ({g.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">Date & Time</Label>
                <Input className="h-8 text-xs bg-muted" type="datetime-local" value={form.date} readOnly />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Advance Amount <span className="text-destructive">*</span></Label>
                <Input className="h-8 text-xs" type="number" min="1" value={form.advanceAmount} onChange={e => handleChange("advanceAmount", e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Payment Mode <span className="text-destructive">*</span></Label>
                <Select value={form.paymentMode} onValueChange={v => handleChange("paymentMode", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {paymentModeOptions.loading ? <SelectItem value="__loading__" disabled>Loading...</SelectItem> : paymentModeOptions.data.map(p => <SelectItem key={p._id} value={p.value}>{p.value}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">Ledger A/C <span className="text-destructive">*</span></Label>
                <Select value={form.ledgerAc} onValueChange={v => handleChange("ledgerAc", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {ledgerAccountOptions.loading ? <SelectItem value="__loading__" disabled>Loading...</SelectItem> : ledgerAccountOptions.data.map(l => <SelectItem key={l._id} value={l.value}>{l.value}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">PAN No</Label>
                <Input className="h-8 text-xs" value={form.panNo} onChange={e => handleChange("panNo", e.target.value)} placeholder="Optional" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">No of Print</Label>
                <Input className="h-8 text-xs" type="number" min="1" value={form.noOfPrint} onChange={e => handleChange("noOfPrint", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Remarks</Label>
              <Textarea className="text-xs min-h-16" value={form.remark} onChange={e => handleChange("remark", e.target.value)} placeholder="Optional notes..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 justify-end">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleReset}><RotateCcw className="h-3.5 w-3.5" /> Reset</Button>
          <Button variant="outline" size="sm" className="gap-1.5"><X className="h-3.5 w-3.5" /> Close</Button>
          <Button variant="outline" size="sm" className="gap-1.5"><Printer className="h-3.5 w-3.5" /> Print Receipt</Button>
          <Button size="sm" className="gap-1.5" onClick={handleSave}><Save className="h-3.5 w-3.5" /> Save</Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
