"use client"

import { useEffect, useState } from "react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { createPOSOrder, getInHouseGuests, getPOSItems, getPOSOrders, processPOSPayment } from "@/lib/backend-api"
import type { POSItem, POSOrder } from "@/lib/types"
import {
  AlertCircle,
  CheckCircle2,
  Coffee,
  CreditCard,
  DollarSign,
  Loader2,
  Package,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Sparkles,
  UtensilsCrossed,
  Wine,
} from "lucide-react"

type CartItem = {
  id: string
  name: string
  price: number
  qty: number
}

type InHouseGuest = {
  folioId: string
  guestName: string
  roomNumber: string
}

const PAYMENT_MODES = ["Cash", "Card", "UPI", "Bank Transfer"] as const

function getCategoryIcon(category: string) {
  const normalized = category.toLowerCase()

  if (normalized.includes("food") || normalized.includes("restaurant") || normalized.includes("kitchen")) {
    return UtensilsCrossed
  }
  if (normalized.includes("coffee") || normalized.includes("tea") || normalized.includes("beverage")) {
    return Coffee
  }
  if (normalized.includes("bar") || normalized.includes("wine") || normalized.includes("spirit")) {
    return Wine
  }
  if (normalized.includes("spa") || normalized.includes("wellness")) {
    return Sparkles
  }
  return Package
}

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`
}

function formatOrderTime(value: string) {
  if (!value) return "-"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

export default function POSPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedRoom, setSelectedRoom] = useState("")
  const [paymentMode, setPaymentMode] = useState<(typeof PAYMENT_MODES)[number]>("Cash")
  const [menuItems, setMenuItems] = useState<POSItem[]>([])
  const [orders, setOrders] = useState<POSOrder[]>([])
  const [inHouseGuests, setInHouseGuests] = useState<InHouseGuest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<"room" | "payment" | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPOSData()
  }, [])

  const loadPOSData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [itemsData, ordersData, inHouseData] = await Promise.all([
        getPOSItems(),
        getPOSOrders(),
        getInHouseGuests(),
      ])

      setMenuItems(itemsData.filter((item) => item.status !== "inactive"))
      setOrders(ordersData)
      setInHouseGuests(
        (inHouseData.data?.guests || [])
          .map((guest: any) => ({
            folioId: String(guest.folioId || ""),
            guestName: String(guest.guestName || "Guest"),
            roomNumber: String(guest.roomNumber || ""),
          }))
          .filter((guest: InHouseGuest) => guest.folioId && guest.roomNumber)
      )
    } catch (err: any) {
      const message = err.message || "Failed to load POS data"
      setError(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase()
    const orderNumber = order.orderNumber.toLowerCase()
    const guestName = (order.guestName || "").toLowerCase()
    const roomNumber = order.roomNumber || ""

    return orderNumber.includes(query) || guestName.includes(query) || roomNumber.includes(searchQuery)
  })

  const categories = [
    { id: "all", name: "All Items", icon: Package, items: menuItems.length },
    ...Array.from(new Set(menuItems.map((item) => item.category).filter(Boolean))).map((category) => ({
      id: category,
      name: category,
      icon: getCategoryIcon(category),
      items: menuItems.filter((item) => item.category === category).length,
    })),
  ]

  const filteredMenuItems = menuItems.filter((item) => selectedCategory === "all" || item.category === selectedCategory)

  const todaysRevenue = orders.reduce((sum, order) => sum + order.grandTotal, 0)
  const totalOrders = orders.length
  const averageOrderValue = totalOrders > 0 ? todaysRevenue / totalOrders : 0
  const roomChargeOrders = orders.filter((order) => order.folioId || order.roomNumber)
  const roomChargeRevenue = roomChargeOrders.reduce((sum, order) => sum + order.grandTotal, 0)
  const openOrders = orders.filter((order) => order.status === "open").length

  const addToCart = (item: POSItem) => {
    setCart((prev) => {
      const existing = prev.find((cartItem) => cartItem.id === item.id)
      if (existing) {
        return prev.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, qty: cartItem.qty + 1 } : cartItem
        )
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }]
    })
  }

  const updateCartQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === itemId ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    )
  }

  const resetOrderForm = () => {
    setCart([])
    setSelectedRoom("")
    setPaymentMode("Cash")
  }

  const submitOrder = async (mode: "room" | "payment") => {
    if (cart.length === 0) return
    if (mode === "room" && !selectedRoom) {
      toast({
        title: "Room required",
        description: "Select an in-house room before charging the order.",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(mode)

      const orderResponse = await createPOSOrder({
        items: cart.map((item) => ({
          itemId: item.id,
          quantity: item.qty,
        })),
        ...(mode === "room" ? { folioId: selectedRoom } : { tableNo: "Walk-in" }),
      })

      const orderId = String(orderResponse.data?._id || orderResponse.data?.id || "")

      if (mode === "payment") {
        if (!orderId) {
          throw new Error("Order created but payment could not be processed.")
        }

        await processPOSPayment(orderId, {
          amount: cart.reduce((sum, item) => sum + item.price * item.qty, 0),
          paymentMode,
        })
      }

      await loadPOSData()
      resetOrderForm()
      setIsNewOrderOpen(false)

      toast({
        title: mode === "room" ? "Charged to room" : "Payment processed",
        description:
          mode === "room"
            ? "The POS order has been posted to the guest folio."
            : `The order has been paid using ${paymentMode}.`,
      })
    } catch (err: any) {
      toast({
        title: "Unable to create order",
        description: err.message || "Something went wrong while saving the POS order.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(null)
    }
  }

  const getStatusBadge = (status: POSOrder["status"]) => {
    switch (status) {
      case "closed":
        return <Badge className="bg-primary/20 text-primary border-0">Completed</Badge>
      case "open":
        return <Badge className="bg-warning/20 text-warning border-0">Open</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0)

  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
      <div className="space-y-6">
        {error && (
          <Alert className="border-destructive/50 bg-destructive/10">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Point of Sale</h1>
            <p className="text-muted-foreground">Manage orders and billing for hotel services</p>
          </div>
          <Dialog
            open={isNewOrderOpen}
            onOpenChange={(open) => {
              setIsNewOrderOpen(open)
              if (!open) resetOrderForm()
            }}
          >
            <DialogTrigger asChild>
              <Button disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
                <DialogDescription>Add items and charge to room or process payment</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                  <div className="flex gap-2 flex-wrap">
                    {categories.map((category) => {
                      const Icon = category.icon
                      return (
                        <Button
                          key={category.id}
                          variant={selectedCategory === category.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedCategory(category.id)}
                        >
                          <Icon className="mr-2 h-4 w-4" />
                          {category.name}
                        </Button>
                      )
                    })}
                  </div>
                  {filteredMenuItems.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                      No active menu items available.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {filteredMenuItems.map((item) => (
                        <Button
                          key={item.id}
                          variant="outline"
                          className="h-auto py-3 justify-between bg-transparent"
                          onClick={() => addToCart(item)}
                        >
                          <span className="text-left">
                            <span className="block">{item.name}</span>
                            <span className="block text-xs text-muted-foreground">{item.category}</span>
                          </span>
                          <span className="text-muted-foreground">{formatCurrency(item.price)}</span>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold">Order Summary</h3>
                  <div className="space-y-2">
                    <Label>Room Number</Label>
                    <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select in-house room" />
                      </SelectTrigger>
                      <SelectContent>
                        {inHouseGuests.length === 0 ? (
                          <SelectItem value="__no_rooms__" disabled>
                            No in-house rooms available
                          </SelectItem>
                        ) : (
                          inHouseGuests.map((guest) => (
                            <SelectItem key={guest.folioId} value={guest.folioId}>
                              Room {guest.roomNumber} - {guest.guestName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Mode</Label>
                    <Select value={paymentMode} onValueChange={(value) => setPaymentMode(value as (typeof PAYMENT_MODES)[number])}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment mode" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_MODES.map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {mode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {cart.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No items added</p>
                    ) : (
                      cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm gap-3">
                          <div>
                            <p>{item.name}</p>
                            <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} each</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => updateCartQty(item.id, -1)}
                            >
                              -
                            </Button>
                            <span className="w-5 text-center">{item.qty}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => updateCartQty(item.id, 1)}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewOrderOpen(false)} disabled={submitting !== null}>
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  disabled={cart.length === 0 || !selectedRoom || submitting !== null}
                  onClick={() => submitOrder("room")}
                >
                  {submitting === "room" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Charge to Room
                </Button>
                <Button disabled={cart.length === 0 || submitting !== null} onClick={() => submitOrder("payment")}>
                  {submitting === "payment" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Process Payment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-3 py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-muted-foreground">Loading POS data...</span>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Today's Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{formatCurrency(todaysRevenue)}</div>
                  <p className="text-xs text-primary">Live POS order total</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-chart-2" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{totalOrders}</div>
                  <p className="text-xs text-muted-foreground">{openOrders} open orders</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg Order Value</CardTitle>
                  <Receipt className="h-4 w-4 text-chart-3" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{formatCurrency(averageOrderValue)}</div>
                  <p className="text-xs text-primary">Based on current order history</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Room Charges</CardTitle>
                  <CreditCard className="h-4 w-4 text-chart-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{formatCurrency(roomChargeRevenue)}</div>
                  <p className="text-xs text-muted-foreground">{roomChargeOrders.length} room-posted orders</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {categories.map((category) => {
                const Icon = category.icon
                return (
                  <Card
                    key={category.id}
                    className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{category.name}</p>
                        <p className="text-xs text-muted-foreground">{category.items} items</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-foreground">Recent Orders</CardTitle>
                    <CardDescription>Live POS orders from the backend</CardDescription>
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
                      <TableHead className="text-muted-foreground text-right">Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No POS orders found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order) => (
                        <TableRow key={order.id} className="border-border">
                          <TableCell className="font-medium text-foreground">{order.orderNumber || order.id}</TableCell>
                          <TableCell className="text-foreground">{order.roomNumber || "-"}</TableCell>
                          <TableCell className="text-foreground">{order.guestName || "Walk-in"}</TableCell>
                          <TableCell className="text-foreground">
                            {order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)}
                          </TableCell>
                          <TableCell className="text-foreground">{formatCurrency(order.grandTotal)}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell className="text-muted-foreground">{formatOrderTime(order.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm text-muted-foreground">{order.paymentMode || "-"}</span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}

        {!loading && !error && orders.length > 0 && (
          <Alert className="border-green-500/40 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              POS is now using live menu items, orders, and in-house folios from the backend API.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </DashboardLayout>
  )
}
