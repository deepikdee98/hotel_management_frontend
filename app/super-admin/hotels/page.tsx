"use client"

import { useEffect, useState } from "react"
import {
  Building,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Filter,
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
import { Checkbox } from "@/components/ui/checkbox"
import { createSuperAdminHotel, deleteSuperAdminHotel, getSuperAdminHotels, updateSuperAdminHotelStatus, updateSuperAdminHotel } from "@/lib/backend-api"
import { AVAILABLE_MODULES } from "@/lib/types"
import type { Hotel, ModuleType } from "@/lib/types"
import ViewDetailsModal from "@/components/common/ViewDetailsModal"
import EditDetailsModal from "@/components/common/EditDetailsModal"

export default function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [selectedHotel, setSelectedHotel] = useState<any>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedModules, setSelectedModules] = useState<ModuleType[]>([])
  const [selectedEditModules, setSelectedEditModules] = useState<ModuleType[]>([])
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    country: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    roomCount: "",
  })

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSuperAdminHotels()
        setHotels(data)
      } catch {
        setHotels([])
      }
    }

    load()
  }, [])

  const filteredHotels = hotels.filter(
    (hotel) =>
      hotel.name.toLowerCase().includes(search.toLowerCase()) ||
      hotel.city.toLowerCase().includes(search.toLowerCase())
  )

  const handleModuleToggle = (moduleId: ModuleType) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((m) => m !== moduleId) : [...prev, moduleId]
    )
  }

  const handleEditModuleToggle = (moduleId: ModuleType) => {
    setSelectedEditModules((prev) =>
      prev.includes(moduleId) ? prev.filter((m) => m !== moduleId) : [...prev, moduleId]
    )
  }

  const handleAddHotel = async () => {
    try {
      await createSuperAdminHotel({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        totalRooms: parseInt(formData.roomCount) || 0,
        modules: selectedModules,
        adminPassword: formData.password,
        confirmPassword: formData.confirmPassword,
      })

      const refreshed = await getSuperAdminHotels()
      setHotels(refreshed)
    } catch {
      return
    }

    setIsAddDialogOpen(false)
    setFormData({
      name: "",
      address: "",
      city: "",
      country: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      roomCount: "",
    })
    setSelectedModules([])
  }

  const handleDeleteHotel = async (id: string) => {
    try {
      await deleteSuperAdminHotel(id)
      const refreshed = await getSuperAdminHotels()
      setHotels(refreshed)
    } catch {
      return
    }
  }

  const handleToggleStatus = async (id: string) => {
    const current = hotels.find((h) => h.id === id)
    const nextStatus = current?.status === "active" ? "inactive" : "active"

    try {
      await updateSuperAdminHotelStatus(id, nextStatus)
      const refreshed = await getSuperAdminHotels()
      setHotels(refreshed)
    } catch {
      return
    }
  }

  const handleUpdateHotel = async () => {
    try {
      await updateSuperAdminHotel(selectedHotel.id, {
        name: selectedHotel.name,
        email: selectedHotel.email,
        phone: selectedHotel.phone,
        address: selectedHotel.address,
        city: selectedHotel.city,
        country: selectedHotel.country,
        totalRooms: selectedHotel.totalRooms,
        modules: selectedEditModules,
      })

      const refreshed = await getSuperAdminHotels()
      setHotels(refreshed)
      setIsEditOpen(false)
    } catch (error) {
      console.error("Update failed:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hotels</h1>
          <p className="text-muted-foreground">Manage registered hotels and their modules</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Hotel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Register New Hotel</DialogTitle>
              <DialogDescription>Add a new hotel to the system and assign modules</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Hotel Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Grand Hotel"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="info@hotel.com"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="New York"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="USA"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roomCount">Number of Rooms</Label>
                  <Input
                    id="roomCount"
                    type="number"
                    value={formData.roomCount}
                    onChange={(e) => setFormData({ ...formData, roomCount: e.target.value })}
                    placeholder="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Admin Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter admin password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm admin password"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Assign Modules</Label>
                <div className="grid grid-cols-2 gap-3">
                  {AVAILABLE_MODULES.map((module) => (
                    <div
                      key={module.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedModules.includes(module.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                        }`}
                      onClick={() => handleModuleToggle(module.id)}
                    >
                      <Checkbox
                        checked={selectedModules.includes(module.id)}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{module.name}</p>
                        <p className="text-xs text-muted-foreground">{module.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddHotel} disabled={!formData.name || !formData.email || !formData.password || formData.password !== formData.confirmPassword || selectedModules.length === 0}>
                  Register Hotel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search hotels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Hotels Table */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>All Hotels</CardTitle>
          <CardDescription>{filteredHotels.length} hotels registered</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Hotel</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Location</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Rooms</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Modules</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHotels.map((hotel) => (
                  <tr key={hotel.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Building className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{hotel.name}</p>
                          <p className="text-sm text-muted-foreground">{hotel.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-foreground">{hotel.city}</p>
                      <p className="text-sm text-muted-foreground">{hotel.country}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-foreground">{hotel.roomCount}</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {hotel.modules.slice(0, 3).map((module) => (
                          <span
                            key={module}
                            className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full"
                          >
                            {module.replace("-", " ")}
                          </span>
                        ))}
                        {hotel.modules.length > 3 && (
                          <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                            +{hotel.modules.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${hotel.status === "active"
                          ? "bg-success/10 text-success"
                          : hotel.status === "pending"
                            ? "bg-warning/10 text-warning"
                            : "bg-muted text-muted-foreground"
                          }`}
                      >
                        {hotel.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedHotel({ ...hotel, totalRooms: hotel.roomCount })
                              setIsViewOpen(true)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedHotel({ ...hotel, totalRooms: hotel.roomCount })
                              setSelectedEditModules(hotel.modules || [])
                              setIsEditOpen(true)
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Hotel
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(hotel.id)}>
                            {hotel.status === "active" ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteHotel(hotel.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <ViewDetailsModal
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        title="Hotel Details"
        data={
          selectedHotel
            ? [
              { label: "Hotel Name", value: selectedHotel.name },
              { label: "Email", value: selectedHotel.email },
              { label: "Phone", value: selectedHotel.phone },
              {
                label: "Location",
                value: `${selectedHotel.city}, ${selectedHotel.country}`,
              },
              { label: "Rooms", value: selectedHotel.roomCount },
              { label: "Status", value: selectedHotel.status },
              { label: "Modules", value: selectedHotel.modules },
            ]
            : []
        }
      />

      <EditDetailsModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Edit Hotel"
        formData={selectedHotel || {}}
        setFormData={setSelectedHotel}
        fields={[
          { name: "name", label: "Hotel Name" },
          { name: "email", label: "Email" },
          { name: "phone", label: "Phone" },
          { name: "address", label: "Address" },
          { name: "city", label: "City" },
          { name: "country", label: "Country" },
          { name: "totalRooms", label: "Rooms", type: "number" },
        ]}
        onSubmit={handleUpdateHotel}
      >
        <div className="space-y-3 pt-4">
          <div className="text-sm font-medium">Assign Modules</div>
          <div className="grid grid-cols-2 gap-3">
            {AVAILABLE_MODULES.map((module) => (
              <div
                key={module.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedEditModules.includes(module.id)
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
                  }`}
                onClick={() => handleEditModuleToggle(module.id)}
              >
                <Checkbox
                  checked={selectedEditModules.includes(module.id)}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{module.name}</p>
                  <p className="text-xs text-muted-foreground">{module.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </EditDetailsModal>
    </div>
  )
}
