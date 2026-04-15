"use client"

import { useState } from "react"
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
import { Plus, Search, Download, Filter, Eye } from "lucide-react"

const mockTransactions = [
  { id: "TXN-001", date: "2024-01-15", time: "14:30", description: "Room 101 - Checkout Payment", type: "income", category: "Room Revenue", paymentMode: "Credit Card", reference: "CC-4521", amount: 450.00, status: "completed", createdBy: "John Doe" },
  { id: "TXN-002", date: "2024-01-15", time: "13:15", description: "Restaurant Bill - Table 5", type: "income", category: "F&B Revenue", paymentMode: "Cash", reference: "CASH-112", amount: 85.50, status: "completed", createdBy: "Jane Smith" },
  { id: "TXN-003", date: "2024-01-15", time: "11:00", description: "Laundry Supplies Purchase", type: "expense", category: "Supplies", paymentMode: "Bank Transfer", reference: "BT-8834", amount: 120.00, status: "completed", createdBy: "Admin" },
  { id: "TXN-004", date: "2024-01-14", time: "16:45", description: "Room 205 - Checkout Payment", type: "income", category: "Room Revenue", paymentMode: "UPI", reference: "UPI-9982", amount: 380.00, status: "completed", createdBy: "John Doe" },
  { id: "TXN-005", date: "2024-01-14", time: "10:00", description: "Monthly Electricity Bill", type: "expense", category: "Utilities", paymentMode: "Bank Transfer", reference: "BT-8821", amount: 850.00, status: "pending", createdBy: "Admin" },
  { id: "TXN-006", date: "2024-01-14", time: "15:30", description: "Spa Services - Guest 302", type: "income", category: "Other Services", paymentMode: "Cash", reference: "CASH-109", amount: 200.00, status: "completed", createdBy: "Sarah Lee" },
  { id: "TXN-007", date: "2024-01-13", time: "09:00", description: "Staff Salary - January", type: "expense", category: "Payroll", paymentMode: "Bank Transfer", reference: "BT-8800", amount: 15000.00, status: "completed", createdBy: "Admin" },
  { id: "TXN-008", date: "2024-01-13", time: "12:00", description: "Room 402 - Advance Payment", type: "income", category: "Room Revenue", paymentMode: "Credit Card", reference: "CC-4519", amount: 500.00, status: "completed", createdBy: "John Doe" },
]

const categories = ["Room Revenue", "F&B Revenue", "Other Services", "Supplies", "Utilities", "Payroll", "Maintenance", "Marketing"]
const paymentModes = ["Cash", "Credit Card", "Debit Card", "UPI", "Bank Transfer", "Cheque"]

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedTxn, setSelectedTxn] = useState<typeof mockTransactions[0] | null>(null)

  const filteredTransactions = mockTransactions.filter((txn) => {
    const matchesSearch = txn.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || txn.type === typeFilter
    const matchesCategory = categoryFilter === "all" || txn.category === categoryFilter
    return matchesSearch && matchesType && matchesCategory
  })

  const totalIncome = filteredTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = filteredTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

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
              <DialogHeader>
                <DialogTitle>Add New Transaction</DialogTitle>
                <DialogDescription>Record a new income or expense transaction</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Input placeholder="Transaction description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount *</Label>
                    <Input type="number" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Mode *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentModes.map(mode => (
                          <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Reference No.</Label>
                    <Input placeholder="Reference number" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Remarks</Label>
                  <Textarea placeholder="Additional notes..." rows={2} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button onClick={() => setIsAddOpen(false)}>Save Transaction</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Income</div>
            <div className="text-2xl font-bold text-primary">${totalIncome.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Expenses</div>
            <div className="text-2xl font-bold text-destructive">${totalExpense.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Net Balance</div>
            <div className="text-2xl font-bold">${(totalIncome - totalExpense).toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>{filteredTransactions.length} transactions found</CardDescription>
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
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
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
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="font-medium">{txn.id}</TableCell>
                  <TableCell>
                    <div>{txn.date}</div>
                    <div className="text-xs text-muted-foreground">{txn.time}</div>
                  </TableCell>
                  <TableCell>{txn.description}</TableCell>
                  <TableCell>{txn.category}</TableCell>
                  <TableCell>{txn.paymentMode}</TableCell>
                  <TableCell className={txn.type === "income" ? "text-primary font-medium" : "text-destructive font-medium"}>
                    {txn.type === "income" ? "+" : "-"}${txn.amount.toFixed(2)}
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
              ))}
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
                  <p className="font-medium">{selectedTxn.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date & Time</Label>
                  <p className="font-medium">{selectedTxn.date} {selectedTxn.time}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="font-medium">{selectedTxn.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <Badge variant={selectedTxn.type === "income" ? "default" : "destructive"} className="mt-1">
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
                  <p className={`text-xl font-bold ${selectedTxn.type === "income" ? "text-primary" : "text-destructive"}`}>
                    ${selectedTxn.amount.toFixed(2)}
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
