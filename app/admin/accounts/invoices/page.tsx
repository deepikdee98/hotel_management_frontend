"use client"

import { useEffect, useState } from "react"
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
import { useToast } from "@/hooks/use-toast"
import {
  collectAccountsInvoicePayment,
  getAccountsInvoices,
  sendAccountsInvoice,
  type AccountsInvoice,
} from "@/services/api/accounts.service"

function formatCurrency(value: unknown) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function InvoicesPage() {
  const { toast } = useToast()
  const paymentModeOptions = useSetupOptions("paymentMode")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [invoices, setInvoices] = useState<AccountsInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<AccountsInvoice | null>(null)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMode, setPaymentMode] = useState("")
  const [paymentReference, setPaymentReference] = useState("")

  const loadInvoices = async () => {
    setLoading(true)
    try {
      const result = await getAccountsInvoices({ search: searchQuery, status: statusFilter, limit: 100 })
      setInvoices(result.invoices)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load invoices"
      toast({ title: "Invoices unavailable", description: message, variant: "destructive" })
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
  }, [searchQuery, statusFilter])

  // Use API-provided invoices directly
  const sourceInvoices: AccountsInvoice[] = invoices

  const filteredInvoices = sourceInvoices.filter((inv) => {
    const matchesSearch = inv.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.invoiceNumber || inv.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const openPayment = (invoice: AccountsInvoice) => {
    setSelectedInvoice(invoice)
    setPaymentAmount(String(invoice.balance || ""))
    setPaymentMode("")
    setPaymentReference("")
    setIsPaymentOpen(true)
  }

  const recordPayment = async () => {
    if (!selectedInvoice || !paymentAmount || !paymentMode) {
      toast({ title: "Missing details", description: "Amount and payment mode are required.", variant: "destructive" })
      return
    }

    try {
      await collectAccountsInvoicePayment(selectedInvoice._id, {
        customerName: selectedInvoice.guestName,
        amount: Number(paymentAmount),
        paymentMode,
        reference: paymentReference,
      })
      toast({ title: "Payment recorded", description: "Invoice payment was collected." })
      setIsPaymentOpen(false)
      setSelectedInvoice(null)
      loadInvoices()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to record payment"
      toast({ title: "Payment failed", description: message, variant: "destructive" })
    }
  }

  const handleSendInvoice = async () => {
    if (!selectedInvoice) return
    try {
      await sendAccountsInvoice(selectedInvoice._id)
      toast({ title: "Invoice sent", description: "Invoice was marked as sent." })
      loadInvoices()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send invoice"
      toast({ title: "Send failed", description: message, variant: "destructive" })
    }
  }

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
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalPending)}</div>
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
              {loading && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">Loading invoices...</TableCell>
                </TableRow>
              )}
              {!loading && filteredInvoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.invoiceNumber || inv.id}</TableCell>
                  <TableCell>{inv.guestName}</TableCell>
                  <TableCell>{inv.room}</TableCell>
                  <TableCell>
                    <div className="text-sm">{String(inv.checkIn || "").slice(0, 10) || "-"}</div>
                    <div className="text-xs text-muted-foreground">to {String(inv.checkOut || "").slice(0, 10) || "-"}</div>
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(inv.total)}</TableCell>
                  <TableCell className="text-primary">{formatCurrency(inv.paid)}</TableCell>
                  <TableCell className={inv.balance > 0 ? "text-destructive font-medium" : ""}>
                    {formatCurrency(inv.balance)}
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
                        <Button variant="ghost" size="sm" onClick={() => openPayment(inv)}>
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
            <DialogDescription>{selectedInvoice?.invoiceNumber || selectedInvoice?.id}</DialogDescription>
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
                  <p className="font-medium">{String(selectedInvoice.checkIn || "").slice(0, 10) || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Check-Out</Label>
                  <p className="font-medium">{String(selectedInvoice.checkOut || "").slice(0, 10) || "-"}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span>Room Charges</span>
                  <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Services</span>
                  <span>{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Taxes</span>
                  <span>{formatCurrency(selectedInvoice.taxes || selectedInvoice.totalTax)}</span>
                </div>
                <div className="flex justify-between py-2 font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(selectedInvoice.total)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Amount Paid</span>
                  <span className="text-primary">{formatCurrency(selectedInvoice.paid)}</span>
                </div>
                <div className="flex justify-between py-2 font-bold">
                  <span>Balance Due</span>
                  <span className={selectedInvoice.balance > 0 ? "text-destructive" : "text-primary"}>
                    {formatCurrency(selectedInvoice.balance)}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedInvoice(null)}>Close</Button>
            <Button variant="outline" onClick={handleSendInvoice}><Send className="mr-2 h-4 w-4" /> Email</Button>
            <Button><Printer className="mr-2 h-4 w-4" /> Print</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Collect Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Collect Payment</DialogTitle>
            <DialogDescription>Record payment for {selectedInvoice?.invoiceNumber || selectedInvoice?.id}</DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between">
                  <span>Balance Due</span>
                  <span className="font-bold text-destructive">{formatCurrency(selectedInvoice.balance)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Payment Amount *</Label>
                <Input type="number" placeholder="0.00" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Payment Mode *</Label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
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
                <Input placeholder="Transaction reference" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>Cancel</Button>
            <Button onClick={recordPayment}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
