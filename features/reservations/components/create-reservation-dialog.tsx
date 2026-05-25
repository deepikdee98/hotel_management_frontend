"use client"

import { memo } from "react"
import type { ReactNode } from "react"
import { ArrowLeft, ArrowRight, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { Room } from "@/lib/types"

type ReservationTab = "guest" | "booking" | "payment"
type SetupOptions = { data: Array<{ _id: string; value: string }>; loading: boolean }
type ReservationFormData = {
  guestName: string
  phone: string
  email: string
  idProofType: string
  idProofNumber: string
  checkInDate: string
  checkOutDate: string
  adults: string
  children: string
  roomType: string
  roomNumber: string
  ratePlan: string
  bookingSource: string
  advanceAmount: string
  paymentMode: string
  specialRequests: string
}

interface CreateReservationDialogProps {
  open: boolean
  bookingPreview: string
  activeTab: ReservationTab
  currentTabIndex: number
  formData: ReservationFormData
  idProofOptions: SetupOptions
  businessSourceOptions: SetupOptions
  paymentModeOptions: SetupOptions
  roomTypes: any[]
  ratePlans: any[]
  availableRooms: Room[]
  estimates: { roomCharges: number; taxes: number; total: number }
  onOpenChange: (open: boolean) => void
  onTabChange: (tab: ReservationTab) => void
  onFormChange: (field: keyof ReservationFormData, value: string) => void
  onPrevious: () => void
  onNext: () => void
  onSave: () => void
  canContinue: boolean
  renderSetupItems: (options: SetupOptions) => ReactNode
}

export const CreateReservationDialog = memo(function CreateReservationDialog({
  open,
  bookingPreview,
  activeTab,
  currentTabIndex,
  formData,
  idProofOptions,
  businessSourceOptions,
  paymentModeOptions,
  roomTypes,
  ratePlans,
  availableRooms,
  estimates,
  onOpenChange,
  onTabChange,
  onFormChange,
  onPrevious,
  onNext,
  onSave,
  canContinue,
  renderSetupItems,
}: CreateReservationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Reservation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <DialogTitle>Create New Reservation</DialogTitle>
            <Badge variant="outline" className="w-fit text-xs font-semibold">Booking ID: {bookingPreview}</Badge>
          </div>
          <DialogDescription>Fill in the guest and booking details</DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as ReservationTab)} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="guest">Guest</TabsTrigger>
            <TabsTrigger value="booking" disabled={currentTabIndex < 1}>Booking</TabsTrigger>
            <TabsTrigger value="payment" disabled={currentTabIndex < 2}>Payment</TabsTrigger>
          </TabsList>

          <TabsContent value="guest" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guestName">Guest Name *</Label>
                <Input id="guestName" placeholder="Full name" value={formData.guestName} onChange={(event) => onFormChange("guestName", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" placeholder="+1 234 567 8900" value={formData.phone} onChange={(event) => onFormChange("phone", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="guest@email.com" value={formData.email} onChange={(event) => onFormChange("email", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="idProofType">ID Proof Type *</Label>
                <Select value={formData.idProofType} onValueChange={(value) => onFormChange("idProofType", value)}>
                  <SelectTrigger><SelectValue placeholder="Select ID type" /></SelectTrigger>
                  <SelectContent>{renderSetupItems(idProofOptions)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="idProofNumber">ID Proof Number *</Label>
                <Input id="idProofNumber" placeholder="Enter ID number" value={formData.idProofNumber} onChange={(event) => onFormChange("idProofNumber", event.target.value)} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="booking" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkInDate">Check-in Date *</Label>
                <Input id="checkInDate" type="date" value={formData.checkInDate} onChange={(event) => onFormChange("checkInDate", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOutDate">Check-out Date *</Label>
                <Input id="checkOutDate" type="date" value={formData.checkOutDate} onChange={(event) => onFormChange("checkOutDate", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adults">Number of Adults</Label>
                <Input id="adults" type="number" min="1" value={formData.adults} onChange={(event) => onFormChange("adults", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="children">Number of Children</Label>
                <Input id="children" type="number" min="0" value={formData.children} onChange={(event) => onFormChange("children", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roomType">Room Type *</Label>
                <Select value={formData.roomType || undefined} onValueChange={(value) => onFormChange("roomType", value)}>
                  <SelectTrigger><SelectValue placeholder="Select room type" /></SelectTrigger>
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
                <Select value={formData.roomNumber || undefined} onValueChange={(value) => onFormChange("roomNumber", value)}>
                  <SelectTrigger><SelectValue placeholder="Auto-assign or select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-assign</SelectItem>
                    {availableRooms
                      .filter((room) => !formData.roomType || room.roomTypeId === formData.roomType)
                      .map((room) => <SelectItem key={room.id} value={room.number}>{room.number} - {room.type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ratePlan">Rate Plan</Label>
                <Select value={formData.ratePlan || undefined} onValueChange={(value) => onFormChange("ratePlan", value)}>
                  <SelectTrigger><SelectValue placeholder="Select rate plan" /></SelectTrigger>
                  <SelectContent>{ratePlans.map((plan) => <SelectItem key={plan._id || plan.id} value={plan._id || plan.id}>{plan.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bookingSource">Booking Source</Label>
                <Select value={formData.bookingSource || undefined} onValueChange={(value) => onFormChange("bookingSource", value)}>
                  <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>{renderSetupItems(businessSourceOptions)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="specialRequests">Special Requests</Label>
                <Textarea id="specialRequests" placeholder="Any special requests or notes..." value={formData.specialRequests} onChange={(event) => onFormChange("specialRequests", event.target.value)} rows={3} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="advanceAmount">Advance Amount</Label>
                <Input id="advanceAmount" type="number" placeholder="0.00" value={formData.advanceAmount} onChange={(event) => onFormChange("advanceAmount", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMode">Payment Mode</Label>
                <Select value={formData.paymentMode || undefined} onValueChange={(value) => onFormChange("paymentMode", value)}>
                  <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                  <SelectContent>{renderSetupItems(paymentModeOptions)}</SelectContent>
                </Select>
              </div>
            </div>
            <Card className="bg-secondary/50">
              <CardContent className="pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Room Charges (estimated)</span><span>${estimates.roomCharges.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Taxes (12%)</span><span>${estimates.taxes.toFixed(2)}</span></div>
                  <div className="flex justify-between font-medium border-t border-border pt-2 mt-2"><span>Total Estimated</span><span>${estimates.total.toFixed(2)}</span></div>
                  <div className="flex justify-between text-success"><span>Advance Paid</span><span>-${Number(formData.advanceAmount || 0).toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold border-t border-border pt-2 mt-2 text-lg"><span>Total Payable</span><span>${(estimates.total - Number(formData.advanceAmount || 0)).toFixed(2)}</span></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="outline" onClick={onPrevious} className="gap-2" disabled={currentTabIndex === 0}>
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          {currentTabIndex < 2 ? (
            <Button onClick={onNext} disabled={!canContinue} className="gap-2">
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={onSave} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Reservation
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
