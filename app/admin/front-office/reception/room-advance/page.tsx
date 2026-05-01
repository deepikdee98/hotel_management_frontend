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
import { getCheckedInRooms, createRoomAdvance } from "@/lib/backend-api"
import { useSetupOptions } from "@/hooks/use-setup-options"




export default function RoomAdvancePage() {
  const [rooms, setRooms] = useState<any[]>([])
  const paymentModeOptions = useSetupOptions("paymentMode")
  const ledgerAccountOptions = useSetupOptions("ledgerAccount")
  const [form, setForm] = useState({
    receiptNo: "RCP-" + Date.now().toString().slice(-6),
    date: new Date().toISOString().slice(0, 16),
    roomNo: "",
    bookingNo: "",
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
        const data = await getCheckedInRooms()

        const formatted = data.map((c: any) => ({
          id: c.roomId || c.roomNumber?._id,
          roomNo: c.roomNumber?.roomNumber || c.roomNumber,
          guest: c.guestName,
          booking: c.bookingNo || c._id
        }))

        // Deduplicate rooms by ID to avoid duplicate key warnings
        const uniqueRooms = Array.from(
          new Map(formatted.map(r => [r.id, r])).values()
        )

        setRooms(uniqueRooms)
      } catch (err) {
        console.error(err)
      }
    }

    loadRooms()
  }, [])

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (field === "roomNo") {
      const room = rooms.find(r => r.id === value)

      if (room) {
        setForm(prev => ({
          ...prev,
          roomNo: value,
          bookingNo: room.booking,
          guestName: room.guest
        }))
      }
    }
    if (field === "paymentMode" && value === "Cash") {
      setForm(prev => ({ ...prev, paymentMode: value, ledgerAc: "Cash" }))
    }
  }

  const handleSave = async () => {
    try {
      if (!form.roomNo || !form.advanceAmount || !form.paymentMode || !form.ledgerAc) {
        alert("Please fill all required fields")
        return
      }

      await createRoomAdvance({
        roomNumber: form.roomNo,
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
      roomNo: "", bookingNo: "", guestName: "", advanceAmount: "",
      paymentMode: "", ledgerAc: "", panNo: "", remark: "", noOfPrint: "1",
    })
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
                <Label className="text-xs">Guest Name</Label>
                <Input className="h-8 text-xs bg-muted" value={form.guestName} readOnly />
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
