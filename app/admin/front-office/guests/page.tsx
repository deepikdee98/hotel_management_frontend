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
  UserCircle,
  Plus,
  Search,
  Users,
  Star,
  Mail,
  Phone,
} from "lucide-react"

// Guests are loaded from the backend lookup API
import { useEffect } from "react"
import { getLookupGuests } from "@/services/api/setup.service"

export default function AdminGuestsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false)

  const [guests, setGuests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    getLookupGuests().then((data) => {
      if (!mounted) return
      // normalize expected shape if necessary
      const items = Array.isArray(data) ? data.map((g: any) => ({
        id: String(g._id || g.id || g.guestId || ""),
        name: String(g.name || g.fullName || g.guestName || ""),
        email: String(g.email || g.contactEmail || ""),
        phone: String(g.phone || g.contactPhone || g.mobile || ""),
        photo: String(g.guestPhotoUrl || g.avatar || ""),
        visits: Number(g.visits || 0),
        status: String(g.status || "regular"),
        lastVisit: String(g.lastVisit || g.updatedAt || ""),
      })) : []
      setGuests(items)
    }).catch(() => setGuests([])).finally(() => setLoading(false))
    return () => { mounted = false }
  }, [])

  const filteredGuests = guests.filter((guest) => {
    const matchesSearch =
      guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === "all" || guest.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "vip":
        return <Badge className="bg-warning/20 text-warning border-0">VIP</Badge>
      case "regular":
        return <Badge className="bg-primary/20 text-primary border-0">Regular</Badge>
      case "new":
        return <Badge variant="secondary">New</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const stats = {
    total: guests.length,
    vip: guests.filter((g) => g.status === "vip").length,
    regular: guests.filter((g) => g.status === "regular").length,
    new: guests.filter((g) => g.status === "new").length,
  }

  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Guest Management</h1>
            <p className="text-muted-foreground">View and manage guest profiles</p>
          </div>
          <Dialog open={isAddGuestOpen} onOpenChange={setIsAddGuestOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Guest
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Guest</DialogTitle>
                <DialogDescription>Create a new guest profile</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Full Name</Label>
                  <Input placeholder="John Doe" />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="john@email.com" />
                </div>
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input placeholder="+1 234-567-8900" />
                </div>
                <div className="grid gap-2">
                  <Label>ID Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="driving-license">Driving License</SelectItem>
                      <SelectItem value="other">Other ID</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>ID Number</Label>
                  <Input placeholder="ID number" />
                </div>
                <div className="grid gap-2">
                  <Label>Address</Label>
                  <Input placeholder="Full address" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddGuestOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddGuestOpen(false)}>Add Guest</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-chart-2/10">
                <Users className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Guests</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-warning/10">
                <Star className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.vip}</p>
                <p className="text-xs text-muted-foreground">VIP Guests</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <UserCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.regular}</p>
                <p className="text-xs text-muted-foreground">Regular Guests</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-chart-3/10">
                <Plus className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.new}</p>
                <p className="text-xs text-muted-foreground">New Guests</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-foreground">All Guests</CardTitle>
                <CardDescription>Guest directory and profiles</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search guests..."
                    className="pl-8 bg-background"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="text-muted-foreground">Guest ID</TableHead>
                  <TableHead className="text-muted-foreground">Name</TableHead>
                  <TableHead className="text-muted-foreground">Contact</TableHead>
                  <TableHead className="text-muted-foreground">Visits</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Last Visit</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGuests.map((guest) => (
                  <TableRow key={guest.id} className="border-border">
                    <TableCell>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 overflow-hidden">
                        {guest.photo ? (
                          <img 
                            src={guest.photo} 
                            alt={guest.name} 
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user h-4 w-4 text-primary"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                            }}
                          />
                        ) : (
                          <UserCircle className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{guest.id}</TableCell>
                    <TableCell className="text-foreground">{guest.name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {guest.email}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {guest.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">{guest.visits}</TableCell>
                    <TableCell>{getStatusBadge(guest.status)}</TableCell>
                    <TableCell className="text-muted-foreground">{guest.lastVisit}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View Profile
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
