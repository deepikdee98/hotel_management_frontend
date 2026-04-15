"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Search, LogOut, CreditCard, Printer, Star, CheckCircle } from "lucide-react"

// Mock guests ready for checkout
const MOCK_CHECKOUT_GUESTS = [
  {
    id: "RES-001",
    guestName: "James Wilson",
    roomNumber: "102",
    checkIn: "2024-12-18",
    scheduledCheckout: "2024-12-22",
    roomCharges: 400,
    extraServices: 100,
    taxes: 60,
    totalAmount: 560,
    advancePaid: 200,
    balanceDue: 360,
    status: "due-today",
  },
  {
    id: "RES-002",
    guestName: "Emma Davis",
    roomNumber: "103",
    checkIn: "2024-12-19",
    scheduledCheckout: "2024-12-21",
    roomCharges: 300,
    extraServices: 80,
    taxes: 45.6,
    totalAmount: 405.6,
    advancePaid: 150,
    balanceDue: 255.6,
    status: "overdue",
  },
  {
    id: "RES-003",
    guestName: "Robert Brown",
    roomNumber: "202",
    checkIn: "2024-12-21",
    scheduledCheckout: "2024-12-25",
    roomCharges: 600,
    extraServices: 0,
    taxes: 72,
    totalAmount: 672,
    advancePaid: 672,
    balanceDue: 0,
    status: "paid",
  },
]

export default function CheckOutPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGuest, setSelectedGuest] = useState<typeof MOCK_CHECKOUT_GUESTS[0] | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [paymentMode, setPaymentMode] = useState("cash")
  const [feedback, setFeedback] = useState("")
  const [rating, setRating] = useState(0)

  const filteredGuests = MOCK_CHECKOUT_GUESTS.filter(
    (guest) =>
      guest.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.roomNumber.includes(searchQuery)
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "due-today":
        return <Badge className="bg-warning/10 text-warning border-warning/20">Due Today</Badge>
      case "overdue":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Overdue</Badge>
      case "paid":
        return <Badge className="bg-success/10 text-success border-success/20">Fully Paid</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleCheckout = () => {
    // Process checkout
    setIsCheckoutOpen(false)
    setSelectedGuest(null)
    setFeedback("")
    setRating(0)
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Check-Out</h1>
          <p className="text-sm text-muted-foreground">Process guest departures and final settlements</p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by guest name or room number..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Checkout List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Guests Ready for Checkout</CardTitle>
            <CardDescription>{filteredGuests.length} guests found</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest Name</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Checkout Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGuests.map((guest) => (
                  <TableRow key={guest.id}>
                    <TableCell className="font-medium">{guest.guestName}</TableCell>
                    <TableCell>{guest.roomNumber}</TableCell>
                    <TableCell>{guest.checkIn}</TableCell>
                    <TableCell>{guest.scheduledCheckout}</TableCell>
                    <TableCell>${guest.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className={guest.balanceDue > 0 ? "text-destructive font-medium" : "text-success"}>
                      ${guest.balanceDue.toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(guest.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedGuest(guest)
                          setIsCheckoutOpen(true)
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-1" />
                        Check Out
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Checkout Dialog */}
        <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Complete Check-Out</DialogTitle>
              <DialogDescription>
                {selectedGuest?.guestName} - Room {selectedGuest?.roomNumber}
              </DialogDescription>
            </DialogHeader>

            {selectedGuest && (
              <div className="space-y-4">
                {/* Bill Summary */}
                <Card className="bg-secondary/30">
                  <CardContent className="pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Room Charges</span>
                      <span>${selectedGuest.roomCharges.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Extra Services</span>
                      <span>${selectedGuest.extraServices.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxes</span>
                      <span>${selectedGuest.taxes.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total Amount</span>
                      <span>${selectedGuest.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-success">
                      <span>Advance Paid</span>
                      <span>-${selectedGuest.advancePaid.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base font-semibold">
                      <span>Balance Due</span>
                      <span className={selectedGuest.balanceDue > 0 ? "text-destructive" : "text-success"}>
                        ${selectedGuest.balanceDue.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment if balance due */}
                {selectedGuest.balanceDue > 0 && (
                  <div className="space-y-3">
                    <Label>Payment Mode</Label>
                    <Select value={paymentMode} onValueChange={setPaymentMode}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Credit/Debit Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Feedback */}
                <div className="space-y-3">
                  <Label>Guest Feedback (Optional)</Label>
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-6 w-6 transition-colors ${
                            star <= rating ? "fill-warning text-warning" : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    placeholder="Any comments or suggestions..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Checkout Time */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Checkout Time</span>
                  <span className="font-medium">{new Date().toLocaleString()}</span>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
                Cancel
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Printer className="h-4 w-4" />
                Print Invoice
              </Button>
              <Button onClick={handleCheckout} className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Complete Checkout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
