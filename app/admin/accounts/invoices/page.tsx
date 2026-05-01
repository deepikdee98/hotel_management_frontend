"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
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
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Search, Download, Eye, Printer, Send, CreditCard } from "lucide-react"
import { useSetupOptions } from "@/hooks/use-setup-options"

const mockInvoices = [
  { id: "INV-001", guestName: "John Smith", room: "101", checkIn: "2024-01-10", checkOut: "2024-01-15", roomCharges: 600.00, services: 150.00, taxes: 112.50, discount: 0, total: 862.50, paid: 862.50, balance: 0, status: "paid" },
  { id: "INV-002", guestName: "Emma Wilson", room: "205", checkIn: "2024-01-12", checkOut: "2024-01-16", roomCharges: 480.00, services: 40.00, taxes: 78.00, discount: 0, total: 598.00, paid: 200.00, balance: 398.00, status: "partial" },
  { id: "INV-003", guestName: "Michael Brown", room: "302", checkIn: "2024-01-08", checkOut: "2024-01-14", roomCharges: 840.00, services: 220.00, taxes: 159.00, discount: 50.00, total: 1169.00, paid: 1169.00, balance: 0, status: "paid" },
  { id: "INV-004", guestName: "Sarah Davis", room: "118", checkIn: "2024-01-14", checkOut: "2024-01-18", roomCharges: 560.00, services: 80.00, taxes: 96.00, discount: 0, total: 736.00, paid: 0, balance: 736.00, status: "pending" },
  { id: "INV-005", guestName: "Robert Chen", room: "401", checkIn: "2024-01-11", checkOut: "2024-01-15", roomCharges: 720.00, services: 180.00, taxes: 135.00, discount: 100.00, total: 935.00, paid: 500.00, balance: 435.00, status: "partial" },
  { id: "INV-006", guestName: "Lisa Wang", room: "215", checkIn: "2024-01-09", checkOut: "2024-01-12", roomCharges: 360.00, services: 0, taxes: 54.00, discount: 0, total: 414.00, paid: 0, balance: 414.00, status: "overdue" },
]

export default function InvoicesPage() {
  const paymentModeOptions = useSetupOptions("paymentMode")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedInvoice, setSelectedInvoice] = useState<typeof mockInvoices[0] | null>(null)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)

  const filteredInvoices = mockInvoices.filter((inv) => {
    const matchesSearch = inv.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.room.includes(searchQuery)
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-primary/20 text-primary border-0">Paid</Badge>
      case "partial":
        return <Badge className="bg-warning/20 text-warning border-0">Partial</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const totalPending = filteredInvoices.filter(i => i.status !== "paid").reduce((sum, i) => sum + i.balance, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Manage guest invoices and billing</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Invoices</div>
            <div className="text-2xl font-bold">{filteredInvoices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Paid</div>
            <div className="text-2xl font-bold text-primary">{filteredInvoices.filter(i => i.status === "paid").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Pending</div>
            <div className="text-2xl font-bold text-warning">{filteredInvoices.filter(i => i.status !== "paid").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Outstanding Amount</div>
            <div className="text-2xl font-bold text-destructive">${totalPending.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Invoices</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search guest, invoice, room..."
                  className="pl-8 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Stay Period</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.id}</TableCell>
                  <TableCell>{inv.guestName}</TableCell>
                  <TableCell>{inv.room}</TableCell>
                  <TableCell>
                    <div className="text-sm">{inv.checkIn}</div>
                    <div className="text-xs text-muted-foreground">to {inv.checkOut}</div>
                  </TableCell>
                  <TableCell className="font-medium">${inv.total.toFixed(2)}</TableCell>
                  <TableCell className="text-primary">${inv.paid.toFixed(2)}</TableCell>
                  <TableCell className={inv.balance > 0 ? "text-destructive font-medium" : ""}>
                    ${inv.balance.toFixed(2)}
                  </TableCell>
                  <TableCell>{getStatusBadge(inv.status)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(inv)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Printer className="h-4 w-4" />
                      </Button>
                      {inv.balance > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedInvoice(inv); setIsPaymentOpen(true); }}>
                          <CreditCard className="h-4 w-4" />
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

      {/* View Invoice Dialog */}
      <Dialog open={!!selectedInvoice && !isPaymentOpen} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>{selectedInvoice?.id}</DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-muted-foreground">Guest Name</Label>
                  <p className="font-medium">{selectedInvoice.guestName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Room</Label>
                  <p className="font-medium">{selectedInvoice.room}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Check-In</Label>
                  <p className="font-medium">{selectedInvoice.checkIn}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Check-Out</Label>
                  <p className="font-medium">{selectedInvoice.checkOut}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span>Room Charges</span>
                  <span>${selectedInvoice.roomCharges.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Services</span>
                  <span>${selectedInvoice.services.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Taxes</span>
                  <span>${selectedInvoice.taxes.toFixed(2)}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between py-2 border-b text-primary">
                    <span>Discount</span>
                    <span>-${selectedInvoice.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 font-bold text-lg">
                  <span>Total</span>
                  <span>${selectedInvoice.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Amount Paid</span>
                  <span className="text-primary">${selectedInvoice.paid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 font-bold">
                  <span>Balance Due</span>
                  <span className={selectedInvoice.balance > 0 ? "text-destructive" : "text-primary"}>
                    ${selectedInvoice.balance.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedInvoice(null)}>Close</Button>
            <Button variant="outline"><Send className="mr-2 h-4 w-4" /> Email</Button>
            <Button><Printer className="mr-2 h-4 w-4" /> Print</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Collect Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Collect Payment</DialogTitle>
            <DialogDescription>Record payment for {selectedInvoice?.id}</DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between">
                  <span>Balance Due</span>
                  <span className="font-bold text-destructive">${selectedInvoice.balance.toFixed(2)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Payment Amount *</Label>
                <Input type="number" placeholder="0.00" defaultValue={selectedInvoice.balance} />
              </div>
              <div className="space-y-2">
                <Label>Payment Mode *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentModeOptions.loading ? <SelectItem value="__loading__" disabled>Loading...</SelectItem> : paymentModeOptions.data.map(p => <SelectItem key={p._id} value={p.value}>{p.value}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reference No.</Label>
                <Input placeholder="Transaction reference" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>Cancel</Button>
            <Button onClick={() => setIsPaymentOpen(false)}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
