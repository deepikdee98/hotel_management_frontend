"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createExpressCheckIn, getCheckInData } from "@/lib/backend-api"
import { Save, RotateCcw, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function ExpressCheckInPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [form, setForm] = useState({
    bookingNo: "BK-" + Date.now().toString().slice(-6),
    title: "",
    guestName: "",
    registerNo: "",
    checkInDate: new Date().toISOString().slice(0, 16),
    noOfNights: "1",
    roomType: "",
    roomNo: "",
    checkoutPlan: "",
  })

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleReset = () => {
    setForm({
      bookingNo: "BK-" + Date.now().toString().slice(-6),
      title: "", guestName: "", registerNo: "",
      checkInDate: new Date().toISOString().slice(0, 16),
      noOfNights: "1", roomType: "", roomNo: "", checkoutPlan: "",
    })
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

  const handleSave = async () => {
    try {
      const payload = {
        guestName: form.guestName,
        roomNumber: form.roomNo,
        nights: Number(form.noOfNights),
        checkInDate: form.checkInDate,
        title: form.title,
      };

      const res = await createExpressCheckIn(payload);
      handleReset();

    } catch (error: any) {
      alert(error.message || "Failed to check-in");
    }
  };

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-4 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Express Check-In</h1>
            <p className="text-sm text-muted-foreground">Fast-track check-in with minimal required fields</p>
          </div>
          <Badge variant="outline" className="text-xs">Booking: {form.bookingNo}</Badge>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Quick Guest Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Title <span className="text-destructive">*</span></Label>
                <Select value={form.title} onValueChange={v => handleChange("title", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["Mr", "Mrs", "Ms", "Dr", "Prof"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Guest Name <span className="text-destructive">*</span></Label>
                <Input className="h-8 text-xs" value={form.guestName} onChange={e => handleChange("guestName", e.target.value)} placeholder="Full name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Register No</Label>
                <Input className="h-8 text-xs" value={form.registerNo} onChange={e => handleChange("registerNo", e.target.value)} placeholder="Register number" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Check-In Date & Time</Label>
                <Input className="h-8 text-xs" type="datetime-local" value={form.checkInDate} onChange={e => handleChange("checkInDate", e.target.value)} />
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
                    ))}                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Room No <span className="text-destructive">*</span></Label>
                <Select value={form.roomNo} onValueChange={v => handleChange("roomNo", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {rooms.map((room: any) => (
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
                <Label className="text-xs">Checkout Plan</Label>
                <Select value={form.checkoutPlan} onValueChange={v => handleChange("checkoutPlan", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["24 Noon", "12 Noon", "6 AM"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 justify-end">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleReset}><RotateCcw className="h-3.5 w-3.5" /> Reset</Button>
          <Button variant="outline" size="sm" className="gap-1.5"><X className="h-3.5 w-3.5" /> Close</Button>
          <Button size="sm" className="gap-1.5" onClick={handleSave}><Save className="h-3.5 w-3.5" /> Save</Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
