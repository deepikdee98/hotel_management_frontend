"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Plus, Search, Edit, X, CheckCircle, Clock, User, Phone, Mail, CreditCard, Bed } from "lucide-react"
import { createFrontOfficeReservation, getFrontOfficeReservations, getFrontOfficeRooms, getSetupRoomTypes, getSetupRatePlans, updateFrontOfficeReservationStatus, updateFrontOfficeReservation } from "@/lib/backend-api"
import type { Reservation, Room, RoomType } from "@/lib/types"
import EditDetailsModal from "@/components/common/EditDetailsModal"

export default function ReservationPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)

  useEffect(() => {
    if (isNewReservationOpen) {
      setFormData(prev => ({ ...prev, adults: "", children: "", ratePlan: "" }));
    }
  }, [isNewReservationOpen]);

  const [reservations, setReservations] = useState<any[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomTypes, setRoomTypes] = useState<any[]>([])
  const [ratePlans, setRatePlans] = useState<any[]>([])
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editData, setEditData] = useState<any>({})

  useEffect(() => {
    const load = async () => {
      try {
        const [reservationData, roomData, roomTypeData, ratePlanData] = await Promise.all([
          getFrontOfficeReservations(),
          getFrontOfficeRooms(),
          getSetupRoomTypes(),
          getSetupRatePlans(),
        ])
        const formatted = reservationData.map((r: Reservation) => ({
          id: r.id,
          reservationId: r.reservationId,
          guestName: r.guestName,
          guestPhone: r.guestPhone,
          guestEmail: r.guestEmail,
          roomNumber: r.roomNumber,
          checkIn: r.checkIn,
          checkOut: r.checkOut,
          totalAmount: r.totalAmount,
          paidAmount: r.paidAmount,
          status: r.status,
        }))

        setReservations(formatted)
        setRooms(roomData)
        setRoomTypes(roomTypeData)
        setRatePlans(ratePlanData)
      } catch {
        setReservations([])
        setRooms([])
        setRoomTypes([])
        setRatePlans([])
      }
    }

    load()
  }, [])

  // Form state for new reservation
  const [formData, setFormData] = useState({
    guestName: "",
    phone: "",
    email: "",
    idProofType: "",
    idProofNumber: "",
    checkInDate: "",
    checkOutDate: "",
    adults: "",
    children: "",
    roomType: "",
    roomNumber: "",
    ratePlan: "",
    bookingSource: "",
    advanceAmount: "",
    paymentMode: "",
    specialRequests: "",
  })

  type TabType = "guest" | "booking" | "payment";
  const [activeTab, setActiveTab] = useState<TabType>("guest");
  const tabOrder = ["guest", "booking", "payment"] as const;
  const currentTabIndex = tabOrder.indexOf(activeTab);

  const validateGuestTab = () => formData.guestName.trim() && formData.phone.trim();
  const validateBookingTab = () => formData.checkInDate && formData.checkOutDate && formData.roomNumber !== "";
  const validatePaymentTab = () => true;

  const validateCurrentTab = () => {
    switch (activeTab) {
      case "guest": return validateGuestTab();
      case "booking": return validateBookingTab();
      case "payment": return validatePaymentTab();
      default: return false;
    }
  };

  const handleNextTab = () => {
    if (validateCurrentTab()) {
      const nextIndex = Math.min(currentTabIndex + 1, tabOrder.length - 1);
      setActiveTab(tabOrder[nextIndex]);
    } else {
      toast({
        title: "Validation Error",
        description: "Please fill required fields before continuing",
        variant: "destructive",
      });
    }
  };

  const handlePrevTab = () => {
    const prevIndex = Math.max(currentTabIndex - 1, 0);
    setActiveTab(tabOrder[prevIndex]);
  };

  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (reservation.reservationId || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Confirmed</Badge>
      case "checked-in":
        return <Badge className="bg-success/10 text-success border-success/20">Checked In</Badge>
      case "checked-out":
        return <Badge className="bg-muted text-muted-foreground border-muted">Checked Out</Badge>
      case "cancelled":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const availableRooms = rooms.filter((room) => room.status === "available")
  console.log("Available rooms with IDs:", availableRooms.map(r => ({ number: r.number, typeId: r.roomTypeId, type: r.type })));
  console.log("Selected room type ID:", formData.roomType);

  const calculateEstimates = () => {
    if (!formData.checkInDate || !formData.checkOutDate) return { roomCharges: 0, taxes: 0, total: 0 }

    const checkIn = new Date(formData.checkInDate)
    const checkOut = new Date(formData.checkOutDate)
    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)))

    let baseRate = 0
    const selectedRoomType = roomTypes.find(t => (t._id || t.id) === formData.roomType)
    if (selectedRoomType) {
      baseRate = selectedRoomType.baseRate || selectedRoomType.price || 0
    }

    // Apply rate plan logic if applicable
    const selectedRatePlan = ratePlans.find(p => (p._id || p.id) === formData.ratePlan)
    let rateModifier = 1
    if (selectedRatePlan) {
      if (selectedRatePlan.type === "percentage") {
        rateModifier = 1 + (selectedRatePlan.value / 100)
      } else if (selectedRatePlan.type === "fixed") {
        baseRate = selectedRatePlan.value
      }
    }

    const roomCharges = nights * baseRate * rateModifier
    const taxes = roomCharges * 0.12 // 12% tax
    const total = roomCharges + taxes

    return { roomCharges, taxes, total }
  }

  const estimates = calculateEstimates()

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveReservation = async () => {
    try {
      let selectedRoomId = ""

      if (formData.roomNumber === "auto") {
        const autoRoom = availableRooms.find(r => r.roomTypeId === formData.roomType)
        if (autoRoom) {
          selectedRoomId = autoRoom.id
        } else {
          const roomTypeObj = roomTypes.find(t => (t._id || t.id) === formData.roomType)
          toast({
            title: "No Rooms Available",
            description: `No available rooms found for type: ${roomTypeObj?.name || formData.roomType}`,
            variant: "destructive",
          })
          return
        }
      } else {
        const manualRoom = rooms.find((room) => room.number === formData.roomNumber)
        if (manualRoom) {
          selectedRoomId = manualRoom.id
        }
      }

      if (selectedRoomId) {
        await createFrontOfficeReservation({
          guestName: formData.guestName,
          phone: formData.phone,
          email: formData.email,
          idProofType: formData.idProofType,
          idProofNumber: formData.idProofNumber,
          checkInDate: formData.checkInDate,
          checkOutDate: formData.checkOutDate,
          adults: Number(formData.adults),
          children: Number(formData.children),
          roomType: formData.roomType,
          room: selectedRoomId,
          ratePlan: formData.ratePlan,
          bookingSource: formData.bookingSource,
          advanceAmount: Number(formData.advanceAmount || 0),
          paymentMode: formData.paymentMode,
          totalAmount: estimates.total,
        })

        const refreshed = await getFrontOfficeReservations()
        const formatted = refreshed.map((r: Reservation) => ({
          id: r.id,
          reservationId: r.reservationId,
          guestName: r.guestName,
          guestPhone: r.guestPhone,
          guestEmail: r.guestEmail,
          roomNumber: r.roomNumber,
          checkIn: r.checkIn,
          checkOut: r.checkOut,
          totalAmount: r.totalAmount,
          paidAmount: r.paidAmount,
          status: r.status,
        }))

        setReservations(formatted)

        toast({
          title: "Success",
          description: "Reservation created successfully",
        })

        setIsNewReservationOpen(false)
        setFormData({
          guestName: "",
          phone: "",
          email: "",
          idProofType: "",
          idProofNumber: "",
          checkInDate: "",
          checkOutDate: "",
          adults: "",
          children: "",
          roomType: "",
          roomNumber: "",
          ratePlan: "",
          bookingSource: "",
          advanceAmount: "",
          paymentMode: "",
          specialRequests: "",
        })
      } else {
        toast({
          title: "Selection Error",
          description: "Please select a room or use auto-assign",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: error.message || "An error occurred while creating the reservation",
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = async (id: string, newStatus: Reservation["status"]) => {
    try {
      const reservation = reservations.find(r => String(r.id) === String(id))
      if (newStatus === "checked-out") {
        if (reservation && reservation.paidAmount < reservation.totalAmount) {
          alert("Please clear pending payment before checkout")
          return
        }
      }
      await updateFrontOfficeReservationStatus(id, newStatus)
      const refreshed = await getFrontOfficeReservations()
      setReservations(refreshed)
      alert(`Reservation ${newStatus} successfully`)

    } catch (error) {
      console.error("Status update failed:", error)
    }
  }

  const handleDeleteReservation = async (id: string) => {
    try {
      const confirmDelete = confirm("Are you sure you want to cancel this reservation?")
      if (!confirmDelete) return

      await updateFrontOfficeReservationStatus(id, "cancelled")

      const refreshed = await getFrontOfficeReservations()
      setReservations(refreshed)

      alert("Reservation cancelled successfully")

    } catch (error) {
      console.error("Delete failed:", error)
    }
  }

  const handleUpdateReservation = async () => {
    try {
      if (!editData?.id) return

      // Map back to backend field names
      const payload = {
        guestName: editData.guestName,
        phone: editData.guestPhone,
        email: editData.guestEmail,
        roomNumber: editData.roomNumber,
        checkInDate: editData.checkIn,
        checkOutDate: editData.checkOut,
        totalAmount: editData.totalAmount,
        advanceAmount: editData.paidAmount,
      }

      await updateFrontOfficeReservation(editData.id, payload)

      const refreshed = await getFrontOfficeReservations()
      const formatted = refreshed.map((r: Reservation) => ({
        id: r.id,
        reservationId: r.id,
        guestName: r.guestName,
        guestPhone: r.guestPhone,
        guestEmail: r.guestEmail,
        roomNumber: r.roomNumber,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        totalAmount: r.totalAmount,
        paidAmount: r.paidAmount,
        status: r.status,
      }))

      setReservations(formatted)
      setIsEditOpen(false)

      toast({
        title: "Success",
        description: "Reservation updated successfully",
      })
    } catch (error: any) {
      console.error("Update failed:", error)
      toast({
        title: "Update Failed",
        description: error.message || "An error occurred while updating the reservation",
        variant: "destructive",
      })
    }
  }

  const editFields = [
    { name: "guestName", label: "Guest Name" },
    { name: "guestPhone", label: "Phone" },
    { name: "guestEmail", label: "Email" },
    { name: "roomNumber", label: "Room Number" },
    { name: "checkIn", label: "Check-in", type: "date" },
    { name: "checkOut", label: "Check-out", type: "date" },
  ]

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reservations</h1>
            <p className="text-muted-foreground">Create and manage hotel bookings</p>
          </div>
          <Dialog open={isNewReservationOpen} onOpenChange={setIsNewReservationOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Reservation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Reservation</DialogTitle>
                <DialogDescription>Fill in the guest and booking details</DialogDescription>
              </DialogHeader>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="guest" className={activeTab === "guest" ? "" : "data-[state=active]:shadow-none"}>
                    Guest
                  </TabsTrigger>
                  <TabsTrigger value="booking" className={activeTab === "booking" ? "" : "data-[state=active]:shadow-none"} disabled={currentTabIndex < 1}>
                    Booking
                  </TabsTrigger>
                  <TabsTrigger value="payment" className={activeTab === "payment" ? "" : "data-[state=active]:shadow-none"} disabled={currentTabIndex < 2}>
                    Payment
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="guest" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="guestName">Guest Name *</Label>
                      <Input
                        id="guestName"
                        placeholder="Full name"
                        value={formData.guestName}
                        onChange={(e) => handleFormChange("guestName", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        placeholder="+1 234 567 8900"
                        value={formData.phone}
                        onChange={(e) => handleFormChange("phone", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="guest@email.com"
                        value={formData.email}
                        onChange={(e) => handleFormChange("email", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="idProofType">ID Proof Type *</Label>
                      <Select
                        value={formData.idProofType}
                        onValueChange={(v) => handleFormChange("idProofType", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select ID type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
                          <SelectItem value="passport">Passport</SelectItem>
                          <SelectItem value="driving-license">Driving License</SelectItem>
                          <SelectItem value="other">Other ID</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="idProofNumber">ID Proof Number *</Label>
                      <Input
                        id="idProofNumber"
                        placeholder="Enter ID number"
                        value={formData.idProofNumber}
                        onChange={(e) => handleFormChange("idProofNumber", e.target.value)}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="booking" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="checkInDate">Check-in Date *</Label>
                      <Input
                        id="checkInDate"
                        type="date"
                        value={formData.checkInDate}
                        onChange={(e) => handleFormChange("checkInDate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="checkOutDate">Check-out Date *</Label>
                      <Input
                        id="checkOutDate"
                        type="date"
                        value={formData.checkOutDate}
                        onChange={(e) => handleFormChange("checkOutDate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adults">Number of Adults</Label>
                      <Select value={formData.adults || undefined} onValueChange={(v) => handleFormChange("adults", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select adults" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <SelectItem key={n} value={n.toString()}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="children">Number of Children</Label>
                      <Select value={formData.children || undefined} onValueChange={(v) => handleFormChange("children", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select children" />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 1, 2, 3, 4].map((n) => (
                            <SelectItem key={n} value={n.toString()}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="roomType">Room Type *</Label>
                      <Select
                        value={formData.roomType || undefined}
                        onValueChange={(v) => handleFormChange("roomType", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select room type" />
                        </SelectTrigger>
                        <SelectContent>
                          {roomTypes.map((type) => (
                            <SelectItem key={type._id || type.id} value={type._id || type.id}>
                              {type.name} - ${type.baseRate || type.price || 0}/night
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="roomNumber">Room Number</Label>
                      <Select
                        value={formData.roomNumber || undefined}
                        onValueChange={(v) => handleFormChange("roomNumber", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Auto-assign or select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto-assign</SelectItem>
                          {availableRooms
                            .filter((room) => !formData.roomType || room.roomTypeId === formData.roomType)
                            .map((room) => (
                              <SelectItem key={room.id} value={room.number}>
                                {room.number} - {room.type}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ratePlan">Rate Plan</Label>
                      <Select value={formData.ratePlan || undefined} onValueChange={(v) => handleFormChange("ratePlan", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select rate plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {ratePlans.map((plan) => (
                            <SelectItem key={plan._id || plan.id} value={plan._id || plan.id}>
                              {plan.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bookingSource">Booking Source</Label>
                      <Select value={formData.bookingSource || undefined} onValueChange={(v) => handleFormChange("bookingSource", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="walk-in">Walk-in</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="ota">OTA (Booking.com, etc.)</SelectItem>
                          <SelectItem value="agent">Travel Agent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="specialRequests">Special Requests</Label>
                      <Textarea
                        id="specialRequests"
                        placeholder="Any special requests or notes..."
                        value={formData.specialRequests}
                        onChange={(e) => handleFormChange("specialRequests", e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="payment" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="advanceAmount">Advance Amount</Label>
                      <Input
                        id="advanceAmount"
                        type="number"
                        placeholder="0.00"
                        value={formData.advanceAmount}
                        onChange={(e) => handleFormChange("advanceAmount", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentMode">Payment Mode</Label>
                      <Select value={formData.paymentMode || undefined} onValueChange={(v) => handleFormChange("paymentMode", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Credit/Debit Card</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Card className="bg-secondary/50">
                    <CardContent className="pt-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Room Charges (estimated)</span>
                          <span>${estimates.roomCharges.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Taxes (12%)</span>
                          <span>${estimates.taxes.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-medium border-t border-border pt-2 mt-2">
                          <span>Total Estimated</span>
                          <span>${estimates.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-success">
                          <span>Advance Paid</span>
                          <span>-${Number(formData.advanceAmount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t border-border pt-2 mt-2 text-lg">
                          <span>Total Payable</span>
                          <span>${(estimates.total - Number(formData.advanceAmount || 0)).toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setIsNewReservationOpen(false)}>
                  Cancel
                </Button>
                <Button variant="outline" onClick={handlePrevTab} className="gap-2" disabled={currentTabIndex === 0}>
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>
                {currentTabIndex < 2 ? (
                  <Button onClick={handleNextTab} disabled={!validateCurrentTab()} className="gap-2">
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSaveReservation} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Reservation
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by guest name, room, or reservation ID..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="checked-in">Checked In</SelectItem>
                  <SelectItem value="checked-out">Checked Out</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reservations Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Reservations</CardTitle>
            <CardDescription>{filteredReservations.length} reservations found</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reservation ID</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell className="font-medium">{reservation.registerNo || reservation.reservationId || "N/A"}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{reservation.guestName}</p>
                        <p className="text-sm text-muted-foreground">{reservation.guestPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell>{reservation.roomNumber}</TableCell>
                    <TableCell>{reservation.checkIn}</TableCell>
                    <TableCell>{reservation.checkOut}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">${reservation.totalAmount}</p>
                        <p className="text-xs text-muted-foreground">Paid: ${reservation.paidAmount}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {reservation.status === "confirmed" && (
                          <Button size="sm" variant="outline" onClick={() => handleStatusChange(reservation.id, "checked-in")} className="gap-1 bg-transparent">
                            <CheckCircle className="h-3 w-3" />
                            Check In
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => {
                          setEditData(reservation)
                          setIsEditOpen(true)
                        }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {reservation.status === "confirmed" && (
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteReservation(reservation.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <EditDetailsModal
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          title="Edit Reservation"
          formData={editData}
          setFormData={setEditData}
          fields={editFields}
          onSubmit={handleUpdateReservation}
        />
      </div>
    </DashboardLayout>
  )
}
