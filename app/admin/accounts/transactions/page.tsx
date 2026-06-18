"use client"

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Plus, Search, Download, Eye } from "lucide-react"
import { useSetupOptions } from "@/hooks/use-setup-options"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useToast } from "@/hooks/use-toast"
import {
  createAccountsTransaction,
  getAccountsTransactions,
  type AccountsTransaction,
  type AccountsTransactionSummary,
} from "@/services/api/accounts.service"

const categories = ["Room Revenue", "F&B Revenue", "Other Services", "Supplies", "Utilities", "Payroll", "Maintenance", "Marketing"]

const initialForm = {
  type: "Income",
  category: "",
  description: "",
  amount: "",
  paymentMode: "",
  date: new Date().toISOString().slice(0, 10),
  reference: "",
  subCategory: "",
}

function sourceLabel(sourceModule?: string) {
  return sourceModule === "front-office" ? "Front Office" : "Manual"
}

function formatDateTime(value?: string) {
  if (!value) return { date: "-", time: "" }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { date: value, time: "" }
  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value)
}

export default function TransactionsPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedTxn, setSelectedTxn] = useState<AccountsTransaction | null>(null)
  const [transactions, setTransactions] = useState<AccountsTransaction[]>([])
  const [summary, setSummary] = useState<AccountsTransactionSummary>({ totalIncome: 0, totalExpense: 0, netAmount: 0 })
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState(initialForm)
  const paymentModeOptions = useSetupOptions("paymentMode")
  const debouncedSearch = useDebouncedValue(searchQuery, 350)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const result = await getAccountsTransactions({
        search: debouncedSearch,
        type: typeFilter,
        category: categoryFilter,
        sourceModule: sourceFilter,
        page: 1,
        limit: 50,
      })
      setTransactions(result.transactions)
      setSummary(result.summary)
      setTotalCount(result.pagination.total)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load transactions"
      setError(message)
      toast({ title: "Transactions not loaded", description: message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [categoryFilter, debouncedSearch, sourceFilter, toast, typeFilter])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const categoryOptions = useMemo(() => {
    const values = new Set(categories)
    transactions.forEach((transaction) => {
      if (transaction.category) values.add(transaction.category)
    })
    return Array.from(values)
  }, [transactions])

  async function handleCreateTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.category || !form.description || !form.amount) {
      toast({ title: "Missing details", description: "Type, category, description, and amount are required.", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      await createAccountsTransaction({
        type: form.type,
        category: form.category,
        subCategory: form.subCategory || undefined,
        description: form.description,
        amount: Number(form.amount),
        paymentMode: form.paymentMode || undefined,
        date: form.date || undefined,
        reference: form.reference || undefined,
      })
      setForm(initialForm)
      setIsAddOpen(false)
      toast({ title: "Transaction saved", description: "The accounts transaction was recorded." })
      fetchTransactions()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save transaction"
      toast({ title: "Transaction not saved", description: message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">View and manage all financial transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <form onSubmit={handleCreateTransaction}>
                <DialogHeader>
                  <DialogTitle>Add New Transaction</DialogTitle>
                  <DialogDescription>Record a new income or expense transaction</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type *</Label>
                    <Select value={form.type} onValueChange={(type) => setForm((current) => ({ ...current, type }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Income">Income</SelectItem>
                        <SelectItem value="Expense">Expense</SelectItem>
                        <SelectItem value="Transfer">Transfer</SelectItem>
                        <SelectItem value="Refund">Refund</SelectItem>
                        <SelectItem value="Journal">Journal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select value={form.category} onValueChange={(category) => setForm((current) => ({ ...current, category }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Input
                    required
                    placeholder="Transaction description"
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount *</Label>
                    <Input
                      required
                      min="0.01"
                      step="0.01"
                      type="number"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Mode *</Label>
                    <Select value={form.paymentMode} onValueChange={(paymentMode) => setForm((current) => ({ ...current, paymentMode }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentModeOptions.loading ? (
                          <SelectItem value="__loading__" disabled>Loading...</SelectItem>
                        ) : (
                          paymentModeOptions.data.map((mode) => (
                            <SelectItem key={mode._id} value={mode.value}>{mode.value}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Input
                      required
                      type="date"
                      value={form.date}
                      onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reference No.</Label>
                    <Input
                      placeholder="Reference number"
                      value={form.reference}
                      onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Sub Category</Label>
                  <Textarea
                    placeholder="Optional sub category or notes..."
                    rows={2}
                    value={form.subCategory}
                    onChange={(event) => setForm((current) => ({ ...current, subCategory: event.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Transaction"}</Button>
              </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Income</div>
            <div className="text-2xl font-bold text-primary">{formatCurrency(summary.totalIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Expenses</div>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(summary.totalExpense)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Net Balance</div>
            <div className="text-2xl font-bold">{formatCurrency(summary.netAmount)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>{loading ? "Loading transactions..." : `${totalCount} transactions found`}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-8 w-48"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Income">Income</SelectItem>
                  <SelectItem value="Expense">Expense</SelectItem>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                  <SelectItem value="Refund">Refund</SelectItem>
                  <SelectItem value="Journal">Journal</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoryOptions.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Payment Mode</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">Loading transactions...</TableCell>
                </TableRow>
              )}
              {!loading && error && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-destructive">{error}</TableCell>
                </TableRow>
              )}
              {!loading && !error && transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">No transactions found</TableCell>
                </TableRow>
              )}
              {!loading && !error && transactions.map((txn) => {
                const dateTime = formatDateTime(txn.date)
                const isIncome = txn.type === "Income"
                return (
                <TableRow key={txn.id}>
                  <TableCell className="font-medium">{txn.transactionNumber || txn.reference || txn.id.slice(-8)}</TableCell>
                  <TableCell>
                    <div>{dateTime.date}</div>
                    <div className="text-xs text-muted-foreground">{dateTime.time}</div>
                  </TableCell>
                  <TableCell>{txn.description}</TableCell>
                  <TableCell>{txn.category}</TableCell>
                  <TableCell>{txn.paymentMode}</TableCell>
                  <TableCell>
                    <Badge variant={txn.sourceModule === "front-office" ? "secondary" : "outline"}>
                      {sourceLabel(txn.sourceModule)}
                    </Badge>
                  </TableCell>
                  <TableCell className={isIncome ? "text-primary font-medium" : "text-destructive font-medium"}>
                    {isIncome ? "+" : "-"}{formatCurrency(txn.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={txn.status === "completed" ? "default" : "secondary"}>
                      {txn.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTxn(txn)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Transaction Dialog */}
      <Dialog open={!!selectedTxn} onOpenChange={() => setSelectedTxn(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTxn && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Transaction ID</Label>
                  <p className="font-medium">{selectedTxn.transactionNumber || selectedTxn.reference || selectedTxn.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date & Time</Label>
                  <p className="font-medium">{formatDateTime(selectedTxn.date).date} {formatDateTime(selectedTxn.date).time}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="font-medium">{selectedTxn.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <Badge variant={selectedTxn.type === "Income" ? "default" : "destructive"} className="mt-1">
                    {selectedTxn.type.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="font-medium">{selectedTxn.category}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className={`text-xl font-bold ${selectedTxn.type === "Income" ? "text-primary" : "text-destructive"}`}>
                    {formatCurrency(selectedTxn.amount)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Payment Mode</Label>
                  <p className="font-medium">{selectedTxn.paymentMode}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Reference</Label>
                  <p className="font-medium">{selectedTxn.reference}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created By</Label>
                  <p className="font-medium">{selectedTxn.createdBy}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Source</Label>
                <p className="font-medium">{sourceLabel(selectedTxn.sourceModule)}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTxn(null)}>Close</Button>
            <Button>Print Receipt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
