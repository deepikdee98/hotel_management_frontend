"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getInHouseGuests, createPaxCheckIn } from "@/lib/backend-api";
import { Textarea } from "@/components/ui/textarea"
import { Save, RotateCcw, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"



export default function PaxCheckInPage() {
  const [inHouseGuests, setInHouseGuests] = useState<any[]>([]);
  const [form, setForm] = useState({
    bookingNo: "BK-" + Date.now().toString().slice(-6),
    roomNo: "",
    title: "",
    guestName: "",
    mobile: "",
    email: "",
    dob: "",
    gender: "",
    guestType: "PAX",
    idProofType: "",
    idProofNumber: "",
    paymentMode: "",
    advanceAmount: "0",
    remark: "",
  })
  const [mainGuest, setMainGuest] = useState({ name: "", booking: "" })

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));

    if (field === "roomNo") {
      const selected = inHouseGuests.find(g => g.checkinId === value);

      if (selected) {
        setMainGuest({
          name: selected.guestName,
          booking: selected.bookingId,
        });
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await getInHouseGuests();
        setInHouseGuests(res.data.guests);
      } catch (err) {
        console.error("Failed to load in-house guests", err);
      }
    };

    loadData();
  }, []);

  const handleReset = () => {
    setForm({
      bookingNo: "BK-" + Date.now().toString().slice(-6),
      roomNo: "", title: "", guestName: "", mobile: "", email: "", dob: "",
      gender: "", guestType: "PAX", idProofType: "", idProofNumber: "",
      paymentMode: "", advanceAmount: "0", remark: "",
    })
    setMainGuest({ name: "", booking: "" })
  }
  const handleSave = async () => {
    try {
      if (!form.roomNo || !form.guestName) {
        alert("Room and Guest Name required");
        return;
      }

      // Backend expects: { guests: [{ name, phone, relationship }] }
      const payload = {
        guests: [
          {
            name: (form.title ? form.title + " " : "") + form.guestName,
            phone: form.mobile,
            email: form.email,
            idProofType: form.idProofType,
            idProofNumber: form.idProofNumber,
            gender: form.gender,
            dob: form.dob,
            relationship: form.remark, // Using remark as relationship for now
          }
        ]
      };

      await createPaxCheckIn(form.roomNo, payload);

      alert("PAX Check-in successful");
      handleReset();
    } catch (error: any) {
      alert(error.message || "Failed to check-in");
    }
  };



  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">PAX Check-In</h1>
            <p className="text-sm text-muted-foreground">Check-in additional guest in an already occupied room</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">PAX Booking: {form.bookingNo}</Badge>
            <Badge variant="secondary" className="text-xs">Guest Type: PAX</Badge>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Room Selection (Occupied Rooms Only)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Room No <span className="text-destructive">*</span></Label>
                <Select value={form.roomNo} onValueChange={v => handleChange("roomNo", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select occupied room" /></SelectTrigger>
                  <SelectContent>
                    {inHouseGuests.map((r: any, index: number) => (
                      <SelectItem
                        key={r.checkinId || index}
                        value={r.checkinId || `room-${index}`}
                      >
                        {r.roomNumber || "N/A"} - {r.guestName || "Guest"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Main Guest</Label>
                <Input className="h-8 text-xs bg-muted" value={mainGuest.name || ""} readOnly />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Main Booking No</Label>
                <Input className="h-8 text-xs bg-muted" value={mainGuest.booking || ""} readOnly />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">PAX Guest Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs">Title <span className="text-destructive">*</span></Label>
                <Select value={form.title} onValueChange={v => handleChange("title", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["Mr.", "Mrs.", "Ms.", "Dr."].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-3">
                <Label className="text-xs">Guest Name <span className="text-destructive">*</span></Label>
                <Input className="h-8 text-xs" value={form.guestName} onChange={e => handleChange("guestName", e.target.value)} placeholder="Full name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">Mobile <span className="text-destructive">*</span></Label>
                <Input className="h-8 text-xs" value={form.mobile} onChange={e => handleChange("mobile", e.target.value)} placeholder="+91 9876543210" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Gender</Label>
                <Select value={form.gender} onValueChange={v => handleChange("gender", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">DOB</Label>
                <Input className="h-8 text-xs" type="date" value={form.dob} onChange={e => handleChange("dob", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">ID Proof Type</Label>
                <Select value={form.idProofType} onValueChange={v => handleChange("idProofType", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["Aadhaar Card", "Passport", "Driving License", "Voter ID"].map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">ID Number</Label>
                <Input className="h-8 text-xs" value={form.idProofNumber} onChange={e => handleChange("idProofNumber", e.target.value)} placeholder="ID number" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Guest Type</Label>
                <Input className="h-8 text-xs bg-muted" value="PAX" readOnly />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Payment Mode</Label>
                <Select value={form.paymentMode} onValueChange={v => handleChange("paymentMode", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["Cash", "Credit Card", "Debit Card", "UPI"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Advance Amount</Label>
                <Input className="h-8 text-xs" type="number" value={form.advanceAmount} onChange={e => handleChange("advanceAmount", e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Remarks</Label>
              <Textarea className="text-xs min-h-16" value={form.remark} onChange={e => handleChange("remark", e.target.value)} placeholder="Notes..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 justify-end">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleReset}><RotateCcw className="h-3.5 w-3.5" /> Reset</Button>
          <Button variant="outline" size="sm" className="gap-1.5"><X className="h-3.5 w-3.5" /> Close</Button>
          <Button size="sm" className="gap-1.5" onClick={handleSave}><Save className="h-3.5 w-3.5" /> Save (F2)</Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
