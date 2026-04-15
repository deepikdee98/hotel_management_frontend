"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Download, ArrowDownLeft, ArrowUpRight } from "lucide-react"

const mockPaymentsOut = [
  { id: "PAY-001", date: "2024-01-15", payee: "City Power Corp", category: "Utilities", description: "Monthly electricity bill", amount: 850.00, mode: "Bank Transfer", reference: "BT-8834", status: "completed" },
  { id: "PAY-002", date: "2024-01-14", payee: "Fresh Foods Ltd", category: "Supplies", description: "Kitchen supplies", amount: 1200.00, mode: "Cheque", reference: "CHQ-1122", status: "completed" },
  { id: "PAY-003", date: "2024-01-13", payee: "Staff Payroll", category: "Payroll", description: "January salaries", amount: 15000.00, mode: "Bank Transfer", reference: "BT-8800", status: "completed" },
  { id: "PAY-004", date: "2024-01-12", payee: "ABC Maintenance", category: "Maintenance", description: "AC servicing", amount: 450.00, mode: "Cash", reference: "CASH-105", status: "completed" },
  { id: "PAY-005", date: "2024-01-15", payee: "Insurance Co", category: "Insurance", description: "Monthly premium", amount: 2500.00, mode: "Bank Transfer", reference: "BT-8840", status: "pending" },
]

const mockPaymentsIn = [
  { id: "RCV-001", date: "2024-01-15", payer: "Corporate Client A", category: "Advance", description: "Conference booking advance", amount: 5000.00, mode: "Bank Transfer", reference: "BT-IN-001", status: "completed" },
  { id: "RCV-002", date: "2024-01-14", payer: "Travel Agency XYZ", category: "Commission", description: "Booking commission settlement", amount: 1500.00, mode: "Cheque", reference: "CHQ-IN-001", status: "completed" },
  { id: "RCV-003", date: "2024-01-13", payer: "Event Organizer", category: "Deposit", description: "Wedding hall deposit", amount: 10000.00, mode: "Bank Transfer", reference: "BT-IN-002", status: "completed" },
]

const categories = ["Utilities", "Supplies", "Payroll", "Maintenance", "Insurance", "Rent", "Marketing", "Other"]
const paymentModes = ["Cash", "Bank Transfer", "Cheque", "UPI", "Credit Card"]

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false)
  const [isReceivePaymentOpen, setIsReceivePaymentOpen] = useState(false)

  const totalPaidOut = mockPaymentsOut.reduce((sum, p) => sum + p.amount, 0)
  const totalReceived = mockPaymentsIn.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-muted-foreground">Manage outgoing and incoming payments</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isReceivePaymentOpen} onOpenChange={setIsReceivePaymentOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ArrowDownLeft className="mr-2 h-4 w-4" />
                Receive Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Receive Payment</DialogTitle>
                <DialogDescription>Record an incoming payment</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Payer Name *</Label>
                  <Input placeholder="Company/Person name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="advance">Advance</SelectItem>
                        <SelectItem value="commission">Commission</SelectItem>
                        <SelectItem value="deposit">Deposit</SelectItem>
                        <SelectItem value="refund">Refund Received</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount *</Label>
                    <Input type="number" placeholder="0.00" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Payment Mode *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentModes.map(mode => (
                          <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Input type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Reference No.</Label>
                  <Input placeholder="Reference number" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Payment details..." rows={2} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsReceivePaymentOpen(false)}>Cancel</Button>
                <Button onClick={() => setIsReceivePaymentOpen(false)}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
            <DialogTrigger asChild>
              <Button>
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Make Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Make Payment</DialogTitle>
                <DialogDescription>Record an outgoing payment</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Payee Name *</Label>
                  <Input placeholder="Vendor/Supplier name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount *</Label>
                    <Input type="number" placeholder="0.00" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Payment Mode *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentModes.map(mode => (
                          <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Input type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Reference No.</Label>
                  <Input placeholder="Cheque/Transaction number" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Payment details..." rows={2} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddPaymentOpen(false)}>Cancel</Button>
                <Button onClick={() => setIsAddPaymentOpen(false)}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Paid Out</div>
            <div className="text-2xl font-bold text-destructive">${totalPaidOut.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Received</div>
            <div className="text-2xl font-bold text-primary">${totalReceived.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Net Flow</div>
            <div className={`text-2xl font-bold ${totalReceived - totalPaidOut >= 0 ? "text-primary" : "text-destructive"}`}>
              ${(totalReceived - totalPaidOut).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="outgoing">
        <TabsList>
          <TabsTrigger value="outgoing">Payments Made</TabsTrigger>
          <TabsTrigger value="incoming">Payments Received</TabsTrigger>
        </TabsList>

        <TabsContent value="outgoing" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Outgoing Payments</CardTitle>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search..." className="pl-8 w-48" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Payee</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPaymentsOut.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.id}</TableCell>
                      <TableCell>{payment.date}</TableCell>
                      <TableCell>{payment.payee}</TableCell>
                      <TableCell>{payment.category}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{payment.description}</TableCell>
                      <TableCell>{payment.mode}</TableCell>
                      <TableCell className="font-medium text-destructive">${payment.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incoming" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Incoming Payments</CardTitle>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search..." className="pl-8 w-48" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Payer</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPaymentsIn.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.id}</TableCell>
                      <TableCell>{payment.date}</TableCell>
                      <TableCell>{payment.payer}</TableCell>
                      <TableCell>{payment.category}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{payment.description}</TableCell>
                      <TableCell>{payment.mode}</TableCell>
                      <TableCell className="font-medium text-primary">${payment.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="default">{payment.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
