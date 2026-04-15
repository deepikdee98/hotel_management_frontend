"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Search, Plus, Receipt, CreditCard, Printer, Percent, Trash2 } from "lucide-react"

// Mock in-house guests with billing
const MOCK_BILLS = [
  {
    id: "BILL-001",
    guestName: "James Wilson",
    roomNumber: "102",
    checkIn: "2024-12-18",
    checkOut: "2024-12-22",
    roomCharges: 400,
    extraServices: [
      { name: "Room Service - Dinner", amount: 45 },
      { name: "Laundry", amount: 25 },
      { name: "Mini Bar", amount: 30 },
    ],
    taxes: 60,
    discount: 0,
    advancePaid: 200,
    status: "pending",
  },
  {
    id: "BILL-002",
    guestName: "Emma Davis",
    roomNumber: "103",
    checkIn: "2024-12-19",
    checkOut: "2024-12-21",
    roomCharges: 300,
    extraServices: [
      { name: "Spa Treatment", amount: 80 },
    ],
    taxes: 45.6,
    discount: 20,
    advancePaid: 150,
    status: "pending",
  },
  {
    id: "BILL-003",
    guestName: "Robert Brown",
    roomNumber: "202",
    checkIn: "2024-12-21",
    checkOut: "2024-12-25",
    roomCharges: 600,
    extraServices: [],
    taxes: 72,
    discount: 0,
    advancePaid: 300,
    status: "paid",
  },
]

export default function BillingPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBill, setSelectedBill] = useState<typeof MOCK_BILLS[0] | null>(null)
  const [isAddChargeOpen, setIsAddChargeOpen] = useState(false)
  const [isDiscountOpen, setIsDiscountOpen] = useState(false)
  const [newCharge, setNewCharge] = useState({ name: "", amount: "" })
  const [discountAmount, setDiscountAmount] = useState("")

  const filteredBills = MOCK_BILLS.filter(
    (bill) =>
      bill.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.roomNumber.includes(searchQuery) ||
      bill.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const calculateTotal = (bill: typeof MOCK_BILLS[0]) => {
    const servicesTotal = bill.extraServices.reduce((sum, s) => sum + s.amount, 0)
    return bill.roomCharges + servicesTotal + bill.taxes - bill.discount
  }

  const calculateBalance = (bill: typeof MOCK_BILLS[0]) => {
    return calculateTotal(bill) - bill.advancePaid
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing / Folio</h1>
          <p className="text-sm text-muted-foreground">Manage guest charges and generate bills</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bills List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Guest Bills</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search guest or room..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredBills.map((bill) => (
                <div
                  key={bill.id}
                  onClick={() => setSelectedBill(bill)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedBill?.id === bill.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-secondary/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{bill.guestName}</span>
                    <Badge
                      variant={bill.status === "paid" ? "default" : "secondary"}
                      className={bill.status === "paid" ? "bg-success text-success-foreground" : ""}
                    >
                      {bill.status === "paid" ? "Paid" : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Room {bill.roomNumber}</span>
                    <span>${calculateBalance(bill).toFixed(2)} due</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Bill Details */}
          <Card className="lg:col-span-2">
            {selectedBill ? (
              <>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{selectedBill.guestName}</CardTitle>
                      <CardDescription>
                        Room {selectedBill.roomNumber} | {selectedBill.id}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Dialog open={isAddChargeOpen} onOpenChange={setIsAddChargeOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-1 bg-transparent">
                            <Plus className="h-4 w-4" />
                            Add Charge
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Charge</DialogTitle>
                            <DialogDescription>Add extra service charge to the bill</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Service Name</Label>
                              <Input
                                placeholder="e.g., Room Service, Laundry"
                                value={newCharge.name}
                                onChange={(e) => setNewCharge({ ...newCharge, name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Amount ($)</Label>
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={newCharge.amount}
                                onChange={(e) => setNewCharge({ ...newCharge, amount: e.target.value })}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddChargeOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={() => setIsAddChargeOpen(false)}>Add Charge</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Dialog open={isDiscountOpen} onOpenChange={setIsDiscountOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-1 bg-transparent">
                            <Percent className="h-4 w-4" />
                            Discount
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Apply Discount</DialogTitle>
                            <DialogDescription>Enter discount amount to apply</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Discount Amount ($)</Label>
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={discountAmount}
                                onChange={(e) => setDiscountAmount(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDiscountOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={() => setIsDiscountOpen(false)}>Apply</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stay Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Check-in:</span>
                      <span className="ml-2 font-medium">{selectedBill.checkIn}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Check-out:</span>
                      <span className="ml-2 font-medium">{selectedBill.checkOut}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Charges Table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Room Charges</TableCell>
                        <TableCell className="text-right">${selectedBill.roomCharges.toFixed(2)}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      {selectedBill.extraServices.map((service, index) => (
                        <TableRow key={index}>
                          <TableCell>{service.name}</TableCell>
                          <TableCell className="text-right">${service.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Trash2 className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell>Taxes (12%)</TableCell>
                        <TableCell className="text-right">${selectedBill.taxes.toFixed(2)}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      {selectedBill.discount > 0 && (
                        <TableRow>
                          <TableCell className="text-success">Discount</TableCell>
                          <TableCell className="text-right text-success">
                            -${selectedBill.discount.toFixed(2)}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  <Separator />

                  {/* Summary */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-medium">${calculateTotal(selectedBill).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Advance Paid</span>
                      <span className="text-success">-${selectedBill.advancePaid.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base font-semibold">
                      <span>Balance Payable</span>
                      <span className="text-primary">${calculateBalance(selectedBill).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button className="flex-1 gap-2">
                      <CreditCard className="h-4 w-4" />
                      Collect Payment
                    </Button>
                    <Button variant="outline" className="gap-2 bg-transparent">
                      <Printer className="h-4 w-4" />
                      Print Bill
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-96 text-muted-foreground">
                <div className="text-center">
                  <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Select a guest to view their bill</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
