"use client"

import { useState , useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CalendarPlus, Search, Clock, CalendarDays, Loader2 } from "lucide-react"
import { getInHouseGuests, extendCheckout } from "@/lib/backend-api"
import { toast } from "sonner"

export default function ExtendCheckoutPage() {
  const [search, setSearch] = useState("")
  const [isExtendOpen, setIsExtendOpen] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<any | null>(null)
  const [newDate, setNewDate] = useState("")
  const [reason, setReason] = useState("")
  const [extendType, setExtendType] = useState("same-tariff")
  const [guests, setGuests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const filtered = guests.filter((g) =>
    g.guestName.toLowerCase().includes(search.toLowerCase()) ||
    g.roomNumber?.includes(search)
  )

  useEffect(() => {
    loadGuests()
  }, [])

  const loadGuests = async () => {
    setLoading(true)
    try {
      const res = await getInHouseGuests()
      if (res.success) {
        setGuests(res.data.guests)
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to load guests")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmExtension = async () => {
    if (!selectedGuest || !newDate || !extendType) return

    setSubmitting(true)
    try {
      const folioId = selectedGuest.folioId || selectedGuest.id
      const currentCO = new Date(selectedGuest.checkOutDate || selectedGuest.checkOut || selectedGuest.expectedCheckOut)
      const nextCO = new Date(newDate)
      
      const diffTime = nextCO.getTime() - currentCO.getTime()
      const additionalNights = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
      const dailyTariff = Number(selectedGuest.planCharges || 0)
      const additionalTariff = extendType === "complimentary" ? 0 : (additionalNights * dailyTariff)

      const payload = {
        newCheckOutDate: nextCO.toISOString(),
        additionalNights,
        additionalTariff,
        extensionType: extendType,
        reason: reason,
      }

      const res = await extendCheckout(folioId, payload)
      if (res.success) {
        toast.success("Checkout date extended successfully")
        setIsExtendOpen(false)
        loadGuests()
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to extend checkout date")
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (checkOutDate: string) => {
    if (!checkOutDate) return <Badge variant="outline">N/A</Badge>
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const coDate = new Date(checkOutDate)
    coDate.setHours(0, 0, 0, 0)

    if (coDate.getTime() === today.getTime()) {
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Clock className="h-3 w-3 mr-1" />Due Today</Badge>
    } else if (coDate < today) {
      return <Badge variant="destructive">Overdue</Badge>
    } else {
      return <Badge className="bg-primary/10 text-primary border-primary/20">Upcoming</Badge>
    }
  }

  const getStatus = (checkOutDate: string) => {
    if (!checkOutDate) return "unknown"
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const coDate = new Date(checkOutDate)
    coDate.setHours(0, 0, 0, 0)

    if (coDate.getTime() === today.getTime()) return "due-today"
    if (coDate < today) return "overdue"
    return "upcoming"
  }

  const openExtend = (guest: any) => {
    setSelectedGuest(guest)
    const coDate = guest.checkOutDate || guest.checkOut || guest.expectedCheckOut
    if (coDate) {
      const date = new Date(coDate)
      setNewDate(date.toISOString().split("T")[0])
    } else {
      setNewDate("")
    }
    setIsExtendOpen(true)
  }

  const dueTodayCount = guests.filter(g => getStatus(g.checkOutDate || g.checkOut || g.expectedCheckOut) === "due-today").length
  const overdueCount = guests.filter(g => getStatus(g.checkOutDate || g.checkOut || g.expectedCheckOut) === "overdue").length
  const upcomingCount = guests.filter(g => getStatus(g.checkOutDate || g.checkOut || g.expectedCheckOut) === "upcoming").length

  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Extend Checkout Date</h1>
            <p className="text-sm text-muted-foreground">Extend guest checkout dates with tariff adjustments</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Due Today", count: dueTodayCount, color: "text-amber-600" },
            { label: "Overdue", count: overdueCount, color: "text-destructive" },
            { label: "Upcoming", count: upcomingCount, color: "text-primary" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="py-3 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by guest or room..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Guest Name</TableHead>
                    <TableHead>Room Type</TableHead>
                    <TableHead>Current Checkout</TableHead>
                    <TableHead>Daily Tariff</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((g) => (
                    <TableRow key={g._id || g.id}>
                      <TableCell className="font-medium">{g.roomNumber}</TableCell>
                      <TableCell>{g.guestName}</TableCell>
                      <TableCell>{g.roomType?.name || g.type}</TableCell>
                      <TableCell>{g.checkOutDate || g.checkOut || g.expectedCheckOut}</TableCell>
                      <TableCell className="font-medium">₹{(g.planCharges || 0).toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(g.checkOutDate || g.checkOut || g.expectedCheckOut)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => openExtend(g)}>
                          <CalendarPlus className="h-3.5 w-3.5 mr-1.5" />
                          Extend
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No guests found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isExtendOpen} onOpenChange={setIsExtendOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Extend Checkout - Room {selectedGuest?.roomNumber}</DialogTitle>
            </DialogHeader>
            {selectedGuest && (
              <div className="space-y-4 py-2">
                <Card className="bg-muted/50 shadow-none border-none">
                  <CardContent className="py-3 grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Guest:</span> <span className="font-medium">{selectedGuest.guestName}</span></div>
                    <div><span className="text-muted-foreground">Room Type:</span> <span className="font-medium">{selectedGuest.roomType?.name || selectedGuest.type}</span></div>
                    <div><span className="text-muted-foreground">Current Checkout:</span> <span className="font-medium">{selectedGuest.checkOutDate || selectedGuest.checkOut}</span></div>
                    <div><span className="text-muted-foreground">Daily Tariff:</span> <span className="font-medium">₹{(selectedGuest.planCharges || 0).toLocaleString()}</span></div>
                  </CardContent>
                </Card>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Extension Type</Label>
                    <Select value={extendType} onValueChange={setExtendType}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="same-tariff">Same Tariff</SelectItem>
                        <SelectItem value="revised-tariff">Revised Tariff</SelectItem>
                        <SelectItem value="complimentary">Complimentary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>New Checkout Date</Label>
                    <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Reason for Extension</Label>
                  <Textarea placeholder="Reason for extending checkout..." value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsExtendOpen(false)}>Cancel</Button>
              <Button onClick={handleConfirmExtension} disabled={!newDate || !extendType || submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm Extension
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
