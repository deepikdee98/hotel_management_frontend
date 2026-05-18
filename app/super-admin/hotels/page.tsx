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
  EyeOff,
  Filter,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Loader2,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  createSuperAdminHotel, 
  deleteSuperAdminHotel, 
  getSuperAdminHotels, 
  updateSuperAdminHotelStatus, 
  updateSuperAdminHotel,
  extendSuperAdminHotelSubscription,
  toggleSuperAdminHotelActive
} from "@/lib/backend-api"
import { AVAILABLE_MODULES } from "@/lib/types"
import type { Hotel, ModuleType } from "@/lib/types"
import ViewDetailsModal from "@/components/common/ViewDetailsModal"
import EditDetailsModal from "@/components/common/EditDetailsModal"
import { toast } from "sonner"

export default function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [selectedHotel, setSelectedHotel] = useState<any>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<{ id: string, type: 'toggle' | 'extend' } | null>(null)
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [selectedModules, setSelectedModules] = useState<ModuleType[]>([])
  const [selectedEditModules, setSelectedEditModules] = useState<ModuleType[]>([])
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    country: "",
    phone: "",
    email: "",
    adminUsername: "",
    password: "",
    confirmPassword: "",
    roomCount: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const isAdminUsernameValid = /^[a-zA-Z0-9_]{4,}$/.test(formData.adminUsername)

  useEffect(() => {
    loadHotels()
  }, [])

  const loadHotels = async () => {
    try {
      const data = await getSuperAdminHotels()
      setHotels(data)
    } catch {
      setHotels([])
      toast.error("Failed to load hotels")
    }
  }

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
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    try {
      const result = await createSuperAdminHotel({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        totalRooms: parseInt(formData.roomCount) || 0,
        modules: selectedModules,
        adminUsername: formData.adminUsername,
        adminPassword: formData.password,
        confirmPassword: formData.confirmPassword,
      })

      if ((result.accountEmail as { sent?: boolean } | undefined)?.sent) {
        toast.success("Hotel created and account email sent")
      } else {
        toast.warning("Hotel created, but account email was not sent")
      }
      loadHotels()
      setIsAddDialogOpen(false)
      setFormData({
        name: "",
        address: "",
        city: "",
        country: "",
        phone: "",
        email: "",
        adminUsername: "",
        password: "",
        confirmPassword: "",
        roomCount: "",
      })
      setSelectedModules([])
    } catch (error: any) {
      toast.error(error.message || "Failed to create hotel")
    }
  }

  const handleDeleteHotel = async (id: string) => {
    if (!confirm("Are you sure you want to delete this hotel?")) return

    try {
      await deleteSuperAdminHotel(id)
      toast.success("Hotel deleted successfully")
      loadHotels()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete hotel")
    }
  }

  const handleToggleStatus = async (id: string) => {
    const hotel = hotels.find(h => h.id === id)
    if (hotel?.isActive) {
      setPendingAction({ id, type: 'toggle' })
      setIsConfirmDialogOpen(true)
      return
    }
    executeToggleStatus(id)
  }

  const executeToggleStatus = async (id: string) => {
    setLoading(prev => ({ ...prev, [id]: true }))
    try {
      await toggleSuperAdminHotelActive(id)
      toast.success("Hotel status updated")
      loadHotels()
    } catch (error: any) {
      toast.error(error.message || "Failed to update status")
    } finally {
      setLoading(prev => ({ ...prev, [id]: false }))
      setIsConfirmDialogOpen(false)
      setPendingAction(null)
    }
  }

  const handleExtendSubscription = async (id: string) => {
    setLoading(prev => ({ ...prev, [`extend-${id}`]: true }))
    try {
      await extendSuperAdminHotelSubscription(id)
      toast.success("Subscription extended by 1 year")
      loadHotels()
    } catch (error: any) {
      toast.error(error.message || "Failed to extend subscription")
    } finally {
      setLoading(prev => ({ ...prev, [`extend-${id}`]: false }))
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

      toast.success("Hotel updated successfully")
      loadHotels()
      setIsEditOpen(false)
    } catch (error: any) {
      toast.error(error.message || "Update failed")
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const isExpired = (expiryDate: string) => {
    if (!expiryDate) return false
    return new Date(expiryDate) < new Date()
  }

  const getSubscriptionBadgeClass = (status?: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-success/10 text-success"
      case "WARNING":
        return "bg-destructive/10 text-destructive"
      case "GRACE":
        return "bg-warning/10 text-warning"
      case "EXPIRED":
      case "INACTIVE":
        return "bg-destructive/10 text-destructive"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getSubscriptionLabel = (status?: string) => {
    switch (status) {
      case "ACTIVE":
        return "Subscription Active"
      case "WARNING":
        return "Expiring Soon"
      case "GRACE":
        return "Grace Period"
      case "EXPIRED":
        return "Expired"
      case "INACTIVE":
        return "Inactive"
      default:
        return "Unknown"
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
                  <Label htmlFor="adminUsername">Admin Username</Label>
                  <Input
                    id="adminUsername"
                    value={formData.adminUsername}
                    onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })}
                    placeholder="Enter admin username"
                    className={formData.adminUsername && !isAdminUsernameValid ? "border-destructive" : ""}
                  />
                  {formData.adminUsername && !isAdminUsernameValid && (
                    <p className="text-xs text-destructive">Username must be at least 4 characters (letters, numbers, underscores only)</p>
                  )}
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
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter admin password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Confirm admin password"
                      className={`pr-10 ${formData.confirmPassword && formData.password !== formData.confirmPassword ? "border-destructive" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
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
                <Button onClick={handleAddHotel} disabled={!formData.name || !isAdminUsernameValid || !formData.email || !formData.password || !formData.confirmPassword || selectedModules.length === 0}>
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Expiry Date</th>
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
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className={isExpired(hotel.expiryDate) ? "text-destructive font-medium" : "text-foreground"}>
                          {formatDate(hotel.expiryDate)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1.5">
                        <span
                          title={hotel.subscriptionMessage}
                          className={`w-fit px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${getSubscriptionBadgeClass(hotel.subscriptionStatus)}`}
                        >
                          {getSubscriptionLabel(hotel.subscriptionStatus)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={loading[hotel.id]}>
                            {loading[hotel.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
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
                          <DropdownMenuItem 
                            onClick={() => handleExtendSubscription(hotel.id)}
                            disabled={loading[`extend-${hotel.id}`]}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {loading[`extend-${hotel.id}`] ? "Extending..." : "Extend Subscription"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(hotel.id)}>
                            {hotel.isActive ? (
                              <>
                                <ShieldAlert className="mr-2 h-4 w-4 text-destructive" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="mr-2 h-4 w-4 text-success" />
                                Activate
                              </>
                            )}
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

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Hotel?</DialogTitle>
            <DialogDescription>
              This will immediately block all staff and admin access for this hotel. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => pendingAction && executeToggleStatus(pendingAction.id)}>
              Yes, Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              { label: "Active", value: selectedHotel.isActive ? "Yes" : "No" },
              { label: "Expiry Date", value: formatDate(selectedHotel.expiryDate) },
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
