"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Package,
  AlertTriangle,
  TrendingDown,
  Boxes,
  Plus,
  Search,
  ShoppingCart,
} from "lucide-react"

// Mock inventory data
const mockInventory = [
  { id: "INV-001", name: "Bath Towels", category: "Linens", quantity: 250, minStock: 100, unit: "pcs", status: "in-stock", lastUpdated: "Jan 15" },
  { id: "INV-002", name: "Shampoo Bottles", category: "Toiletries", quantity: 45, minStock: 50, unit: "bottles", status: "low-stock", lastUpdated: "Jan 14" },
  { id: "INV-003", name: "Bed Sheets (Queen)", category: "Linens", quantity: 180, minStock: 80, unit: "sets", status: "in-stock", lastUpdated: "Jan 13" },
  { id: "INV-004", name: "Coffee Pods", category: "F&B", quantity: 12, minStock: 100, unit: "boxes", status: "critical", lastUpdated: "Jan 15" },
  { id: "INV-005", name: "Hand Soap", category: "Toiletries", quantity: 200, minStock: 100, unit: "bottles", status: "in-stock", lastUpdated: "Jan 12" },
  { id: "INV-006", name: "Pillows", category: "Linens", quantity: 65, minStock: 50, unit: "pcs", status: "in-stock", lastUpdated: "Jan 10" },
  { id: "INV-007", name: "Bottled Water", category: "F&B", quantity: 480, minStock: 200, unit: "bottles", status: "in-stock", lastUpdated: "Jan 15" },
  { id: "INV-008", name: "Toilet Paper", category: "Toiletries", quantity: 38, minStock: 50, unit: "rolls", status: "low-stock", lastUpdated: "Jan 14" },
]

const categories = ["All", "Linens", "Toiletries", "F&B", "Cleaning", "Equipment"]

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState("All")
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)

  const filteredInventory = mockInventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === "All" || item.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in-stock":
        return <Badge className="bg-primary/20 text-primary border-0">In Stock</Badge>
      case "low-stock":
        return <Badge className="bg-warning/20 text-warning border-0">Low Stock</Badge>
      case "critical":
        return <Badge variant="destructive">Critical</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const totalItems = mockInventory.length
  const lowStockItems = mockInventory.filter((i) => i.status === "low-stock").length
  const criticalItems = mockInventory.filter((i) => i.status === "critical").length

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
            <p className="text-muted-foreground">Manage hotel supplies and stock levels</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Create Order
            </Button>
            <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Inventory Item</DialogTitle>
                  <DialogDescription>Add a new item to track in inventory</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Item Name</Label>
                    <Input placeholder="Enter item name" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.slice(1).map((cat) => (
                          <SelectItem key={cat} value={cat.toLowerCase()}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Quantity</Label>
                      <Input type="number" placeholder="0" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Unit</Label>
                      <Input placeholder="pcs, bottles, etc." />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Minimum Stock Level</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddItemOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsAddItemOpen(false)}>Add Item</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
              <Boxes className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalItems}</div>
              <p className="text-xs text-muted-foreground">Items tracked</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
              <TrendingDown className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{lowStockItems}</div>
              <p className="text-xs text-warning">Needs reordering soon</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Critical</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{criticalItems}</div>
              <p className="text-xs text-destructive">Order immediately</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
              <Package className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{categories.length - 1}</div>
              <p className="text-xs text-muted-foreground">Item categories</p>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-foreground">Inventory Items</CardTitle>
                <CardDescription>All tracked supplies and materials</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    className="pl-8 bg-background"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Item ID</TableHead>
                  <TableHead className="text-muted-foreground">Name</TableHead>
                  <TableHead className="text-muted-foreground">Category</TableHead>
                  <TableHead className="text-muted-foreground">Quantity</TableHead>
                  <TableHead className="text-muted-foreground">Min Stock</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Last Updated</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item.id} className="border-border">
                    <TableCell className="font-medium text-foreground">{item.id}</TableCell>
                    <TableCell className="text-foreground">{item.name}</TableCell>
                    <TableCell className="text-foreground">{item.category}</TableCell>
                    <TableCell className="text-foreground">
                      {item.quantity} {item.unit}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.minStock}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-muted-foreground">{item.lastUpdated}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Update
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
