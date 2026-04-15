"use client"

import { useEffect, useState } from "react"
import {
  UserCircle,
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  Globe,
  CreditCard,
  Calendar,
  MoreHorizontal,
  Eye,
  History,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { createStaffGuest, getStaffGuests } from "@/lib/backend-api"
import type { Guest } from "@/lib/types"

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [apiStats, setApiStats] = useState({
    totalGuests: 0,
    repeatGuests: 0,
    totalRevenue: 0,
    avgSpend: 0,
  })
  const [search, setSearch] = useState("")
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    idType: "passport",
    idNumber: "",
    address: "",
    nationality: "",
  })

  useEffect(() => {
    const load = async () => {
      try {
        const response = await getStaffGuests()
        setGuests(response.guests)

        setApiStats({
          totalGuests: Number(response.stats.totalGuests || 0),
          repeatGuests: Number(response.stats.repeatGuests || 0),
          totalRevenue: Number(response.stats.totalRevenue || 0),
          avgSpend: Math.round(Number(response.stats.avgSpend || 0)),
        })
      } catch {
        setGuests([])
      }
    }

    load()
  }, [])

  const filteredGuests = guests.filter((guest) => {
    return guest.name.toLowerCase().includes(search.toLowerCase()) ||
      guest.email.toLowerCase().includes(search.toLowerCase()) ||
      guest.phone.includes(search)
  })

  const handleAddGuest = async () => {
    try {
      await createStaffGuest({
        fullName: formData.name,
        email: formData.email,
        phone: formData.phone,
        idType: formData.idType,
        idNumber: formData.idNumber,
        address: formData.address,
        nationality: formData.nationality,
      })
      const response = await getStaffGuests()
      setGuests(response.guests)
      setApiStats({
        totalGuests: Number(response.stats.totalGuests || 0),
        repeatGuests: Number(response.stats.repeatGuests || 0),
        totalRevenue: Number(response.stats.totalRevenue || 0),
        avgSpend: Math.round(Number(response.stats.avgSpend || 0)),
      })
    } catch {
      return
    }

    setIsAddDialogOpen(false)
    setFormData({
      name: "",
      email: "",
      phone: "",
      idType: "passport",
      idNumber: "",
      address: "",
      nationality: "",
    })
  }

  const stats = {
    totalGuests: apiStats.totalGuests,
    repeatGuests: apiStats.repeatGuests,
    totalRevenue: apiStats.totalRevenue,
    avgSpend: apiStats.avgSpend,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Guest Directory</h1>
          <p className="text-muted-foreground">Manage guest profiles and history</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Guest
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Guest</DialogTitle>
              <DialogDescription>Create a new guest profile</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 555 0100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ID Type</Label>
                  <Select
                    value={formData.idType}
                    onValueChange={(value) => setFormData({ ...formData, idType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="driving-license">Driving License</SelectItem>
                      <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
                      <SelectItem value="other">Other ID</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idNumber">ID Number</Label>
                  <Input
                    id="idNumber"
                    value={formData.idNumber}
                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                    placeholder="AB123456"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main St, City, State"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  placeholder="American"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddGuest}
                  disabled={!formData.name || !formData.email}
                >
                  Add Guest
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <UserCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalGuests}</p>
                <p className="text-sm text-muted-foreground">Total Guests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-lg">
                <History className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.repeatGuests}</p>
                <p className="text-sm text-muted-foreground">Repeat Guests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning/10 rounded-lg">
                <CreditCard className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">${stats.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">${stats.avgSpend}</p>
                <p className="text-sm text-muted-foreground">Avg. Spend</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search guests by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-input"
          />
        </div>
      </div>

      {/* Guest Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredGuests.map((guest) => (
          <Card 
            key={guest.id} 
            className="bg-card border-border hover:border-primary/30 transition-all cursor-pointer"
            onClick={() => setSelectedGuest(guest)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-medium text-primary">
                      {guest.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{guest.name}</p>
                    <p className="text-sm text-muted-foreground">{guest.nationality}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedGuest(guest); }}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Calendar className="mr-2 h-4 w-4" />
                      View History
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate">{guest.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{guest.phone}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Visits</p>
                  <p className="font-medium text-foreground">{guest.visits}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Spent</p>
                  <p className="font-medium text-foreground">${guest.totalSpent.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Guest Detail Dialog */}
      <Dialog open={!!selectedGuest} onOpenChange={() => setSelectedGuest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Guest Profile</DialogTitle>
            <DialogDescription>Complete guest information</DialogDescription>
          </DialogHeader>
          {selectedGuest && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-medium text-primary">
                    {selectedGuest.name.split(" ").map(n => n[0]).join("")}
                  </span>
                </div>
                <div>
                  <p className="text-xl font-medium">{selectedGuest.name}</p>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <span>{selectedGuest.nationality}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{selectedGuest.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">{selectedGuest.phone}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">ID Document</p>
                    <p className="text-sm font-medium">{selectedGuest.idType}: {selectedGuest.idNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="text-sm font-medium">{selectedGuest.address}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
                  <p className="text-3xl font-bold text-primary">{selectedGuest.visits}</p>
                  <p className="text-sm text-muted-foreground">Total Visits</p>
                </div>
                <div className="p-4 rounded-lg bg-success/5 border border-success/20 text-center">
                  <p className="text-3xl font-bold text-success">${selectedGuest.totalSpent.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Lifetime Value</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1">
                  <Calendar className="mr-2 h-4 w-4" />
                  New Reservation
                </Button>
                <Button variant="outline" onClick={() => setSelectedGuest(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
