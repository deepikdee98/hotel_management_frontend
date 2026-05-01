"use client"

import { useState } from "react"
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
import { CalendarCheck, Search, Plus, MapPin, Users, Clock } from "lucide-react"
import { useSetupOptions } from "@/hooks/use-setup-options"

const MOCK_EVENTS = [
  { id: 1, name: "Wedding Reception - Sharma Family", venue: "Grand Ballroom", date: "2024-12-25", time: "18:00 - 23:00", pax: 250, contact: "Raj Sharma", phone: "+91 98765 43210", status: "confirmed", type: "Wedding", amount: 350000 },
  { id: 2, name: "Corporate Conference - TechCorp", venue: "Conference Hall A", date: "2024-12-23", time: "09:00 - 17:00", pax: 80, contact: "Priya Patel", phone: "+91 87654 32109", status: "tentative", type: "Conference", amount: 85000 },
  { id: 3, name: "Birthday Party - Gupta", venue: "Banquet Hall B", date: "2024-12-28", time: "19:00 - 22:00", pax: 50, contact: "Amit Gupta", phone: "+91 76543 21098", status: "confirmed", type: "Party", amount: 45000 },
  { id: 4, name: "Annual Gala Dinner", venue: "Rooftop Terrace", date: "2024-12-31", time: "20:00 - 01:00", pax: 150, contact: "Hotel Events", phone: "+91 12345 67890", status: "planning", type: "Gala", amount: 500000 },
]

export default function EventsPage() {
  const paymentModeOptions = useSetupOptions("paymentMode")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "", venue: "", date: "", startTime: "", endTime: "", pax: "", contact: "", phone: "", email: "", type: "", description: "", mealPlan: "", decorations: "", specialRequirements: "", advanceAmount: "", paymentMode: "",
  })

  const filtered = MOCK_EVENTS.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.venue.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || e.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed": return <Badge className="bg-primary/10 text-primary border-primary/20">Confirmed</Badge>
      case "tentative": return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Tentative</Badge>
      case "planning": return <Badge variant="secondary">Planning</Badge>
      case "cancelled": return <Badge variant="destructive">Cancelled</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const totalRevenue = MOCK_EVENTS.filter((e) => e.status !== "cancelled").reduce((sum, e) => sum + e.amount, 0)

  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Events & Plan</h1>
            <p className="text-sm text-muted-foreground">Manage hotel events, banquets, and function bookings</p>
          </div>
          <Button onClick={() => setIsNewOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Events", value: MOCK_EVENTS.length, icon: CalendarCheck },
            { label: "Confirmed", value: MOCK_EVENTS.filter((e) => e.status === "confirmed").length, icon: CalendarCheck },
            { label: "Total PAX", value: MOCK_EVENTS.reduce((sum, e) => sum + e.pax, 0), icon: Users },
            { label: "Revenue", value: `$${(totalRevenue / 1000).toFixed(0)}K`, icon: Clock },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="py-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="tentative">Tentative</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>PAX</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{e.name}</p>
                        <p className="text-xs text-muted-foreground">{e.type}</p>
                      </div>
                    </TableCell>
                    <TableCell><div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{e.venue}</div></TableCell>
                    <TableCell>{e.date}</TableCell>
                    <TableCell className="text-sm">{e.time}</TableCell>
                    <TableCell>{e.pax}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{e.contact}</p>
                        <p className="text-xs text-muted-foreground">{e.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">${e.amount.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(e.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Event Booking</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Event Name</Label>
                  <Input placeholder="e.g. Wedding Reception - Sharma" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wedding">Wedding</SelectItem>
                      <SelectItem value="conference">Conference</SelectItem>
                      <SelectItem value="party">Party</SelectItem>
                      <SelectItem value="seminar">Seminar</SelectItem>
                      <SelectItem value="gala">Gala</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Venue</Label>
                  <Select value={formData.venue} onValueChange={(v) => setFormData({ ...formData, venue: v })}>
                    <SelectTrigger><SelectValue placeholder="Select venue" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grand-ballroom">Grand Ballroom</SelectItem>
                      <SelectItem value="conference-a">Conference Hall A</SelectItem>
                      <SelectItem value="conference-b">Conference Hall B</SelectItem>
                      <SelectItem value="banquet-a">Banquet Hall A</SelectItem>
                      <SelectItem value="banquet-b">Banquet Hall B</SelectItem>
                      <SelectItem value="rooftop">Rooftop Terrace</SelectItem>
                      <SelectItem value="garden">Garden Area</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Expected PAX</Label>
                  <Input type="number" placeholder="Number of guests" value={formData.pax} onChange={(e) => setFormData({ ...formData, pax: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} />
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Contact Details</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Contact Person</Label>
                    <Input placeholder="Full name" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input placeholder="+91 XXXXX XXXXX" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" placeholder="email@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Event Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Meal Plan</Label>
                    <Select value={formData.mealPlan} onValueChange={(v) => setFormData({ ...formData, mealPlan: v })}>
                      <SelectTrigger><SelectValue placeholder="Select meal plan" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="breakfast">Breakfast Only</SelectItem>
                        <SelectItem value="lunch">Lunch Only</SelectItem>
                        <SelectItem value="dinner">Dinner Only</SelectItem>
                        <SelectItem value="lunch-dinner">Lunch + Dinner</SelectItem>
                        <SelectItem value="full-day">Full Day Meals</SelectItem>
                        <SelectItem value="cocktail">Cocktail & Snacks</SelectItem>
                        <SelectItem value="none">No Meals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Decorations</Label>
                    <Select value={formData.decorations} onValueChange={(v) => setFormData({ ...formData, decorations: v })}>
                      <SelectTrigger><SelectValue placeholder="Select package" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label>Special Requirements</Label>
                  <Textarea placeholder="Any special requests, AV equipment, seating arrangements..." value={formData.specialRequirements} onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })} />
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Payment</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Advance Amount</Label>
                    <Input type="number" placeholder="0.00" value={formData.advanceAmount} onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Mode</Label>
                    <Select value={formData.paymentMode} onValueChange={(v) => setFormData({ ...formData, paymentMode: v })}>
                      <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                      <SelectContent>
                        {paymentModeOptions.loading ? <SelectItem value="__loading__" disabled>Loading...</SelectItem> : paymentModeOptions.data.map(p => <SelectItem key={p._id} value={p.value}>{p.value}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewOpen(false)}>Cancel</Button>
              <Button disabled={!formData.name || !formData.venue || !formData.date}>Book Event</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
