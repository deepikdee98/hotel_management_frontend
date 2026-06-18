"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Plus, Search, Download, TrendingDown } from "lucide-react"
import { createAccountsExpense, getAccountsExpenses, type AccountsExpense } from "@/services/api/accounts.service"
import { useToast } from "@/hooks/use-toast"

function formatCurrency(value: unknown) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function sourceLabel(sourceModule?: string) {
  return sourceModule === "front-office" ? "Front Office" : "Manual"
}

const categories = [
  { name: "Utilities", subCategories: ["Electricity", "Water", "Gas", "Internet"] },
  { name: "Supplies", subCategories: ["Kitchen", "Housekeeping", "Office", "Guest Amenities"] },
  { name: "Maintenance", subCategories: ["HVAC", "Elevator", "General", "Landscaping"] },
  { name: "Repairs", subCategories: ["Plumbing", "Electrical", "Furniture", "Equipment"] },
  { name: "Marketing", subCategories: ["Online Ads", "Print", "Events", "Promotions"] },
  { name: "Insurance", subCategories: ["Property", "Liability", "Vehicle"] },
  { name: "Rent", subCategories: ["Property", "Equipment"] },
]

export default function ExpensesPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedSubCategory, setSelectedSubCategory] = useState("")
  const [expenses, setExpenses] = useState<AccountsExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    vendor: "",
    description: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    billNumber: "",
    notes: "",
  })

  const loadExpenses = async () => {
    setLoading(true)
    try {
      const result = await getAccountsExpenses({ search: searchQuery, category: categoryFilter, sourceModule: sourceFilter, limit: 100 })
      setExpenses(result.expenses)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load expenses"
      toast({ title: "Expenses unavailable", description: message, variant: "destructive" })
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExpenses()
  }, [searchQuery, categoryFilter, sourceFilter])

  const sourceExpenses = expenses

  const filteredExpenses = sourceExpenses.filter((exp) => {
    const matchesSearch = exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.vendor.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || exp.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
  const categoryTotals = filteredExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {} as Record<string, number>)

  const saveExpense = async () => {
    if (!selectedCategory || !form.description || !form.amount) {
      toast({ title: "Missing details", description: "Category, description, and amount are required.", variant: "destructive" })
      return
    }

    try {
      await createAccountsExpense({
        category: selectedCategory,
        subCategory: selectedSubCategory,
        paidTo: form.vendor,
        description: form.description,
        amount: Number(form.amount),
        date: form.date,
        billNumber: form.billNumber,
        notes: form.notes,
      })
      toast({ title: "Expense saved", description: "The expense was recorded." })
      setIsAddOpen(false)
      setSelectedCategory("")
      setSelectedSubCategory("")
      setForm({ vendor: "", description: "", amount: "", date: new Date().toISOString().slice(0, 10), billNumber: "", notes: "" })
      loadExpenses()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save expense"
      toast({ title: "Save failed", description: message, variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">Track and manage all hotel expenses</p>
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
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
                <DialogDescription>Record a new expense entry</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Sub-Category *</Label>
                    <Select value={selectedSubCategory} onValueChange={setSelectedSubCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.find(c => c.name === selectedCategory)?.subCategories.map(sub => (
                          <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Vendor/Supplier *</Label>
                  <Input placeholder="Vendor name" value={form.vendor} onChange={(event) => setForm((current) => ({ ...current, vendor: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Input placeholder="Expense description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount *</Label>
                    <Input type="number" placeholder="0.00" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Invoice/Bill No.</Label>
                  <Input placeholder="Reference number" value={form.billNumber} onChange={(event) => setForm((current) => ({ ...current, billNumber: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea placeholder="Additional notes..." rows={2} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button onClick={saveExpense}>Save Expense</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">Total Expenses</span>
            </div>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</div>
          </CardContent>
        </Card>
        {Object.entries(categoryTotals).slice(0, 3).map(([category, total]) => (
          <Card key={category}>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">{category}</div>
              <div className="text-2xl font-bold">{formatCurrency(total)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Expenses</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-8 w-48"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
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
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Loading expenses...</TableCell>
                </TableRow>
              )}
              {!loading && filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.id}</TableCell>
                  <TableCell>{expense.date}</TableCell>
                  <TableCell>
                    <div>{expense.category}</div>
                    <div className="text-xs text-muted-foreground">{expense.subCategory}</div>
                  </TableCell>
                  <TableCell>{expense.vendor}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{expense.description}</TableCell>
                  <TableCell className="font-medium text-destructive">{formatCurrency(expense.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={expense.status === "approved" ? "default" : "secondary"}>
                      {expense.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={expense.sourceModule === "front-office" ? "secondary" : "outline"}>
                      {sourceLabel(expense.sourceModule)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
