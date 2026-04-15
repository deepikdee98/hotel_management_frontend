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
  CreditCard,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Plus,
  Search,
  Receipt,
  Coffee,
  UtensilsCrossed,
  Wine,
  Sparkles,
  Package,
} from "lucide-react"

// Mock POS data
const mockOrders = [
  { id: "ORD-001", room: "101", guest: "John Smith", items: 3, total: 45.50, status: "completed", time: "10:30 AM" },
  { id: "ORD-002", room: "205", guest: "Emma Wilson", items: 2, total: 28.00, status: "pending", time: "11:15 AM" },
  { id: "ORD-003", room: "302", guest: "Michael Brown", items: 5, total: 89.75, status: "completed", time: "12:00 PM" },
  { id: "ORD-004", room: "118", guest: "Sarah Davis", items: 1, total: 15.00, status: "in-progress", time: "12:30 PM" },
  { id: "ORD-005", room: "401", guest: "Robert Johnson", items: 4, total: 62.25, status: "completed", time: "1:00 PM" },
]

const menuCategories = [
  { id: "food", name: "Food", icon: UtensilsCrossed, items: 24 },
  { id: "beverages", name: "Beverages", icon: Coffee, items: 18 },
  { id: "bar", name: "Bar & Spirits", icon: Wine, items: 32 },
  { id: "spa", name: "Spa Services", icon: Sparkles, items: 12 },
  { id: "minibar", name: "Minibar", icon: Package, items: 15 },
]

const menuItems = [
  { id: 1, name: "Club Sandwich", category: "food", price: 18.50 },
  { id: 2, name: "Caesar Salad", category: "food", price: 14.00 },
  { id: 3, name: "Grilled Salmon", category: "food", price: 32.00 },
  { id: 4, name: "Cappuccino", category: "beverages", price: 5.50 },
  { id: 5, name: "Fresh Orange Juice", category: "beverages", price: 7.00 },
  { id: 6, name: "Mojito", category: "bar", price: 12.00 },
  { id: 7, name: "Red Wine (Glass)", category: "bar", price: 15.00 },
  { id: 8, name: "Swedish Massage", category: "spa", price: 85.00 },
]

export default function POSPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("food")
  const [cart, setCart] = useState<{ id: number; name: string; price: number; qty: number }[]>([])
  const [selectedRoom, setSelectedRoom] = useState("")

  const filteredOrders = mockOrders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.guest.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.room.includes(searchQuery)
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-primary/20 text-primary border-0">Completed</Badge>
      case "pending":
        return <Badge className="bg-warning/20 text-warning border-0">Pending</Badge>
      case "in-progress":
        return <Badge className="bg-chart-2/20 text-chart-2 border-0">In Progress</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const addToCart = (item: { id: number; name: string; price: number }) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i))
      }
      return [...prev, { ...item, qty: 1 }]
    })
  }

  const removeFromCart = (itemId: number) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId))
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0)

  const filteredMenuItems = menuItems.filter((item) => item.category === selectedCategory)

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Point of Sale</h1>
            <p className="text-muted-foreground">Manage orders and billing for hotel services</p>
          </div>
          <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
                <DialogDescription>Add items and charge to room or process payment</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-4">
                {/* Menu Categories & Items */}
                <div className="col-span-2 space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    {menuCategories.map((cat) => {
                      const Icon = cat.icon
                      return (
                        <Button
                          key={cat.id}
                          variant={selectedCategory === cat.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedCategory(cat.id)}
                        >
                          <Icon className="mr-2 h-4 w-4" />
                          {cat.name}
                        </Button>
                      )
                    })}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {filteredMenuItems.map((item) => (
                      <Button
                        key={item.id}
                        variant="outline"
                        className="h-auto py-3 justify-between bg-transparent"
                        onClick={() => addToCart(item)}
                      >
                        <span>{item.name}</span>
                        <span className="text-muted-foreground">${item.price.toFixed(2)}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Cart */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold">Order Summary</h3>
                  <div className="space-y-2">
                    <Label>Room Number</Label>
                    <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="101">Room 101 - John Smith</SelectItem>
                        <SelectItem value="205">Room 205 - Emma Wilson</SelectItem>
                        <SelectItem value="302">Room 302 - Michael Brown</SelectItem>
                        <SelectItem value="118">Room 118 - Sarah Davis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {cart.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No items added</p>
                    ) : (
                      cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span>
                            {item.name} x{item.qty}
                          </span>
                          <div className="flex items-center gap-2">
                            <span>${(item.price * item.qty).toFixed(2)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-destructive"
                              onClick={() => removeFromCart(item.id)}
                            >
                              &times;
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewOrderOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  disabled={cart.length === 0 || !selectedRoom}
                >
                  Charge to Room
                </Button>
                <Button disabled={cart.length === 0}>
                  Process Payment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today's Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">$2,456.50</div>
              <p className="text-xs text-primary">+18% from yesterday</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">47</div>
              <p className="text-xs text-muted-foreground">12 pending</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Order Value</CardTitle>
              <Receipt className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">$52.25</div>
              <p className="text-xs text-primary">+5% from last week</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Room Charges</CardTitle>
              <CreditCard className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">$1,845.00</div>
              <p className="text-xs text-muted-foreground">32 transactions</p>
            </CardContent>
          </Card>
        </div>

        {/* Categories */}
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {menuCategories.map((cat) => {
            const Icon = cat.icon
            return (
              <Card key={cat.id} className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">{cat.items} items</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Orders Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-foreground">Recent Orders</CardTitle>
                <CardDescription>Today's orders and their status</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  className="pl-8 bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Order ID</TableHead>
                  <TableHead className="text-muted-foreground">Room</TableHead>
                  <TableHead className="text-muted-foreground">Guest</TableHead>
                  <TableHead className="text-muted-foreground">Items</TableHead>
                  <TableHead className="text-muted-foreground">Total</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Time</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} className="border-border">
                    <TableCell className="font-medium text-foreground">{order.id}</TableCell>
                    <TableCell className="text-foreground">{order.room}</TableCell>
                    <TableCell className="text-foreground">{order.guest}</TableCell>
                    <TableCell className="text-foreground">{order.items}</TableCell>
                    <TableCell className="text-foreground">${order.total.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-muted-foreground">{order.time}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View
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
