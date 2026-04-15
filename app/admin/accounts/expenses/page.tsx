"use client"

import { useState } from "react"
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

const mockExpenses = [
  { id: "EXP-001", date: "2024-01-15", category: "Utilities", subCategory: "Electricity", description: "Monthly electricity bill", vendor: "City Power Corp", amount: 850.00, approvedBy: "Admin", status: "approved" },
  { id: "EXP-002", date: "2024-01-15", category: "Supplies", subCategory: "Kitchen", description: "Kitchen supplies & groceries", vendor: "Fresh Foods Ltd", amount: 1200.00, approvedBy: "Admin", status: "approved" },
  { id: "EXP-003", date: "2024-01-14", category: "Maintenance", subCategory: "HVAC", description: "AC servicing - all floors", vendor: "ABC Maintenance", amount: 450.00, approvedBy: "Admin", status: "approved" },
  { id: "EXP-004", date: "2024-01-14", category: "Supplies", subCategory: "Housekeeping", description: "Cleaning supplies", vendor: "Clean Pro", amount: 320.00, approvedBy: "Admin", status: "approved" },
  { id: "EXP-005", date: "2024-01-13", category: "Utilities", subCategory: "Water", description: "Monthly water bill", vendor: "Municipal Corp", amount: 280.00, approvedBy: "Admin", status: "approved" },
  { id: "EXP-006", date: "2024-01-13", category: "Marketing", subCategory: "Online Ads", description: "Google Ads - January", vendor: "Google", amount: 500.00, approvedBy: "Admin", status: "pending" },
  { id: "EXP-007", date: "2024-01-12", category: "Repairs", subCategory: "Plumbing", description: "Bathroom repairs - Room 302", vendor: "Quick Fix Plumbers", amount: 180.00, approvedBy: "John Doe", status: "approved" },
]

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
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("")

  const filteredExpenses = mockExpenses.filter((exp) => {
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
                    <Select onValueChange={setSelectedCategory}>
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
                    <Select>
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
                  <Input placeholder="Vendor name" />
                </div>
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Input placeholder="Expense description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount *</Label>
                    <Input type="number" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Input type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Invoice/Bill No.</Label>
                  <Input placeholder="Reference number" />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea placeholder="Additional notes..." rows={2} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button onClick={() => setIsAddOpen(false)}>Save Expense</Button>
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
            <div className="text-2xl font-bold text-destructive">${totalExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>
        {Object.entries(categoryTotals).slice(0, 3).map(([category, total]) => (
          <Card key={category}>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">{category}</div>
              <div className="text-2xl font-bold">${total.toFixed(2)}</div>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.id}</TableCell>
                  <TableCell>{expense.date}</TableCell>
                  <TableCell>
                    <div>{expense.category}</div>
                    <div className="text-xs text-muted-foreground">{expense.subCategory}</div>
                  </TableCell>
                  <TableCell>{expense.vendor}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{expense.description}</TableCell>
                  <TableCell className="font-medium text-destructive">${expense.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={expense.status === "approved" ? "default" : "secondary"}>
                      {expense.status}
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
