"use client"

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
import { ArrowDownLeft, ArrowUpRight, Download, Search } from "lucide-react"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useSetupOptions } from "@/hooks/use-setup-options"
import { useToast } from "@/hooks/use-toast"
import {
  createAccountsPayment,
  createAccountsReceipt,
  getAccountsPayments,
  getAccountsReceipts,
  type AccountsPayment,
} from "@/services/api/accounts.service"

const outgoingCategories = ["Utilities", "Supplies", "Payroll", "Maintenance", "Insurance", "Rent", "Marketing", "Other"]
const incomingCategories = ["Advance", "Commission", "Deposit", "Refund Received", "Other"]

const initialOutgoingForm = {
  vendorName: "",
  category: "",
  amount: "",
  paymentMode: "",
  paymentDate: new Date().toISOString().slice(0, 10),
  reference: "",
  description: "",
}

const initialIncomingForm = {
  customerName: "",
  receiptType: "",
  amount: "",
  paymentMode: "",
  reference: "",
  remarks: "",
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(value?: string) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

function displayId(payment: AccountsPayment, prefix: string) {
  return payment.id ? `${prefix}-${payment.id.slice(-6).toUpperCase()}` : "-"
}

function sourceLabel(sourceModule?: string) {
  return sourceModule === "front-office" ? "Front Office" : "Manual"
}

export default function PaymentsPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false)
  const [isReceivePaymentOpen, setIsReceivePaymentOpen] = useState(false)
  const [sourceFilter, setSourceFilter] = useState("all")
  const [outgoingPayments, setOutgoingPayments] = useState<AccountsPayment[]>([])
  const [incomingPayments, setIncomingPayments] = useState<AccountsPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [outgoingForm, setOutgoingForm] = useState(initialOutgoingForm)
  const [incomingForm, setIncomingForm] = useState(initialIncomingForm)
  const debouncedSearch = useDebouncedValue(searchQuery, 350)
  const paymentModeOptions = useSetupOptions("paymentMode")

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [paymentsResult, receiptsResult] = await Promise.all([
        getAccountsPayments({ direction: "outgoing", search: debouncedSearch, sourceModule: sourceFilter, page: 1, limit: 50 }),
        getAccountsReceipts({ search: debouncedSearch, sourceModule: sourceFilter, page: 1, limit: 50 }),
      ])
      setOutgoingPayments(paymentsResult.payments)
      setIncomingPayments(receiptsResult.receipts)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load payments"
      setError(message)
      toast({ title: "Payments not loaded", description: message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, sourceFilter, toast])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const outgoingCategoryOptions = useMemo(() => {
    const values = new Set(outgoingCategories)
    outgoingPayments.forEach((payment) => {
      if (payment.category) values.add(payment.category)
    })
    return Array.from(values)
  }, [outgoingPayments])

  const incomingCategoryOptions = useMemo(() => {
    const values = new Set(incomingCategories)
    incomingPayments.forEach((payment) => {
      if (payment.category) values.add(payment.category)
    })
    return Array.from(values)
  }, [incomingPayments])

  const paymentModeItems = paymentModeOptions.loading ? (
    <SelectItem value="__loading__" disabled>Loading...</SelectItem>
  ) : (
    paymentModeOptions.data.map((mode) => (
      <SelectItem key={mode._id} value={mode.value}>{mode.value}</SelectItem>
    ))
  )

  const totalPaidOut = outgoingPayments.reduce((sum, payment) => sum + payment.amount, 0)
  const totalReceived = incomingPayments.reduce((sum, payment) => sum + payment.amount, 0)

  async function handleCreateOutgoingPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!outgoingForm.vendorName || !outgoingForm.amount || !outgoingForm.paymentMode) {
      toast({ title: "Missing details", description: "Payee name, amount, and payment mode are required.", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      await createAccountsPayment({
        vendorName: outgoingForm.vendorName,
        category: outgoingForm.category || undefined,
        description: outgoingForm.description || undefined,
        amount: Number(outgoingForm.amount),
        paymentMode: outgoingForm.paymentMode,
        paymentDate: outgoingForm.paymentDate || undefined,
        utrNumber: outgoingForm.reference || undefined,
        direction: "outgoing",
      })
      setOutgoingForm(initialOutgoingForm)
      setIsAddPaymentOpen(false)
      toast({ title: "Payment saved", description: "The outgoing payment was recorded." })
      fetchPayments()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save payment"
      toast({ title: "Payment not saved", description: message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateIncomingPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!incomingForm.customerName || !incomingForm.amount || !incomingForm.paymentMode) {
      toast({ title: "Missing details", description: "Payer name, amount, and payment mode are required.", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      await createAccountsReceipt({
        customerName: incomingForm.customerName,
        receiptType: incomingForm.receiptType || undefined,
        amount: Number(incomingForm.amount),
        paymentMode: incomingForm.paymentMode,
        reference: incomingForm.reference || undefined,
        remarks: incomingForm.remarks || undefined,
      })
      setIncomingForm(initialIncomingForm)
      setIsReceivePaymentOpen(false)
      toast({ title: "Payment received", description: "The incoming payment was recorded." })
      fetchPayments()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to receive payment"
      toast({ title: "Payment not saved", description: message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-muted-foreground">Manage outgoing and incoming payments</p>
        </div>
        <div className="flex gap-2">
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="front-office">Front Office</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Dialog open={isReceivePaymentOpen} onOpenChange={setIsReceivePaymentOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ArrowDownLeft className="mr-2 h-4 w-4" />
                Receive Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateIncomingPayment}>
                <DialogHeader>
                  <DialogTitle>Receive Payment</DialogTitle>
                  <DialogDescription>Record an incoming payment</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Payer Name *</Label>
                    <Input
                      required
                      placeholder="Company/Person name"
                      value={incomingForm.customerName}
                      onChange={(event) => setIncomingForm((current) => ({ ...current, customerName: event.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={incomingForm.receiptType} onValueChange={(receiptType) => setIncomingForm((current) => ({ ...current, receiptType }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {incomingCategoryOptions.map((category) => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Amount *</Label>
                      <Input
                        required
                        min="0.01"
                        step="0.01"
                        type="number"
                        placeholder="0.00"
                        value={incomingForm.amount}
                        onChange={(event) => setIncomingForm((current) => ({ ...current, amount: event.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Payment Mode *</Label>
                      <Select value={incomingForm.paymentMode} onValueChange={(paymentMode) => setIncomingForm((current) => ({ ...current, paymentMode }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>{paymentModeItems}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Reference No.</Label>
                      <Input
                        placeholder="Reference number"
                        value={incomingForm.reference}
                        onChange={(event) => setIncomingForm((current) => ({ ...current, reference: event.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Payment details..."
                      rows={2}
                      value={incomingForm.remarks}
                      onChange={(event) => setIncomingForm((current) => ({ ...current, remarks: event.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsReceivePaymentOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
                </DialogFooter>
              </form>
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
              <form onSubmit={handleCreateOutgoingPayment}>
                <DialogHeader>
                  <DialogTitle>Make Payment</DialogTitle>
                  <DialogDescription>Record an outgoing payment</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Payee Name *</Label>
                    <Input
                      required
                      placeholder="Vendor/Supplier name"
                      value={outgoingForm.vendorName}
                      onChange={(event) => setOutgoingForm((current) => ({ ...current, vendorName: event.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={outgoingForm.category} onValueChange={(category) => setOutgoingForm((current) => ({ ...current, category }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {outgoingCategoryOptions.map((category) => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Amount *</Label>
                      <Input
                        required
                        min="0.01"
                        step="0.01"
                        type="number"
                        placeholder="0.00"
                        value={outgoingForm.amount}
                        onChange={(event) => setOutgoingForm((current) => ({ ...current, amount: event.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Payment Mode *</Label>
                      <Select value={outgoingForm.paymentMode} onValueChange={(paymentMode) => setOutgoingForm((current) => ({ ...current, paymentMode }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>{paymentModeItems}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date *</Label>
                      <Input
                        required
                        type="date"
                        value={outgoingForm.paymentDate}
                        onChange={(event) => setOutgoingForm((current) => ({ ...current, paymentDate: event.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Reference No.</Label>
                    <Input
                      placeholder="Cheque/Transaction number"
                      value={outgoingForm.reference}
                      onChange={(event) => setOutgoingForm((current) => ({ ...current, reference: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Payment details..."
                      rows={2}
                      value={outgoingForm.description}
                      onChange={(event) => setOutgoingForm((current) => ({ ...current, description: event.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddPaymentOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Paid Out</div>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalPaidOut)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Received</div>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalReceived)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Net Flow</div>
            <div className={`text-2xl font-bold ${totalReceived - totalPaidOut >= 0 ? "text-primary" : "text-destructive"}`}>
              {formatCurrency(totalReceived - totalPaidOut)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="outgoing">
        <TabsList>
          <TabsTrigger value="outgoing">Payments Made</TabsTrigger>
          <TabsTrigger value="incoming">Payments Received</TabsTrigger>
        </TabsList>

        <TabsContent value="outgoing" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">Outgoing Payments</h2>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="w-48 pl-8"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </div>
              </div>
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
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outgoingPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{displayId(payment, "PAY")}</TableCell>
                      <TableCell>{formatDate(payment.date)}</TableCell>
                      <TableCell>{payment.payee || "-"}</TableCell>
                      <TableCell>{payment.category || "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{payment.description || "-"}</TableCell>
                      <TableCell>{payment.mode || "-"}</TableCell>
                      <TableCell className="font-medium text-destructive">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={payment.sourceModule === "front-office" ? "secondary" : "outline"}>
                          {sourceLabel(payment.sourceModule)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && outgoingPayments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                        {error || "No outgoing payments found."}
                      </TableCell>
                    </TableRow>
                  )}
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">Loading payments...</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incoming" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">Incoming Payments</h2>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="w-48 pl-8"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </div>
              </div>
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
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomingPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{displayId(payment, "RCV")}</TableCell>
                      <TableCell>{formatDate(payment.date)}</TableCell>
                      <TableCell>{payment.payer || "-"}</TableCell>
                      <TableCell>{payment.category || "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{payment.description || "-"}</TableCell>
                      <TableCell>{payment.mode || "-"}</TableCell>
                      <TableCell className="font-medium text-primary">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={payment.sourceModule === "front-office" ? "secondary" : "outline"}>
                          {sourceLabel(payment.sourceModule)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && incomingPayments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                        {error || "No incoming payments found."}
                      </TableCell>
                    </TableRow>
                  )}
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">Loading payments...</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
