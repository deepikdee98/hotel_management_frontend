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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  createSuperAdminHotel,
  deleteSuperAdminHotel,
  getSuperAdminHotels,
	  updateSuperAdminHotelStatus,
	  updateSuperAdminHotel,
	  extendSuperAdminHotelSubscription,
	  toggleSuperAdminHotelActive,
	  convertSuperAdminHotelToChain
	} from "@/lib/backend-api"
import { AVAILABLE_MODULES } from "@/lib/types"
import type { Hotel, ModuleType } from "@/lib/types"
import ViewDetailsModal from "@/components/common/ViewDetailsModal"
import EditDetailsModal from "@/components/common/EditDetailsModal"
import { toast } from "sonner"

const usernamePattern = /^[a-zA-Z0-9_]{4,}$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const normalizeText = (value: string) => value.trim().toLowerCase()
const normalizePhone = (value: string) => value.replace(/[^\d+]/g, "")

export default function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [selectedHotel, setSelectedHotel] = useState<any>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<{ id: string, type: 'toggle' | 'extend' } | null>(null)
  const [conversionHotel, setConversionHotel] = useState<Hotel | null>(null)
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [isCreatingHotel, setIsCreatingHotel] = useState(false)
  const [createHotelError, setCreateHotelError] = useState("")
  const [isConvertingHotel, setIsConvertingHotel] = useState(false)
  const [convertHotelError, setConvertHotelError] = useState("")
  const [selectedModules, setSelectedModules] = useState<ModuleType[]>([])
  const [selectedEditModules, setSelectedEditModules] = useState<ModuleType[]>([])
  const [creationMode, setCreationMode] = useState<"standalone" | "chain">("standalone")
  const [formData, setFormData] = useState({
	    chainName: "",
	    subscriptionPlan: "Standard",
	    maxAllowedProperties: "5",
	    companyAdminUsername: "",
    companyAdminEmail: "",
    companyAdminPhone: "",
    companyAdminPassword: "",
    companyAdminConfirmPassword: "",
    name: "",
    propertyCode: "",
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
  const [convertFormData, setConvertFormData] = useState({
    companyName: "",
    companyAdminName: "",
    companyAdminEmail: "",
    companyAdminPhone: "",
    companyAdminPassword: "",
    subscriptionPlan: "Standard",
    maxAllowedProperties: "5",
  })
  const isAdminUsernameValid = usernamePattern.test(formData.adminUsername.trim())
  const isCompanyAdminUsernameValid = usernamePattern.test(formData.companyAdminUsername.trim())
  const isEmailValid = emailPattern.test(formData.email.trim())
  const isCompanyAdminEmailValid = emailPattern.test(formData.companyAdminEmail.trim())
  const phoneDigits = normalizePhone(formData.phone)
  const companyAdminPhoneDigits = normalizePhone(formData.companyAdminPhone)
  const isPhoneValid = phoneDigits.length >= 7 && phoneDigits.length <= 15
  const isCompanyAdminPhoneValid = companyAdminPhoneDigits.length >= 7 && companyAdminPhoneDigits.length <= 15
  const isDuplicateHotelEmail = Boolean(formData.email.trim()) && hotels.some((hotel) =>
    normalizeText(hotel.email) === normalizeText(formData.email)
  )
  const isDuplicateHotelPhone = Boolean(formData.phone.trim()) && hotels.some((hotel) =>
    normalizePhone(hotel.phone) === phoneDigits
  )
  const doPasswordsMatch = formData.password === formData.confirmPassword
  const doCompanyAdminPasswordsMatch = formData.companyAdminPassword === formData.companyAdminConfirmPassword
  const hasMatchingAdminAccountField =
    (Boolean(formData.companyAdminUsername.trim()) && normalizeText(formData.companyAdminUsername) === normalizeText(formData.adminUsername)) ||
    (Boolean(formData.companyAdminEmail.trim()) && normalizeText(formData.companyAdminEmail) === normalizeText(formData.email)) ||
    (Boolean(formData.companyAdminPhone.trim()) && normalizePhone(formData.companyAdminPhone) === normalizePhone(formData.phone))
  const areAdminAccountsDifferent =
    !hasMatchingAdminAccountField
  const isChainCreation = creationMode === "chain"
  const isAddHotelFormValid =
    (!isChainCreation ||
      (
	        Boolean(formData.chainName.trim()) &&
	        Boolean(formData.subscriptionPlan.trim()) &&
	        Number(formData.maxAllowedProperties) >= 1 &&
	        isCompanyAdminUsernameValid &&
        isCompanyAdminEmailValid &&
        isCompanyAdminPhoneValid &&
        Boolean(formData.companyAdminPassword.trim()) &&
        Boolean(formData.companyAdminConfirmPassword.trim()) &&
        doCompanyAdminPasswordsMatch &&
        areAdminAccountsDifferent
      )) &&
    Boolean(formData.name.trim()) &&
    (!isChainCreation || Boolean(formData.propertyCode.trim())) &&
    isAdminUsernameValid &&
    isEmailValid &&
    !isDuplicateHotelEmail &&
    isPhoneValid &&
    !isDuplicateHotelPhone &&
    Boolean(formData.address.trim()) &&
    Boolean(formData.city.trim()) &&
    Boolean(formData.country.trim()) &&
    Boolean(formData.password.trim()) &&
    Boolean(formData.confirmPassword.trim()) &&
    doPasswordsMatch &&
    selectedModules.length > 0
  const isCreateHotelButtonDisabled = !isAddHotelFormValid || isCreatingHotel

  useEffect(() => {
    loadHotels()
    if (new URLSearchParams(window.location.search).get("add") === "1") {
      setIsAddDialogOpen(true)
    }
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
      (statusFilter === "all" || hotel.status === statusFilter) &&
      hotel.name.toLowerCase().includes(search.toLowerCase()) ||
      ((statusFilter === "all" || hotel.status === statusFilter) && hotel.city.toLowerCase().includes(search.toLowerCase()))
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
    if (isCreatingHotel) return
    setCreateHotelError("")
    if (!isAddHotelFormValid) {
      setCreateHotelError("Please fix username, email, phone number and required fields before registering the hotel.")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setCreateHotelError("Passwords do not match.")
      return
    }

    setIsCreatingHotel(true)
    try {
      const result = await createSuperAdminHotel({
        creationMode,
	        chainName: formData.chainName.trim(),
	        subscriptionPlan: formData.subscriptionPlan.trim() || "Standard",
	        maxAllowedProperties: Number(formData.maxAllowedProperties),
	        companyAdminUsername: formData.companyAdminUsername.trim(),
        companyAdminEmail: formData.companyAdminEmail.trim().toLowerCase(),
        companyAdminPhone: formData.companyAdminPhone.trim(),
        companyAdminPassword: formData.companyAdminPassword,
        companyAdminConfirmPassword: formData.companyAdminConfirmPassword,
        name: formData.name.trim(),
        propertyCode: formData.propertyCode.trim().toUpperCase(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        country: formData.country.trim(),
        totalRooms: parseInt(formData.roomCount) || 0,
        modules: selectedModules,
        adminUsername: formData.adminUsername.trim(),
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
	        chainName: "",
	        subscriptionPlan: "Standard",
	        maxAllowedProperties: "5",
	        companyAdminUsername: "",
        companyAdminEmail: "",
        companyAdminPhone: "",
        companyAdminPassword: "",
        companyAdminConfirmPassword: "",
        name: "",
        propertyCode: "",
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
      setCreationMode("standalone")
    } catch (error: any) {
      setCreateHotelError(error.message || "Failed to create hotel")
    } finally {
      setIsCreatingHotel(false)
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

  const openConvertDialog = (hotel: Hotel) => {
    setConversionHotel(hotel)
    setConvertHotelError("")
    setConvertFormData({
      companyName: `${hotel.name} Group`,
      companyAdminName: "",
      companyAdminEmail: "",
      companyAdminPhone: "",
      companyAdminPassword: "",
      subscriptionPlan: "Standard",
      maxAllowedProperties: "5",
    })
    setIsConvertDialogOpen(true)
  }

  const handleConvertToChain = async () => {
    if (!conversionHotel || isConvertingHotel) return
    setConvertHotelError("")

    if (
      !convertFormData.companyName.trim() ||
      !convertFormData.companyAdminName.trim() ||
      !convertFormData.companyAdminEmail.trim() ||
      !convertFormData.companyAdminPhone.trim() ||
      !convertFormData.companyAdminPassword ||
      Number(convertFormData.maxAllowedProperties) < 1
    ) {
      setConvertHotelError("Fill all required fields and keep maximum allowed properties at least 1.")
      return
    }

    setIsConvertingHotel(true)
    try {
      await convertSuperAdminHotelToChain(conversionHotel.id, {
        companyName: convertFormData.companyName.trim(),
        companyAdminName: convertFormData.companyAdminName.trim(),
        companyAdminEmail: convertFormData.companyAdminEmail.trim().toLowerCase(),
        companyAdminPhone: convertFormData.companyAdminPhone.trim(),
        companyAdminPassword: convertFormData.companyAdminPassword,
        subscriptionPlan: convertFormData.subscriptionPlan.trim() || "Standard",
        maxAllowedProperties: Number(convertFormData.maxAllowedProperties),
      })
      toast.success("Hotel converted to chain successfully")
      setIsConvertDialogOpen(false)
      setConversionHotel(null)
      loadHotels()
    } catch (error: any) {
      setConvertHotelError(error.message || "Failed to convert hotel to chain")
    } finally {
      setIsConvertingHotel(false)
    }
  }

  const handleUpdateHotel = async () => {
    const cleanEmail = String(selectedHotel.email || "").trim().toLowerCase()
    const cleanPhone = String(selectedHotel.phone || "").trim()
    const cleanPhoneDigits = normalizePhone(cleanPhone)

    if (!emailPattern.test(cleanEmail)) {
      toast.error("Enter a valid email address")
      return
    }

    if (cleanPhoneDigits.length < 7 || cleanPhoneDigits.length > 15) {
      toast.error("Phone number must contain 7 to 15 digits")
      return
    }

    const duplicateEmail = hotels.some((hotel) =>
      hotel.id !== selectedHotel.id && normalizeText(hotel.email) === cleanEmail
    )
    if (duplicateEmail) {
      toast.error("Email already exists")
      return
    }

    const duplicatePhone = hotels.some((hotel) =>
      hotel.id !== selectedHotel.id && normalizePhone(hotel.phone) === cleanPhoneDigits
    )
	    if (duplicatePhone) {
	      toast.error("Phone number already exists")
	      return
	    }

	    if (selectedHotel.companyId && Number(selectedHotel.companyMaxAllowedProperties || 0) < 1) {
	      toast.error("Max properties must be at least 1")
	      return
	    }
	
	    try {
	      await updateSuperAdminHotel(selectedHotel.id, {
	        name: String(selectedHotel.name || "").trim(),
	        email: cleanEmail,
	        phone: cleanPhone,
	        address: String(selectedHotel.address || "").trim(),
	        city: String(selectedHotel.city || "").trim(),
	        country: String(selectedHotel.country || "").trim(),
	        totalRooms: selectedHotel.totalRooms,
	        modules: selectedEditModules,
	        companySubscriptionPlan: selectedHotel.companySubscriptionPlan,
	        companyMaxAllowedProperties: selectedHotel.companyMaxAllowedProperties,
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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Hotels</h1>
          <p className="mt-1 text-xs text-muted-foreground">Manage all your hotel properties</p>
        </div>
        <Dialog
          open={isAddDialogOpen}
	          onOpenChange={(open) => {
	            setIsAddDialogOpen(open)
	            if (!open) setCreateHotelError("")
	          }}
	        >
          <DialogTrigger asChild>
            <Button size="sm" className="h-9">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Hotel
            </Button>
          </DialogTrigger>
	          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
	            <DialogHeader>
	              <DialogTitle>{isChainCreation ? "Register New Chain Property" : "Register Standalone Hotel"}</DialogTitle>
	              <DialogDescription>
	                {isChainCreation
	                  ? "Create a hotel chain/company, its chain admin, and the first property"
	                  : "Create one independent hotel with its property admin"}
	              </DialogDescription>
	            </DialogHeader>
	            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted p-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    setCreationMode("standalone")
                    setCreateHotelError("")
                  }}
                  className={`rounded-md px-3 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    !isChainCreation
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-background hover:text-foreground"
                  }`}
                >
                  Standalone Hotel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreationMode("chain")
                    setCreateHotelError("")
                  }}
                  className={`rounded-md px-3 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    isChainCreation
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-background hover:text-foreground"
                  }`}
                >
                  Chain Property
                </button>
              </div>

	              {createHotelError && (
	                <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
	                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{createHotelError}</span>
                </div>
              )}

	              {isChainCreation && (
	              <div className="space-y-3">
	                <div>
	                  <Label className="text-sm font-semibold">Chain / Company</Label>
	                  <p className="text-xs text-muted-foreground">This company can own multiple hotel properties.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="chainName">Chain Name</Label>
                    <Input
                      id="chainName"
                      value={formData.chainName}
                      onChange={(e) => setFormData({ ...formData, chainName: e.target.value })}
                      placeholder="Grand Hotel Group"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subscriptionPlan">Subscription Plan</Label>
                    <Input
                      id="subscriptionPlan"
                      value={formData.subscriptionPlan}
                      onChange={(e) => setFormData({ ...formData, subscriptionPlan: e.target.value })}
                      placeholder="Standard"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxAllowedProperties">Max Properties</Label>
                    <Input
                      id="maxAllowedProperties"
                      type="number"
                      min={1}
                      value={formData.maxAllowedProperties}
                      onChange={(e) => setFormData({ ...formData, maxAllowedProperties: e.target.value })}
                      placeholder="5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyAdminUsername">Chain Admin Username</Label>
                    <Input
                      id="companyAdminUsername"
                      value={formData.companyAdminUsername}
                      onChange={(e) => setFormData({ ...formData, companyAdminUsername: e.target.value })}
                      placeholder="grand_group_admin"
                      className={formData.companyAdminUsername && !isCompanyAdminUsernameValid ? "border-destructive" : ""}
                    />
                    {formData.companyAdminUsername && !isCompanyAdminUsernameValid && (
                      <p className="text-xs text-destructive">Username must be at least 4 characters.</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyAdminEmail">Chain Admin Email</Label>
                    <Input
                      id="companyAdminEmail"
                      type="email"
                      value={formData.companyAdminEmail}
                      onChange={(e) => setFormData({ ...formData, companyAdminEmail: e.target.value })}
                      placeholder="owner@grandgroup.com"
                      className={formData.companyAdminEmail && !isCompanyAdminEmailValid ? "border-destructive" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyAdminPhone">Chain Admin Phone</Label>
                    <Input
                      id="companyAdminPhone"
                      value={formData.companyAdminPhone}
                      onChange={(e) => setFormData({ ...formData, companyAdminPhone: e.target.value.replace(/[^\d+]/g, "") })}
                      placeholder="Enter chain admin phone"
                      className={formData.companyAdminPhone && !isCompanyAdminPhoneValid ? "border-destructive" : ""}
                    />
                  </div>
                  {hasMatchingAdminAccountField && (
                    <p className="col-span-2 text-xs text-destructive">Chain admin and property admin must use different username, email, and phone.</p>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="companyAdminPassword">Chain Admin Password</Label>
                    <Input
                      id="companyAdminPassword"
                      type="password"
                      value={formData.companyAdminPassword}
                      onChange={(e) => setFormData({ ...formData, companyAdminPassword: e.target.value })}
                      placeholder="Enter chain admin password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyAdminConfirmPassword">Confirm Chain Admin Password</Label>
                    <Input
                      id="companyAdminConfirmPassword"
                      type="password"
                      value={formData.companyAdminConfirmPassword}
                      onChange={(e) => setFormData({ ...formData, companyAdminConfirmPassword: e.target.value })}
                      placeholder="Confirm chain admin password"
                      className={formData.companyAdminConfirmPassword && !doCompanyAdminPasswordsMatch ? "border-destructive" : ""}
                    />
                    {formData.companyAdminConfirmPassword && !doCompanyAdminPasswordsMatch && (
                      <p className="text-xs text-destructive">Passwords do not match</p>
                    )}
	                  </div>
	                </div>
	              </div>
	              )}
	
	              <div className="space-y-3">
	                <div>
	                  <Label className="text-sm font-semibold">{isChainCreation ? "First Property" : "Hotel Details"}</Label>
	                  <p className="text-xs text-muted-foreground">
	                    {isChainCreation
	                      ? "This is the first branch under the chain. More properties can be added from Property Management."
	                      : "This hotel stays standalone until you convert it to a chain later."}
	                  </p>
	                </div>
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
	                {isChainCreation && (
	                <div className="space-y-2">
	                  <Label htmlFor="propertyCode">Property Code</Label>
	                  <Input
                    id="propertyCode"
                    value={formData.propertyCode}
                    onChange={(e) => setFormData({ ...formData, propertyCode: e.target.value.toUpperCase() })}
	                    placeholder="HYD01"
	                  />
	                </div>
	                )}
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
                    className={formData.email && (!isEmailValid || isDuplicateHotelEmail) ? "border-destructive" : ""}
                  />
                  {formData.email && !isEmailValid && (
                    <p className="text-xs text-destructive">Enter a valid email address.</p>
                  )}
                  {isDuplicateHotelEmail && (
                    <p className="text-xs text-destructive">Email already exists.</p>
                  )}
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
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^\d+]/g, "") })}
                    placeholder="Enter phone number"
                    className={formData.phone && (!isPhoneValid || isDuplicateHotelPhone) ? "border-destructive" : ""}
                  />
                  {formData.phone && !isPhoneValid && (
                    <p className="text-xs text-destructive">Phone number must contain 7 to 15 digits.</p>
                  )}
                  {isDuplicateHotelPhone && (
                    <p className="text-xs text-destructive">Phone number already exists in system.</p>
                  )}
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
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreateHotelError("")
                    setIsAddDialogOpen(false)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={isCreateHotelButtonDisabled ? undefined : handleAddHotel}
                  disabled={isCreateHotelButtonDisabled}
                  aria-disabled={isCreateHotelButtonDisabled}
                  title={isCreateHotelButtonDisabled ? "Complete all required fields to create the chain property" : undefined}
                  className={
                    isCreateHotelButtonDisabled
                      ? "cursor-not-allowed border border-slate-300 bg-slate-100 text-slate-600 shadow-none opacity-100 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-100 disabled:bg-slate-100 disabled:text-slate-600"
                      : "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                  }
                >
                  {isCreatingHotel ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
	                    isChainCreation ? "Create Chain Property" : "Create Standalone Hotel"
	                  )}
	                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search hotels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-xs"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-full text-xs sm:w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Hotels Table */}
      <Card className="overflow-hidden rounded-lg border-border bg-card">
        <CardHeader className="border-b border-border px-4 py-3">
          <CardTitle className="text-sm">Hotel Directory</CardTitle>
          <CardDescription className="text-xs">{filteredHotels.length} hotels registered</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2.5 px-4 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Property</th>
                  <th className="text-left py-2.5 px-4 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Location</th>
                  <th className="text-left py-2.5 px-4 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Rooms</th>
                  <th className="text-left py-2.5 px-4 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Modules</th>
                  <th className="text-left py-2.5 px-4 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Expiry Date</th>
                  <th className="text-left py-2.5 px-4 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Status</th>
                  <th className="text-right py-2.5 px-4 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHotels.map((hotel) => (
                  <tr key={hotel.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Building className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{hotel.name}</p>
                          <p className="text-xs text-primary font-medium">
                            {[hotel.propertyCode, hotel.companyName].filter(Boolean).join(" · ") || "Standalone property"}
                          </p>
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
                          {hotel.isStandalone && (
                            <DropdownMenuItem onClick={() => openConvertDialog(hotel)}>
                              <Building className="mr-2 h-4 w-4" />
                              Convert to Hotel Chain
                            </DropdownMenuItem>
                          )}
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

      <Dialog
        open={isConvertDialogOpen}
        onOpenChange={(open) => {
          setIsConvertDialogOpen(open)
          if (!open) {
            setConvertHotelError("")
            setConversionHotel(null)
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Convert to Hotel Chain</DialogTitle>
            <DialogDescription>
              {conversionHotel
                ? `${conversionHotel.name} will become Property #1 under the new company. Existing users and historical data are preserved.`
                : "Convert this standalone hotel into a chain with multi-property management."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {convertHotelError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{convertHotelError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="convertCompanyName">Company Name</Label>
                <Input
                  id="convertCompanyName"
                  value={convertFormData.companyName}
                  onChange={(e) => setConvertFormData({ ...convertFormData, companyName: e.target.value })}
                  placeholder="Grand Hotel Group"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="convertAdminName">Company Admin Name</Label>
                <Input
                  id="convertAdminName"
                  value={convertFormData.companyAdminName}
                  onChange={(e) => setConvertFormData({ ...convertFormData, companyAdminName: e.target.value })}
                  placeholder="Admin name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="convertAdminEmail">Company Admin Email</Label>
                <Input
                  id="convertAdminEmail"
                  type="email"
                  value={convertFormData.companyAdminEmail}
                  onChange={(e) => setConvertFormData({ ...convertFormData, companyAdminEmail: e.target.value })}
                  placeholder="admin@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="convertAdminPhone">Company Admin Phone</Label>
                <Input
                  id="convertAdminPhone"
                  value={convertFormData.companyAdminPhone}
                  onChange={(e) => setConvertFormData({ ...convertFormData, companyAdminPhone: e.target.value.replace(/[^\d+]/g, "") })}
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="convertAdminPassword">Company Admin Password</Label>
                <Input
                  id="convertAdminPassword"
                  type="password"
                  value={convertFormData.companyAdminPassword}
                  onChange={(e) => setConvertFormData({ ...convertFormData, companyAdminPassword: e.target.value })}
                  placeholder="Password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="convertSubscriptionPlan">Subscription Plan</Label>
                <Input
                  id="convertSubscriptionPlan"
                  value={convertFormData.subscriptionPlan}
                  onChange={(e) => setConvertFormData({ ...convertFormData, subscriptionPlan: e.target.value })}
                  placeholder="Standard"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="convertMaxProperties">Maximum Allowed Properties</Label>
                <Input
                  id="convertMaxProperties"
                  type="number"
                  min={1}
                  value={convertFormData.maxAllowedProperties}
                  onChange={(e) => setConvertFormData({ ...convertFormData, maxAllowedProperties: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConvertHotelError("")
                setIsConvertDialogOpen(false)
              }}
              disabled={isConvertingHotel}
            >
              Cancel
            </Button>
            <Button onClick={handleConvertToChain} disabled={isConvertingHotel}>
              {isConvertingHotel ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Converting...
                </>
              ) : (
                "Convert"
              )}
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
	              ...(selectedHotel.companyId
	                ? [
	                    { label: "Company", value: selectedHotel.companyName || "N/A" },
	                    { label: "Subscription Plan", value: selectedHotel.companySubscriptionPlan || "Standard" },
	                    { label: "Max Properties", value: selectedHotel.companyMaxAllowedProperties || 1 },
	                  ]
	                : [{ label: "Company", value: "Standalone property" }]),
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
	        {selectedHotel?.companyId && (
	          <div className="space-y-3 pt-4">
	            <div className="text-sm font-medium">Company Subscription</div>
	            <div className="grid grid-cols-2 gap-3">
	              <div className="space-y-2">
	                <Label htmlFor="editCompanySubscriptionPlan">Subscription Plan</Label>
	                <Input
	                  id="editCompanySubscriptionPlan"
	                  value={selectedHotel.companySubscriptionPlan || "Standard"}
	                  onChange={(e) => setSelectedHotel({ ...selectedHotel, companySubscriptionPlan: e.target.value })}
	                  placeholder="Standard"
	                />
	              </div>
	              <div className="space-y-2">
	                <Label htmlFor="editCompanyMaxAllowedProperties">Max Properties</Label>
	                <Input
	                  id="editCompanyMaxAllowedProperties"
	                  type="number"
	                  min={1}
	                  value={selectedHotel.companyMaxAllowedProperties || 1}
	                  onChange={(e) => setSelectedHotel({ ...selectedHotel, companyMaxAllowedProperties: Number(e.target.value) })}
	                />
	              </div>
	            </div>
	          </div>
	        )}
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
