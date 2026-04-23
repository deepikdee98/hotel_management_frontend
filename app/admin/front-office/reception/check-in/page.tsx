"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Camera, Upload, UserCircle, Save, RotateCcw, X, FileText, Plus, Trash2, Loader2 } from "lucide-react"
import { createCheckIn, getFrontOfficeRooms, getSetupRatePlans } from "@/lib/backend-api"
import { useToast } from "@/hooks/use-toast"
import type { Room } from "@/lib/types"

function FormField({ label, required, children, className }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}

export default function CheckInPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>("guest-info")
  const [guestPhoto, setGuestPhoto] = useState<string | null>(null)
  const [selectedRoomType, setSelectedRoomType] = useState("")
  const [gstInclusive, setGstInclusive] = useState(false)
  const [companions, setCompanions] = useState<{ name: string; mobile: string; idType: string; idNumber: string }[]>([])

  const [rooms, setRooms] = useState<Room[]>([])
  const [ratePlans, setRatePlans] = useState<any[]>([])

  const tabOrder = ["guest-info", "guest-id", "companion", "vehicle-company"] as const;

  type TabType = typeof tabOrder[number];
  const currentTabIndex = tabOrder.indexOf(activeTab);

  const validateTab1 = () => form.guestName.trim() && form.mobile.trim() && form.roomNo.trim();
  const validateTab2 = () => form.idProofType.trim() && form.idProofNumber.trim();
  const validateTab3 = () => true; // Companions are optional
  const validateTab4 = () => true; // Last tab always valid

  const validateCurrentTab = () => {
    switch (activeTab) {
      case "guest-info": return validateTab1();
      case "guest-id": return validateTab2();
      case "companion": return validateTab3();
      case "vehicle-company": return validateTab4();
      default: return false;
    }
  };

  const getNextTab = () => {
    const nextIndex = currentTabIndex + 1;
    return nextIndex < tabOrder.length ? tabOrder[nextIndex] : activeTab;
  };

  const getPrevTab = () => {
    const prevIndex = currentTabIndex - 1;
    return prevIndex >= 0 ? tabOrder[prevIndex] : activeTab;
  };

  const handleNext = () => {
    if (validateCurrentTab()) {
      setActiveTab(getNextTab());
    } else {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields in current step",
        variant: "destructive",
      });
    }
  };

  const handlePrev = () => {
    setActiveTab(getPrevTab());
  };

  const [form, setForm] = useState({
    bookingNo: "BK-" + Date.now().toString().slice(-6),
    registerNo: "",
    title: "",
    guestName: "",
    mobile: "",
    email: "",
    dob: "",
    gender: "",
    address: "",
    country: "",
    state: "",
    city: "",
    zip: "",
    nationality: "",
    gstIn: "",
    referredBy: "",
    referredName: "",
    arrivalFrom: "",
    departureTo: "",
    purposeOfVisit: "",
    businessSource: "",
    marketSegment: "",
    company: "",
    voucherNo: "",
    checkInDate: new Date().toISOString().slice(0, 16),
    noOfNights: "0",
    checkoutPlan: "",
    guestClassification: "",
    roomNo: "",
    roomType: "",
    planType: "",
    planCharges: "",
    foodCharges: "",
    discount: "",
    guestType: "Individual",
    noOfBeds: "",
    paxAdultMale: "0",
    paxAdultFemale: "0",
    paxChildren: "0",
    paymentMode: "",
    advanceAmount: "",
    remark: "",
    idProofType: "",
    idProofNumber: "",
    ledgerAc: "",
    vehicleNo: "",
    vehicleType: "",
    // Company Info (Ledger) fields
    companyInfoCompanyName: "",
    companyInfoLedgerGroup: "",
    companyInfoPan: "",
    companyInfoGst: "",
    companyInfoBankAccountNo: "",
    companyInfoIfscCode: "",
    companyInfoCreditLimit: "",
    companyInfoBookingCategory: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsData, plansData] = await Promise.all([
          getFrontOfficeRooms({ status: "available" }),
          getSetupRatePlans()
        ])
        setRooms(roomsData)
        setRatePlans(plansData)
      } catch (error) {
        console.error("Failed to fetch data:", error)
      }
    }
    fetchData()
  }, [])

  const filteredRooms = selectedRoomType
    ? rooms.filter(r => r.type === selectedRoomType && r.status === "available")
    : rooms.filter(r => r.status === "available")

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (field === "roomType") setSelectedRoomType(value)
    if (field === "roomNo") {
      const room = rooms.find(r => r.number === value)
      if (room) {
        setForm(prev => ({
          ...prev,
          roomType: room.type,
          roomNo: value,
          planCharges: room.price.toString()
        }))
        setSelectedRoomType(room.type)
      }
    }
    if (field === "planType") {
      const plan = ratePlans.find(p => p._id === value || p.id === value || p.code === value)
      if (plan) {
        setForm(prev => ({ ...prev, planType: value }))
      }
    }
  }

  const handleReset = () => {
    setForm({
      bookingNo: "BK-" + Date.now().toString().slice(-6),
      registerNo: "", title: "", guestName: "", mobile: "", email: "", dob: "",
      gender: "", address: "", country: "", state: "", city: "", zip: "",
      nationality: "", gstIn: "", referredBy: "", referredName: "", arrivalFrom: "",
      departureTo: "", purposeOfVisit: "", businessSource: "", marketSegment: "",
      company: "", voucherNo: "", checkInDate: new Date().toISOString().slice(0, 16),
      noOfNights: "1", checkoutPlan: "", guestClassification: "", roomNo: "",
      roomType: "", planType: "", planCharges: "", foodCharges: "", discount: "",
      guestType: "Main", noOfBeds: "", paxAdultMale: "1", paxAdultFemale: "0",
      paxChildren: "", paymentMode: "", advanceAmount: "", remark: "",
      idProofType: "", idProofNumber: "", ledgerAc: "", vehicleNo: "", vehicleType: "",
      // Company Info (Ledger) fields
      companyInfoCompanyName: "", companyInfoLedgerGroup: "", companyInfoPan: "",
      companyInfoGst: "", companyInfoBankAccountNo: "", companyInfoIfscCode: "",
      companyInfoCreditLimit: "", companyInfoBookingCategory: "",
    })
    setGuestPhoto(null)
    setCompanions([])
    setActiveTab("guest-info")
  }

  const addCompanion = () => {
    setCompanions([...companions, { name: "", mobile: "", idType: "", idNumber: "" }])
  }

  const handleSave = async () => {
    // Final validation before submit
    if (!validateTab1() || !validateTab2()) {
      toast({
        title: "Missing Fields",
        description: "Please complete all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true)
    try {
      const payload = {
        ...form,
        mobileNo: form.mobile,
        roomNumber: form.roomNo,
        advanceAmount: Number(form.advanceAmount) || 0,
        nights: Number(form.noOfNights) || 1,
        gstInclusive,
        companions: companions.filter(c => c.name),
        // Company Info (Ledger)
        companyInfo: {
          companyName: form.companyInfoCompanyName,
          ledgerGroup: form.companyInfoLedgerGroup || null,
          pan: form.companyInfoPan,
          gst: form.companyInfoGst,
          bankAccountNo: form.companyInfoBankAccountNo,
          ifscCode: form.companyInfoIfscCode,
          creditLimit: Number(form.companyInfoCreditLimit) || 0,
          bookingCategory: form.companyInfoBookingCategory || null,
        }
      }

      await createCheckIn(payload)

      toast({
        title: "Success",
        description: "Guest checked-in successfully. Register No auto-generated.",
      })
      router.push("/admin/front-office/in-house")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete check-in",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Check-In</h1>
          <p className="text-sm text-muted-foreground">Register guest arrival and assign room</p>
        </div>
        <Badge variant="outline" className="text-xs">Booking: {form.bookingNo}</Badge>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabType)}
      >        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="guest-info" className={activeTab === "guest-info" ? "" : "data-[state=active]:shadow-none"}>
            Guest Info
          </TabsTrigger>
          <TabsTrigger value="guest-id" className={activeTab === "guest-id" ? "" : "data-[state=active]:shadow-none"} disabled={currentTabIndex < 1}>
            ID Proof
          </TabsTrigger>
          <TabsTrigger value="companion" className={activeTab === "companion" ? "" : "data-[state=active]:shadow-none"} disabled={currentTabIndex < 2}>
            Companions
          </TabsTrigger>
          <TabsTrigger value="vehicle-company" className={activeTab === "vehicle-company" ? "" : "data-[state=active]:shadow-none"} disabled={currentTabIndex < 3}>
            Vehicle/Co.
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Guest Room Info */}
        <TabsContent value="guest-info" className="space-y-4 mt-4">

          {/* Personal Details + Photo */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Personal Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6">
                {/* Photo */}
                <div className="flex flex-col items-center gap-3 flex-shrink-0">
                  <div className="h-28 w-28 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted overflow-hidden">
                    {guestPhoto ? (
                      <img src={guestPhoto} alt="Guest" className="h-full w-full object-cover" />
                    ) : (
                      <UserCircle className="h-12 w-12 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1 text-xs h-7 px-2">
                      <Upload className="h-3 w-3" /> Upload
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1 text-xs h-7 px-2">
                      <Camera className="h-3 w-3" /> Webcam
                    </Button>
                  </div>
                </div>

                {/* Fields */}
                <div className="flex-1 space-y-4">
                  {/* Row 1: Title + Name */}
                  <div className="grid grid-cols-4 gap-4">
                    <FormField label="Title" required>
                      <Select value={form.title} onValueChange={v => handleChange("title", v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {["Mr", "Mrs", "Ms", "Dr", "Prof"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="Guest Name" required className="col-span-3">
                      <Input value={form.guestName} onChange={e => handleChange("guestName", e.target.value)} placeholder="Full name" />
                    </FormField>
                  </div>

                  {/* Row 2: Mobile, Email, DOB */}
                  <div className="grid grid-cols-3 gap-4">
                    <FormField label="Mobile No" required>
                      <Input value={form.mobile} onChange={e => handleChange("mobile", e.target.value)} placeholder="+91 9876543210" />
                    </FormField>
                    <FormField label="Email">
                      <Input type="email" value={form.email} onChange={e => handleChange("email", e.target.value)} placeholder="guest@email.com" />
                    </FormField>
                    <FormField label="Date of Birth">
                      <Input type="date" value={form.dob} onChange={e => handleChange("dob", e.target.value)} />
                    </FormField>
                  </div>

                  {/* Row 3: Gender, Nationality, GST IN, Register No */}
                  <div className="grid grid-cols-4 gap-4">
                    <FormField label="Gender">
                      <Select value={form.gender} onValueChange={v => handleChange("gender", v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="Nationality">
                      <Select value={form.nationality} onValueChange={v => handleChange("nationality", v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {["Indian", "Foreign", "American", "British", "Chinese", "French", "German", "Russian", "Other"].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="GST IN">
                      <Input value={form.gstIn} onChange={e => handleChange("gstIn", e.target.value)} placeholder="GST Number" />
                    </FormField>
                    <FormField label="Register No">
                      <Input value={form.registerNo} onChange={e => handleChange("registerNo", e.target.value)} placeholder="Auto-generated" readOnly className="bg-muted" />
                    </FormField>
                  </div>

                  {/* Row 4: Address */}
                  <div className="grid grid-cols-4 gap-4">
                    <FormField label="Address" className="col-span-2">
                      <Input value={form.address} onChange={e => handleChange("address", e.target.value)} placeholder="Street address" />
                    </FormField>
                    <FormField label="Country">
                      <Select value={form.country} onValueChange={v => handleChange("country", v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {["India", "USA", "UK", "Canada", "Australia"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="State">
                      <Input value={form.state} onChange={e => handleChange("state", e.target.value)} placeholder="State" />
                    </FormField>
                  </div>

                  {/* Row 5: City, ZIP */}
                  <div className="grid grid-cols-4 gap-4">
                    <FormField label="City">
                      <Input value={form.city} onChange={e => handleChange("city", e.target.value)} placeholder="City" />
                    </FormField>
                    <FormField label="ZIP">
                      <Input value={form.zip} onChange={e => handleChange("zip", e.target.value)} placeholder="ZIP Code" />
                    </FormField>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <FormField label="Referred By">
                  <Select value={form.referredBy} onValueChange={v => handleChange("referredBy", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Online", "Travel Agent", "Corporate", "Walk-in", "Other"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Referred Name">
                  <Input value={form.referredName} onChange={e => handleChange("referredName", e.target.value)} placeholder="Name / Company" />
                </FormField>
                <FormField label="Arrival From">
                  <Input value={form.arrivalFrom} onChange={e => handleChange("arrivalFrom", e.target.value)} placeholder="City / Airport" />
                </FormField>
                <FormField label="Departure To">
                  <Input value={form.departureTo} onChange={e => handleChange("departureTo", e.target.value)} placeholder="City / Airport" />
                </FormField>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <FormField label="Purpose of Visit">
                  <Select value={form.purposeOfVisit} onValueChange={v => handleChange("purposeOfVisit", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Business", "Leisure", "Conference", "Wedding", "Medical", "Other"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Business Source">
                  <Select value={form.businessSource} onValueChange={v => handleChange("businessSource", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Direct", "OTA", "Corporate", "Government", "Walk-in"].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Market Segment">
                  <Select value={form.marketSegment} onValueChange={v => handleChange("marketSegment", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Domestic", "International", "Group", "Individual"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Company">
                  <Input value={form.company} onChange={e => handleChange("company", e.target.value)} placeholder="Company name" />
                </FormField>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <FormField label="Voucher No">
                  <Input value={form.voucherNo} onChange={e => handleChange("voucherNo", e.target.value)} placeholder="Voucher" />
                </FormField>
                <FormField label="Check-In Date & Time">
                  <Input type="datetime-local" value={form.checkInDate} onChange={e => handleChange("checkInDate", e.target.value)} />
                </FormField>
                <FormField label="No of Nights">
                  <Input type="number" min="1" value={form.noOfNights} onChange={e => handleChange("noOfNights", e.target.value)} />
                </FormField>
                <FormField label="Checkout Plan">
                  <Select value={form.checkoutPlan} onValueChange={v => handleChange("checkoutPlan", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["24 Noon", "12 Noon", "Flexible", "6AM", "10AM"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <FormField label="Guest Classification">
                  <Select value={form.guestClassification} onValueChange={v => handleChange("guestClassification", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["VIP", "Regular", "Corporate", "Government", "Loyalty Member"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </CardContent>
          </Card>

          {/* Room & Plan Assignment */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Room & Plan Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <FormField label="Room Type" required>
                  <Select value={form.roomType} onValueChange={v => handleChange("roomType", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {Array.from(new Set(rooms.map(r => r.type))).map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Room No" required>
                  <Select value={form.roomNo} onValueChange={v => handleChange("roomNo", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {filteredRooms.map(r => (
                        <SelectItem key={r.id} value={r.number}>
                          {r.number} - {r.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Plan Type">
                  <Select value={form.planType} onValueChange={v => handleChange("planType", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {ratePlans.map(p => (
                        <SelectItem key={p._id || p.id || p.code} value={p._id || p.id || p.code}>
                          {p.name} ({p.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Plan Charges">
                  <Input type="number" value={form.planCharges} onChange={e => handleChange("planCharges", e.target.value)} placeholder="0.00" />
                </FormField>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <FormField label="Food Charges">
                  <Input type="number" value={form.foodCharges} onChange={e => handleChange("foodCharges", e.target.value)} placeholder="0.00" />
                </FormField>
                <FormField label="Discount %">
                  <Input type="number" value={form.discount} onChange={e => handleChange("discount", e.target.value)} placeholder="0" />
                </FormField>
                <FormField label="Guest Type">
                  <Select value={form.guestType} onValueChange={v => handleChange("guestType", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Individual", "Company", "Travel Agent", "PAX"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="No of Beds">
                  <Input type="number" min="1" value={form.noOfBeds} onChange={e => handleChange("noOfBeds", e.target.value)} placeholder="0" />
                </FormField>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <FormField label="Adult Male (PAX)">
                  <Input type="number" min="0" value={form.paxAdultMale} onChange={e => handleChange("paxAdultMale", e.target.value)} />
                </FormField>
                <FormField label="Adult Female (PAX)">
                  <Input type="number" min="0" value={form.paxAdultFemale} onChange={e => handleChange("paxAdultFemale", e.target.value)} />
                </FormField>
                <FormField label="Children (PAX)">
                  <Input type="number" min="0" value={form.paxChildren} onChange={e => handleChange("paxChildren", e.target.value)} />
                </FormField>
                <div className="flex items-end pb-2">
                  <div className="flex items-center gap-2">
                    <Checkbox id="gst-inc" checked={gstInclusive} onCheckedChange={(v) => setGstInclusive(!!v)} />
                    <Label htmlFor="gst-inc" className="text-sm">GST Inclusive</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment & Remarks */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Payment & Remarks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <FormField label="Mode of Payment">
                  <Select value={form.paymentMode} onValueChange={v => handleChange("paymentMode", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Cash", "Card", "UPI", "Online"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Advance Amount">
                  <Input type="number" value={form.advanceAmount} onChange={e => handleChange("advanceAmount", e.target.value)} placeholder="0.00" />
                </FormField>
                <FormField label="Ledger A/C">
                  <Select value={form.ledgerAc} onValueChange={v => handleChange("ledgerAc", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["HDFC Hotel Account", "SBI Hotel Account", "ICICI Hotel Account", "Cash Account", "Other"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
              <FormField label="Remarks">
                <Textarea className="min-h-20" value={form.remark} onChange={e => handleChange("remark", e.target.value)} placeholder="Special requests or notes..." />
              </FormField>
            </CardContent>
          </Card>

          {/* Action Buttons - Dynamic for multi-step */}
          <div className="flex items-center gap-3 justify-end pb-4">
            <Button variant="outline" className="gap-2" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" /> Reset Form
            </Button>
            {currentTabIndex > 0 && (
              <Button variant="outline" className="gap-2" onClick={handlePrev}>
                ← Previous
              </Button>
            )}
            {currentTabIndex < 4 ? (
              <Button className="gap-2" onClick={handleNext} disabled={!validateCurrentTab() || isLoading}>
                Next →
              </Button>
            ) : (
              <Button className="gap-2" onClick={handleSave} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Submit Check-In
              </Button>
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Guest ID */}
        <TabsContent value="guest-id" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">ID Proof Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField label="ID Proof Type" required>
                  <Select value={form.idProofType} onValueChange={v => handleChange("idProofType", v)}>
                    <SelectTrigger><SelectValue placeholder="Select ID type" /></SelectTrigger>
                    <SelectContent>
                      {["Aadhaar Card", "Passport", "Driving License", "Voter ID", "PAN Card"].map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="ID Proof Number" required>
                  <Input value={form.idProofNumber} onChange={e => handleChange("idProofNumber", e.target.value)} placeholder="Enter ID number" />
                </FormField>
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-2 block">Scan / Upload ID Image</Label>
                <div className="flex gap-3">
                  <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" /> Upload Front
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" /> Upload Back
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Camera className="h-4 w-4" /> Scan
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="h-40 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted text-sm text-muted-foreground">
                    ID Front
                  </div>
                  <div className="h-40 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted text-sm text-muted-foreground">
                    ID Back
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Dynamic buttons for all tabs */}
          <div className="flex items-center gap-3 justify-end pb-4">
            <Button variant="outline" className="gap-2" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" /> Reset Form
            </Button>
            {currentTabIndex > 0 && (
              <Button variant="outline" className="gap-2" onClick={handlePrev}>
                ← Previous
              </Button>
            )}
            {currentTabIndex < 4 ? (
              <Button className="gap-2" onClick={handleNext} disabled={!validateCurrentTab() || isLoading}>
                Next →
              </Button>
            ) : (
              <Button className="gap-2" onClick={handleSave} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Submit Check-In
              </Button>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Companion Guest */}
        <TabsContent value="companion" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Companion Guests</CardTitle>
              <Button variant="outline" className="gap-2" onClick={addCompanion}>
                <Plus className="h-4 w-4" /> Add Companion
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {companions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No companion guests added. Click &quot;Add Companion&quot; to register additional guests staying in the same room.
                </p>
              )}
              {companions.map((comp, i) => (
                <div key={i} className="rounded-lg border border-border p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Companion {i + 1}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCompanions(companions.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <FormField label="Name" required>
                      <Input value={comp.name} onChange={e => {
                        const updated = [...companions]; updated[i].name = e.target.value; setCompanions(updated)
                      }} placeholder="Full name" />
                    </FormField>
                    <FormField label="Mobile">
                      <Input value={comp.mobile} onChange={e => {
                        const updated = [...companions]; updated[i].mobile = e.target.value; setCompanions(updated)
                      }} placeholder="Mobile number" />
                    </FormField>
                    <FormField label="ID Type">
                      <Select value={comp.idType} onValueChange={v => {
                        const updated = [...companions]; updated[i].idType = v; setCompanions(updated)
                      }}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {["Aadhaar Card", "Passport", "Driving License", "Voter ID"].map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="ID Number">
                      <Input value={comp.idNumber} onChange={e => {
                        const updated = [...companions]; updated[i].idNumber = e.target.value; setCompanions(updated)
                      }} placeholder="ID number" />
                    </FormField>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          {/* Dynamic buttons for all tabs */}
          <div className="flex items-center gap-3 justify-end pb-4">
            <Button variant="outline" className="gap-2" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" /> Reset Form
            </Button>
            {currentTabIndex > 0 && (
              <Button variant="outline" className="gap-2" onClick={handlePrev}>
                ← Previous
              </Button>
            )}
            {currentTabIndex < 3 ? (
              <Button className="gap-2" onClick={handleNext} disabled={!validateCurrentTab() || isLoading}>
                Next →
              </Button>
            ) : (
              <Button className="gap-2" onClick={handleSave} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Submit Check-In
              </Button>
            )}
          </div>
        </TabsContent>

        {/* Tab 4: Vehicle / Company */}
        <TabsContent value="vehicle-company" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Vehicle Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Vehicle Number">
                    <Input value={form.vehicleNo} onChange={e => handleChange("vehicleNo", e.target.value)} placeholder="e.g. KA-01-AB-1234" />
                  </FormField>
                  <FormField label="Vehicle Type">
                    <Select value={form.vehicleType} onValueChange={v => handleChange("vehicleType", v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {["Car", "Bike", "SUV", "Van", "Bus", "Other"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Company Info (Ledger)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Company Name">
                    <Input value={form.companyInfoCompanyName} onChange={e => handleChange("companyInfoCompanyName", e.target.value)} placeholder="Company name" />
                  </FormField>
                  <FormField label="Ledger Group">
                    <Select value={form.companyInfoLedgerGroup} onValueChange={v => handleChange("companyInfoLedgerGroup", v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {["B.T.C. Ledger", "Cash Ledger", "Bank Ledger", "Sundry Debtors", "Other"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="PAN">
                    <Input value={form.companyInfoPan} onChange={e => handleChange("companyInfoPan", e.target.value)} placeholder="PAN number" />
                  </FormField>
                  <FormField label="GST">
                    <Input value={form.companyInfoGst} onChange={e => handleChange("companyInfoGst", e.target.value)} placeholder="GST number" />
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Bank A/C No">
                    <Input value={form.companyInfoBankAccountNo} onChange={e => handleChange("companyInfoBankAccountNo", e.target.value)} placeholder="Account number" />
                  </FormField>
                  <FormField label="IFSC Code">
                    <Input value={form.companyInfoIfscCode} onChange={e => handleChange("companyInfoIfscCode", e.target.value)} placeholder="IFSC Code" />
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Credit Limit">
                    <Input type="number" value={form.companyInfoCreditLimit} onChange={e => handleChange("companyInfoCreditLimit", e.target.value)} placeholder="0.00" />
                  </FormField>
                  <FormField label="Booking Category">
                    <Select value={form.companyInfoBookingCategory} onValueChange={v => handleChange("companyInfoBookingCategory", v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {["Corporate", "Group", "Regular", "Government", "Other"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex items-center gap-3 justify-end pb-4">
            <Button variant="outline" className="gap-2" onClick={handleReset}><RotateCcw className="h-4 w-4" /> Reset</Button>
            <Button className="gap-2" onClick={handleSave} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
