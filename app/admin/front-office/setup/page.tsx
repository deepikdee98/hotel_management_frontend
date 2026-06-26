"use client"

import { useState, useEffect } from "react"
import type { ChangeEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Check, Settings, Plus, Pencil, Trash2, BedDouble, CreditCard, Tags, Building, Layers, ChevronDown, ChevronRight, Loader2, RotateCcw, X, User, ImageIcon, Upload } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import EditDetailsModal from "@/components/common/EditDetailsModal"
import { useAuth } from "@/lib/auth-context"

import {
  getSetupRoomTypes,
  getSetupRatePlans,
  getSetupServices,
  createSetupService,
  updateSetupService,
  deleteSetupService,
  getSetupHotelConfig,
  getSetupFloors,
  createSetupFloor,
  createSetupRoomConfig,
  createSetupRoomType,
  updateSetupRoomType,
  deleteSetupRoomType,
  createSetupRatePlan,
  updateSetupRatePlan,
  deleteSetupRatePlan,
  updateSetupHotelConfig,
  uploadHotelLogo,
  uploadPaymentQrCode,
  getHotelLogoReadUrl,
  deleteSetupRoomConfig,
  updateSetupRoomConfig,
  createSetupOption,
  deactivateSetupOption,
  getSetupOptions,
  updateSetupOption,
  completeHotelSetup,
  type SetupOption,
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  getTravelAgents,
  createTravelAgent,
  updateTravelAgent,
  deleteTravelAgent,
  cacheCompanyRegistrations,
  getCachedCompanyRegistrations,
  type Company,
  type TravelAgent
} from "@/lib/backend-api"
import { useToast } from "@/hooks/use-toast"
import { invalidateSetupOptions } from "@/hooks/use-setup-options"

interface RoomType {
  _id: string
  name: string
  code: string
  baseRate: number
  nonAcRate?: number
  acRate?: number
  extraBedNonAcRate?: number
  extraBedAcRate?: number
  maxOccupancy: number
  gstPercentage?: number
  gstType?: "INCLUSIVE" | "EXCLUSIVE"
  status: string
}

interface FloorRoom {
  roomTypeId: string
  roomTypeName: string
  acType: "AC" | "NON_AC"
  count: number
  roomNumbers: string[]
}

interface Floor {
  _id: string
  name: string
  floorNumber: number
  floorType: "rooms" | "banquet"
  totalRooms: number
  rooms: FloorRoom[]
}

const formatOptionalRate = (rate: unknown) => {
  const value = Number(rate || 0)
  return value > 0 ? `Rs. ${value.toLocaleString()}` : "-"
}

const masterDataGroups = {
  all: [
    { label: "Title", type: "title", module: "guest" },
    { label: "Gender", type: "gender", module: "guest" },
    { label: "Nationality", type: "nationality", module: "guest" },
    { label: "Country", type: "country", module: "guest" },
    { label: "Referral", type: "referral", module: "business" },
    { label: "Purpose", type: "purpose", module: "business" },
    { label: "Business Source", type: "businessSource", module: "business" },
    { label: "Market Segment", type: "marketSegment", module: "business" },
    { label: "Checkout Plan", type: "checkoutPlan", module: "business" },
    { label: "Guest Classification", type: "guestClassification", module: "guest" },
    { label: "Guest Type", type: "guestType", module: "guest" },
    { label: "Payment Modes", type: "paymentMode", module: "payment" },
    { label: "Ledger Accounts", type: "ledgerAccount", module: "payment" },
    { label: "ID Proof", type: "idProof", module: "guest" },
    { label: "Vehicle Type", type: "vehicleType", module: "business" },
    { label: "Ledger Group", type: "ledgerGroup", module: "business" },
    { label: "Booking Category", type: "bookingCategory", module: "business" },
    { label: "Occupancy Type", type: "occupancyType", module: "room" }
  ],
} as const

type MasterDataModule = keyof typeof masterDataGroups

function MasterDataPanel({ moduleKey = "all" }: { moduleKey?: MasterDataModule }) {
  const { toast } = useToast()
  const types = masterDataGroups[moduleKey]
  const [type, setType] = useState<string>(types[0].type)
  const [options, setOptions] = useState<SetupOption[]>([])
  const [value, setValue] = useState("")
  const [editingId, setEditingId] = useState("")
  const [editingValue, setEditingValue] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const sortedOptions = [...options].sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.value.localeCompare(b.value))

  async function loadOptions(selectedType = type) {
    setLoading(true)
    try {
      setOptions(await getSetupOptions(selectedType, true))
    } catch (error) {
      toast({
        title: "Could not load setup values",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOptions(type)
  }, [type])

  async function handleAdd() {
    const trimmed = value.trim()
    if (!trimmed) return
    if (options.some((option) => option.type === type && option.value.toLowerCase() === trimmed.toLowerCase())) {
      toast({ title: "Duplicate value", description: "This setup value already exists.", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const selectedType = types.find((item) => item.type === type)
      await createSetupOption({ module: selectedType?.module || moduleKey, type, value: trimmed })
      setValue("")
      invalidateSetupOptions(type)
      await loadOptions()
    } catch (error) {
      toast({
        title: "Could not add value",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(option: SetupOption) {
    const trimmed = editingValue.trim()
    if (!trimmed) return

    setSaving(true)
    try {
      await updateSetupOption(option._id, { value: trimmed })
      setEditingId("")
      setEditingValue("")
      invalidateSetupOptions(type)
      await loadOptions()
    } catch (error) {
      toast({
        title: "Could not update value",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(option: SetupOption) {
    setSaving(true)
    try {
      await deactivateSetupOption(option._id)
      invalidateSetupOptions(type)
      await loadOptions()
    } catch (error) {
      toast({
        title: "Could not deactivate value",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleReactivate(option: SetupOption) {
    setSaving(true)
    try {
      await updateSetupOption(option._id, { isActive: true })
      invalidateSetupOptions(type)
      await loadOptions()
    } catch (error) {
      toast({
        title: "Could not reactivate value",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <CardTitle className="text-lg">Master Data</CardTitle>
          <CardDescription>Manage active dropdown values used across front-office workflows.</CardDescription>
        </div>
        <div className="w-full sm:w-64">
          <Label className="mb-1.5 block text-xs text-muted-foreground">Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {types.map((item) => (
                <SelectItem key={item.type} value={item.type}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Add a new value" />
          <Button onClick={handleAdd} disabled={saving || !value.trim()} className="sm:w-32">
            <Plus className="mr-2 h-4 w-4" />Add
          </Button>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-36 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">Loading values...</TableCell></TableRow>
              ) : sortedOptions.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No values yet.</TableCell></TableRow>
              ) : (
                sortedOptions.map((option) => (
                  <TableRow key={option._id}>
                    <TableCell>
                      {editingId === option._id ? (
                        <Input value={editingValue} onChange={(event) => setEditingValue(event.target.value)} autoFocus />
                      ) : (
                        <span className={option.isActive ? "font-medium" : "text-muted-foreground line-through"}>{option.value}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={option.isActive ? "default" : "secondary"}>{option.isActive ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {editingId === option._id ? (
                          <>
                            <Button size="icon" variant="ghost" onClick={() => handleUpdate(option)} disabled={saving}><Check className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => setEditingId("")}><X className="h-4 w-4" /></Button>
                          </>
                        ) : option.isActive ? (
                          <>
                            <Button size="icon" variant="ghost" onClick={() => { setEditingId(option._id); setEditingValue(option.value) }}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDeactivate(option)} disabled={saving}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </>
                        ) : (
                          <Button size="icon" variant="ghost" onClick={() => handleReactivate(option)} disabled={saving}><RotateCcw className="h-4 w-4" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default function FOSetupPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [isFinishing, setIsFinishing] = useState(false)

  const handleFinishSetup = async () => {
    setIsFinishing(true)
    try {
      await completeHotelSetup()
      
      // Update local user state if possible to clear needsSetup
      if (user) {
        user.needsSetup = false
        const stored = sessionStorage.getItem("hotel_manager_auth")
        if (stored) {
          const userData = JSON.parse(stored)
          userData.needsSetup = false
          sessionStorage.setItem("hotel_manager_auth", JSON.stringify(userData))
        }
      }

      toast({
        title: "Setup Completed",
        description: "Your hotel setup has been finalized successfully.",
      })
      
      router.push("/admin")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete setup",
        variant: "destructive"
      })
    } finally {
      setIsFinishing(false)
    }
  }

  const [activeTab, setActiveTab] = useState("room-config")
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [ratePlans, setRatePlans] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [floors, setFloors] = useState<Floor[]>([])
  const [hotelConfig, setHotelConfig] = useState<any>(null)
  const [hotelConfigForm, setHotelConfigForm] = useState<any>({})
  const [hotelLogoFile, setHotelLogoFile] = useState<File | null>(null)
  const [hotelLogoPreview, setHotelLogoPreview] = useState("")
  const [isHotelLogoUploading, setIsHotelLogoUploading] = useState(false)

  const [paymentQrFile, setPaymentQrFile] = useState<File | null>(null)
  const [paymentQrPreview, setPaymentQrPreview] = useState("")
  const [isPaymentQrUploading, setIsPaymentQrUploading] = useState(false)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addType, setAddType] = useState("")
  const [expandedFloors, setExpandedFloors] = useState<string[]>([])
  const [isAddFloorOpen, setIsAddFloorOpen] = useState(false)
  const [isAddRoomToFloorOpen, setIsAddRoomToFloorOpen] = useState(false)
  const [isEditingRoomConfig, setIsEditingRoomConfig] = useState(false)
  const [oldRoomTypeId, setOldRoomTypeId] = useState<string | null>(null)
  const [oldAcType, setOldAcType] = useState<"AC" | "NON_AC" | null>(null)
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null)

  const [newFloor, setNewFloor] = useState<{ name: string; floorNumber: string; floorType: "rooms" | "banquet" }>({ name: "", floorNumber: "", floorType: "rooms" })
  const [newRoomConfig, setNewRoomConfig] = useState<{ roomTypeId: string; acType: "AC" | "NON_AC"; count: string; startNumber: string }>({ roomTypeId: "", acType: "NON_AC", count: "", startNumber: "" })
  const [genericForm, setGenericForm] = useState<any>({})

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [selectedRoomType, setSelectedRoomType] = useState<any>(null)
  const [selectedRatePlan, setSelectedRatePlan] = useState<any>(null)
  const [selectedService, setSelectedService] = useState<any>(null)

  useEffect(() => {
    const tab = searchParams.get("tab")
    const add = searchParams.get("add")

    if (tab) {
      setActiveTab(tab)
    }

    if (tab === "service-codes" && add === "service") {
      setAddType("service")
      setGenericForm({ category: "Other", chargeType: "PER_STAY", gstPercentage: "0" })
      setIsAddOpen(true)
      router.replace("/admin/front-office/setup?tab=service-codes", { scroll: false })
    }
  }, [router, searchParams])

  // Company registration state
  const [companies, setCompanies] = useState<Company[]>([])
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [companyForm, setCompanyForm] = useState({
    name: "",
    code: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    gstNumber: "",
    type: "Company" as "Company" | "Travel Agent",
    creditAllowed: false,
    creditLimit: 0,
    status: true
  })

  const normalizeRegistration = (item: any, fallbackType: "Company" | "Travel Agent" = "Company", source: "company" | "travelAgent" = "company") => ({
    ...item,
    _id: String(item?._id || item?.id || ""),
    name: String(item?.name || ""),
    code: String(item?.code || ""),
    type: item?.type || fallbackType,
    contactPerson: item?.contactPerson || "",
    phone: item?.phone || "",
    email: item?.email || "",
    address: item?.address || "",
    gstNumber: item?.gstNumber || "",
    creditAllowed: Boolean(item?.creditAllowed),
    creditLimit: Number(item?.creditLimit || 0),
    status: item?.status !== false,
    __source: item?.__source || source,
  })

  const upsertRegistration = (registration: any) => {
    if (!registration?._id) return
    setCompanies((prev) => {
      const existingIndex = prev.findIndex((item) => item._id === registration._id)
      if (existingIndex === -1) return [...prev, registration]
      return prev.map((item, index) => index === existingIndex ? registration : item)
    })
  }

  const mergeRegistrations = (registrations: any[]) => {
    setCompanies((prev) => {
      const merged = new Map(prev.map((item) => [item._id, item]))
      registrations.forEach((registration) => {
        if (registration?._id) merged.set(registration._id, registration)
      })
      return Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name))
    })
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [rt, rp, fl, hc, sv, comp, ta] = await Promise.all([
        getSetupRoomTypes().catch(() => []),
        getSetupRatePlans().catch(() => []),
        getSetupFloors().catch(() => []),
        getSetupHotelConfig().catch(() => null),
        getSetupServices().catch(() => []),
        getCompanies().catch(() => []),
        getTravelAgents().catch(() => [])
      ])

      setRoomTypes(rt as unknown as RoomType[])
      setRatePlans(rp)
      setServices(sv)
      
      const allCompanies = [
        ...(comp || []).map((c: any) => normalizeRegistration(c, c.type || "Company", "company")),
        ...(ta || []).map((t: any) => normalizeRegistration(t, "Travel Agent", "travelAgent"))
      ]
      cacheCompanyRegistrations(allCompanies)
      mergeRegistrations(allCompanies)

      // Map floor data from backend to UI structure
      const mappedFloors: Floor[] = fl.map((f: any) => ({
        _id: f._id,
        name: f.name,
        floorNumber: f.floorNumber,
        floorType: f.floorType || "rooms",
        totalRooms: f.roomConfigurations?.reduce((sum: number, rc: any) => sum + rc.count, 0) || 0,
        rooms: f.roomConfigurations?.map((rc: any) => ({
          roomTypeId: rc.roomTypeId?._id || rc.roomTypeId,
          roomTypeName: rc.roomTypeId?.name || "Unknown",
          acType: rc.acType || "NON_AC",
          count: rc.count,
          roomNumbers: rc.rooms || []
        })) || []
      }))

      setFloors(mappedFloors)
      if (mappedFloors.length > 0) {
        setExpandedFloors([mappedFloors[0]._id])
      }
      const loadedHotelConfig = hc as any
      setHotelConfig(loadedHotelConfig)
      setHotelConfigForm({
        name: loadedHotelConfig?.name || "",
        address: loadedHotelConfig?.address || "",
        phone: loadedHotelConfig?.phone || "",
        email: loadedHotelConfig?.email || "",
        gstNumber: loadedHotelConfig?.gstNumber || "",
        checkInTime: loadedHotelConfig?.checkInTime || "14:00",
        checkOutTime: loadedHotelConfig?.checkOutTime || "11:00",
        currency: String(loadedHotelConfig?.currency || "INR").toUpperCase(),
        dateFormat: String(loadedHotelConfig?.dateFormat || "DD-MM-YYYY").toUpperCase(),
        nightAuditTime: loadedHotelConfig?.nightAuditTime || "00:00",
        nightAuditEnabled: loadedHotelConfig?.nightAuditEnabled ?? true,
        lastNightAuditAt: loadedHotelConfig?.lastNightAuditAt || null,
        bookingPrefix: loadedHotelConfig?.bookingPrefix || "NOV",
        startNumber: loadedHotelConfig?.startNumber ?? 1,
        digitLength: loadedHotelConfig?.digitLength ?? 4,
        resetFinancialYear: loadedHotelConfig?.resetFinancialYear ?? true,
        currentNumber: loadedHotelConfig?.currentNumber ?? 1,
        currentFinancialYear: loadedHotelConfig?.currentFinancialYear || "",
        financialYearFormat: loadedHotelConfig?.financialYearFormat || "YYYY-YY",
        logo: loadedHotelConfig?.logo || null,
        paymentQrCode: loadedHotelConfig?.paymentQrCode || null,
        bankDetails: {
          accountName: loadedHotelConfig?.bankDetails?.accountName || "",
          accountNumber: loadedHotelConfig?.bankDetails?.accountNumber || "",
          bankName: loadedHotelConfig?.bankDetails?.bankName || "",
          ifscCode: loadedHotelConfig?.bankDetails?.ifscCode || "",
          branchName: loadedHotelConfig?.bankDetails?.branchName || "",
        },
      })
      setHotelLogoFile(null)
      if (loadedHotelConfig?.logo?.key) {
        getHotelLogoReadUrl(loadedHotelConfig.logo.key)
          .then((url) => setHotelLogoPreview(url))
          .catch(() => setHotelLogoPreview(loadedHotelConfig?.logo?.url || ""))
      } else {
        setHotelLogoPreview(loadedHotelConfig?.logo?.url || "")
      }

      setPaymentQrFile(null)
      if (loadedHotelConfig?.paymentQrCode?.key) {
        getHotelLogoReadUrl(loadedHotelConfig.paymentQrCode.key)
          .then((url) => setPaymentQrPreview(url))
          .catch(() => setPaymentQrPreview(loadedHotelConfig?.paymentQrCode?.url || ""))
      } else {
        setPaymentQrPreview(loadedHotelConfig?.paymentQrCode?.url || "")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch setup data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    mergeRegistrations(getCachedCompanyRegistrations().map((item: any) => normalizeRegistration(item, item.type || "Company", item.type === "Travel Agent" ? "travelAgent" : "company")))
    fetchData()
  }, [])

  useEffect(() => {
    if (!hotelLogoFile) return

    const previewUrl = URL.createObjectURL(hotelLogoFile)
    setHotelLogoPreview(previewUrl)

    return () => URL.revokeObjectURL(previewUrl)
  }, [hotelLogoFile])

  const handleHotelLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please choose an image file (PNG, JPG, etc.) for the hotel logo.",
        variant: "destructive",
      })
      return
    }

    setHotelLogoFile(file)
  }

  const handlePaymentQrChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please choose an image file (PNG, JPG, etc.) for the payment QR code.",
        variant: "destructive",
      })
      return
    }

    setPaymentQrFile(file)
  }

  useEffect(() => {
    if (!paymentQrFile) return

    const previewUrl = URL.createObjectURL(paymentQrFile)
    setPaymentQrPreview(previewUrl)

    return () => URL.revokeObjectURL(previewUrl)
  }, [paymentQrFile])

  const toggleFloor = (floorId: string) => {
    setExpandedFloors(prev =>
      prev.includes(floorId) ? prev.filter(id => id !== floorId) : [...prev, floorId]
    )
  }

  const handleAddFloor = async () => {
    if (!newFloor.name || !newFloor.floorNumber) return

    try {
      await createSetupFloor({
        name: newFloor.name,
        floorNumber: parseInt(newFloor.floorNumber),
        floorType: newFloor.floorType,
      })
      toast({ title: "Success", description: "Floor added successfully" })
      fetchData()
      setNewFloor({ name: "", floorNumber: "", floorType: "rooms" })
      setIsAddFloorOpen(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add floor",
        variant: "destructive"
      })
    }
  }

  const handleAddRoomToFloor = async () => {
    if (!selectedFloor || !newRoomConfig.roomTypeId || !newRoomConfig.count) return
    if (selectedFloor.floorType === "banquet") {
      toast({
        title: "Banquet floor",
        description: "This floor is configured as a banquet hall, so rooms cannot be added to it.",
        variant: "destructive"
      })
      return
    }
    const roomType = roomTypes.find(rt => rt._id === newRoomConfig.roomTypeId)
    if (!roomType) return

    const selectedRate = newRoomConfig.acType === "AC"
      ? Number(roomType.acRate || 0)
      : Number(roomType.nonAcRate || 0)

    if (selectedRate <= 0) {
      toast({
        title: "Rate not configured",
        description: `${newRoomConfig.acType === "AC" ? "AC" : "Non AC"} rate is not configured for ${roomType.name}.`,
        variant: "destructive"
      })
      return
    }

    const requestedCount = parseInt(newRoomConfig.count)
    const currentTotal = floors.reduce((sum, f) => sum + f.totalRooms, 0)

    if (!hotelConfig) {
      toast({
        title: "Hotel configuration not loaded",
        description: "Please refresh the page or try again after the hotel data loads.",
        variant: "destructive"
      })
      return
    }

    const maxAllowed = hotelConfig.totalRooms ?? 0

    if (currentTotal + requestedCount > maxAllowed) {
      toast({
        title: "Room Limit Reached",
        description: `Cannot add ${requestedCount} rooms. Total rooms would exceed the limit of ${maxAllowed}. Current: ${currentTotal}`,
        variant: "destructive"
      })
      return
    }

    try {
      const startingRoomNumber = newRoomConfig.startNumber || `${selectedFloor.floorNumber === 0 ? "G" : selectedFloor.floorNumber}01`
      const roomNumberFormat = /^[0-9]+$/.test(String(startingRoomNumber)) ? "numeric" : "alphanumeric"

      if (isEditingRoomConfig && oldRoomTypeId && oldAcType) {
        await updateSetupRoomConfig(selectedFloor._id, oldRoomTypeId, {
          roomTypeId: newRoomConfig.roomTypeId,
          acType: newRoomConfig.acType,
          count: requestedCount,
          startingRoomNumber,
          roomNumberFormat,
        }, oldAcType)
        toast({ title: "Success", description: "Rooms updated successfully" })
      } else {
        await createSetupRoomConfig(selectedFloor._id, {
          roomTypeId: newRoomConfig.roomTypeId,
          acType: newRoomConfig.acType,
          count: requestedCount,
          startingRoomNumber,
          roomNumberFormat,
        })
        toast({ title: "Success", description: "Rooms added successfully" })
      }

      fetchData()
      setNewRoomConfig({ roomTypeId: "", acType: "NON_AC", count: "", startNumber: "" })
      setIsAddRoomToFloorOpen(false)
      setIsEditingRoomConfig(false)
      setOldRoomTypeId(null)
      setOldAcType(null)
      setSelectedFloor(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add rooms",
        variant: "destructive"
      })
    }
  }

  const handleOpenEditRoomConfig = (floor: Floor, room: FloorRoom) => {
    setSelectedFloor(floor)
    setNewRoomConfig({
      roomTypeId: room.roomTypeId,
      acType: room.acType,
      count: String(room.count),
      startNumber: room.roomNumbers[0] || "",
    })
    setIsEditingRoomConfig(true)
    setOldRoomTypeId(room.roomTypeId)
    setOldAcType(room.acType)
    setIsAddRoomToFloorOpen(true)
  }

  const handleDeleteRoomConfig = async (floorId: string, roomTypeId: string, acType: "AC" | "NON_AC") => {
    const confirmDelete = confirm("Are you sure you want to remove this room configuration?")
    if (!confirmDelete) return

    try {
      await deleteSetupRoomConfig(floorId, roomTypeId, acType)
      toast({ title: "Deleted", description: "Room configuration removed successfully" })
      fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove room configuration",
        variant: "destructive"
      })
    }
  }

  const handleSaveHotelConfig = async () => {
    // Basic Required Fields
    if (!hotelConfigForm.name?.trim()) {
      toast({
        title: "Error",
        description: "Hotel name is required",
        variant: "destructive"
      })
      return
    }
    if (!hotelConfigForm.address?.trim()) {
      toast({
        title: "Error",
        description: "Hotel address is required",
        variant: "destructive"
      })
      return
    }
    if (!hotelConfigForm.phone?.trim()) {
      toast({
        title: "Error",
        description: "Hotel phone number is required",
        variant: "destructive"
      })
      return
    }
    if (!hotelConfigForm.email?.trim()) {
      toast({
        title: "Error",
        description: "Hotel email address is required",
        variant: "destructive"
      })
      return
    }

    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(hotelConfigForm.email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      })
      return
    }

    // Bank Details Validation (Partial validation - if any field is entered, others should be there or just basic check)
    if (hotelConfigForm.bankDetails) {
      const { accountName, accountNumber, bankName, ifscCode } = hotelConfigForm.bankDetails
      if ((accountName || accountNumber || bankName || ifscCode) && 
          !(accountName && accountNumber && bankName && ifscCode)) {
        toast({
          title: "Error",
          description: "Please complete all bank account details (Name, Number, Bank, and IFSC)",
          variant: "destructive"
        })
        return
      }
    }

    try {
      setIsHotelLogoUploading(Boolean(hotelLogoFile))
      setIsPaymentQrUploading(Boolean(paymentQrFile))
      const [uploadedLogo, uploadedQr] = await Promise.all([
        hotelLogoFile ? uploadHotelLogo(hotelLogoFile) : Promise.resolve(hotelConfigForm.logo),
        paymentQrFile ? uploadPaymentQrCode(paymentQrFile) : Promise.resolve(hotelConfigForm.paymentQrCode)
      ])

      const result = await updateSetupHotelConfig({
        name: hotelConfigForm.name,
        address: hotelConfigForm.address,
        phone: hotelConfigForm.phone,
        email: hotelConfigForm.email,
        gstNumber: hotelConfigForm.gstNumber,
        checkInTime: hotelConfigForm.checkInTime,
        checkOutTime: hotelConfigForm.checkOutTime,
        currency: hotelConfigForm.currency,
        dateFormat: hotelConfigForm.dateFormat,
        nightAuditTime: hotelConfigForm.nightAuditTime,
        nightAuditEnabled: hotelConfigForm.nightAuditEnabled,
        bookingPrefix: hotelConfigForm.bookingPrefix,
        startNumber: Number(hotelConfigForm.startNumber || 1),
        digitLength: Number(hotelConfigForm.digitLength || 4),
        resetFinancialYear: hotelConfigForm.resetFinancialYear,
        currentNumber: Number(hotelConfigForm.currentNumber || hotelConfigForm.startNumber || 1),
        currentFinancialYear: hotelConfigForm.currentFinancialYear || null,
        financialYearFormat: hotelConfigForm.financialYearFormat,
        logo: uploadedLogo || null,
        paymentQrCode: uploadedQr || null,
        bankDetails: hotelConfigForm.bankDetails,
      })

      const updatedHotel = (result as any)?.hotel || {
        ...hotelConfig,
        ...hotelConfigForm,
        logo: uploadedLogo || hotelConfigForm.logo || null,
        paymentQrCode: uploadedQr || hotelConfigForm.paymentQrCode || null,
      }

      setHotelConfig(updatedHotel)
      setHotelConfigForm({
        ...hotelConfigForm,
        name: updatedHotel.name,
        address: updatedHotel.address,
        phone: updatedHotel.phone,
        email: updatedHotel.email,
        gstNumber: updatedHotel.gstNumber,
        checkInTime: updatedHotel.checkInTime,
        checkOutTime: updatedHotel.checkOutTime,
        currency: updatedHotel.currency,
        dateFormat: updatedHotel.dateFormat,
        nightAuditTime: updatedHotel.nightAuditTime || hotelConfigForm.nightAuditTime,
        nightAuditEnabled: updatedHotel.nightAuditEnabled ?? hotelConfigForm.nightAuditEnabled,
        lastNightAuditAt: updatedHotel.lastNightAuditAt || hotelConfigForm.lastNightAuditAt || null,
        bookingPrefix: updatedHotel.bookingPrefix || hotelConfigForm.bookingPrefix || "NOV",
        startNumber: updatedHotel.startNumber ?? hotelConfigForm.startNumber ?? 1,
        digitLength: updatedHotel.digitLength ?? hotelConfigForm.digitLength ?? 4,
        resetFinancialYear: updatedHotel.resetFinancialYear ?? hotelConfigForm.resetFinancialYear ?? true,
        currentNumber: updatedHotel.currentNumber ?? hotelConfigForm.currentNumber ?? 1,
        currentFinancialYear: updatedHotel.currentFinancialYear || hotelConfigForm.currentFinancialYear || "",
        financialYearFormat: updatedHotel.financialYearFormat || hotelConfigForm.financialYearFormat || "YYYY-YY",
        logo: updatedHotel.logo || uploadedLogo || null,
        paymentQrCode: updatedHotel.paymentQrCode || uploadedQr || null,
        bankDetails: {
          accountName: updatedHotel.bankDetails?.accountName || hotelConfigForm.bankDetails?.accountName || "",
          accountNumber: updatedHotel.bankDetails?.accountNumber || hotelConfigForm.bankDetails?.accountNumber || "",
          bankName: updatedHotel.bankDetails?.bankName || hotelConfigForm.bankDetails?.bankName || "",
          ifscCode: updatedHotel.bankDetails?.ifscCode || hotelConfigForm.bankDetails?.ifscCode || "",
          branchName: updatedHotel.bankDetails?.branchName || hotelConfigForm.bankDetails?.branchName || "",
        },
      })
      setHotelLogoFile(null)
      setPaymentQrFile(null)
      let nextLogoPreview = updatedHotel.logo?.url || uploadedLogo?.url || ""
      if ((updatedHotel.logo?.key || uploadedLogo?.key)) {
        nextLogoPreview = await getHotelLogoReadUrl(updatedHotel.logo?.key || uploadedLogo?.key)
          .catch(() => nextLogoPreview)
      }
      setHotelLogoPreview(nextLogoPreview)

      let nextQrPreview = updatedHotel.paymentQrCode?.url || uploadedQr?.url || ""
      if ((updatedHotel.paymentQrCode?.key || uploadedQr?.key)) {
        nextQrPreview = await getHotelLogoReadUrl(updatedHotel.paymentQrCode?.key || uploadedQr?.key)
          .catch(() => nextQrPreview)
      }
      setPaymentQrPreview(nextQrPreview)

      window.dispatchEvent(new CustomEvent("hotel-logo-updated", {
        detail: { logoUrl: nextLogoPreview },
      }))

      toast({
        title: "Saved",
        description: "Hotel configuration updated successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save hotel configuration",
        variant: "destructive"
      })
    } finally {
      setIsHotelLogoUploading(false)
    }
  }

  const totalRooms = floors.reduce((sum, f) => sum + f.totalRooms, 0)
  const bookingPreview = `${String(hotelConfigForm.bookingPrefix || "NOV").trim().toUpperCase() || "NOV"}-${String(Number(hotelConfigForm.currentNumber || hotelConfigForm.startNumber || 1)).padStart(Number(hotelConfigForm.digitLength || 4), "0")}`
  const hotelLogoName = hotelLogoFile?.name || hotelConfigForm.logo?.fileName || "No logo selected"
  const selectedConfigRoomType = roomTypes.find(rt => rt._id === newRoomConfig.roomTypeId)
  const roomConfigAcLabel = newRoomConfig.acType === "AC" ? "AC" : "Non AC"
  const roomConfigPreview = (() => {
    if (!selectedFloor || !newRoomConfig.count || !newRoomConfig.startNumber) return "Enter values to see range"

    const start = parseInt(newRoomConfig.startNumber)
    const count = parseInt(newRoomConfig.count)
    const roomTypeName = selectedConfigRoomType?.name || "Room"
    if (!Number.isFinite(start) || !Number.isFinite(count)) {
      return `${newRoomConfig.startNumber} ${roomTypeName} ${roomConfigAcLabel}`
    }

    return `${start} ${roomTypeName} ${roomConfigAcLabel} - ${start + count - 1} ${roomTypeName} ${roomConfigAcLabel}`
  })()


  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg font-medium">Loading setup...</span>
      </div>
    )
  }

  const handleCreateRoomType = async () => {
    const nonAcRate = Number(genericForm.nonAcRate || 0)
    const acRate = Number(genericForm.acRate || 0)

    if (!genericForm.name || !genericForm.code || !genericForm.maxOccupancy) {
      toast({
        title: "Error",
        description: "Name, code and max occupancy are required",
        variant: "destructive",
      });
      return;
    }

    if (nonAcRate <= 0 && acRate <= 0) {
      toast({
        title: "Error",
        description: "Enter at least one rate: Non AC or AC",
        variant: "destructive",
      });
      return;
    }

    try {
      await createSetupRoomType({
        name: genericForm.name,
        code: genericForm.code,
        nonAcRate,
        acRate,
        baseRate: nonAcRate > 0 ? nonAcRate : acRate,
        extraBedNonAcRate: Number(genericForm.extraBedNonAcRate) || 0,
        extraBedAcRate: Number(genericForm.extraBedAcRate) || 0,
        maxOccupancy: Number(genericForm.maxOccupancy),
        gstPercentage: Number(genericForm.gstPercentage) || 0,
        gstType: genericForm.gstType || "EXCLUSIVE",
      });

      toast({
        title: "Success",
        description: "Room type created successfully",
      });

      setIsAddOpen(false);
      setGenericForm({});
      fetchData();

    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateRatePlan = async () => {
    if (!genericForm.name || !genericForm.code) {
      toast({
        title: "Error",
        description: "Name and Code are required",
        variant: "destructive",
      });
      return;
    }

    if (genericForm.foodIncluded && (!genericForm.mealType || Number(genericForm.foodCharge) < 0)) {
      toast({
        title: "Error",
        description: "Meal Type and valid Food Charge are required when food is included",
        variant: "destructive",
      });
      return;
    }

    try {
      const foodIncluded = !!genericForm.foodIncluded
      await createSetupRatePlan({
        name: genericForm.name,
        code: genericForm.code,
        description: genericForm.description || "",
        foodIncluded,
        mealType: foodIncluded ? genericForm.mealType || "" : "",
        foodCharge: foodIncluded ? Number(genericForm.foodCharge || 0) : 0,
      });

      toast({
        title: "Success",
        description: "Rate plan created successfully",
      });

      setIsAddOpen(false);
      setGenericForm({});
      fetchData();

    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteRoomType = async (id: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this room type?")

    if (!confirmDelete) return

    try {
      await deleteSetupRoomType(id)

      toast({
        title: "Deleted",
        description: "Room type deleted successfully",
      })

      fetchData()

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleUpdateRoomType = async () => {
    const nonAcRate = Number(editForm.nonAcRate || 0)
    const acRate = Number(editForm.acRate || 0)

    if (!editForm.name || !editForm.code || !editForm.maxOccupancy) {
      toast({
        title: "Error",
        description: "Name, code and max occupancy are required",
        variant: "destructive",
      })
      return
    }

    if (nonAcRate <= 0 && acRate <= 0) {
      toast({
        title: "Error",
        description: "Enter at least one rate: Non AC or AC",
        variant: "destructive",
      })
      return
    }

    try {
      await updateSetupRoomType(selectedRoomType._id, {
        name: editForm.name,
        code: editForm.code,
        nonAcRate,
        acRate,
        baseRate: nonAcRate > 0 ? nonAcRate : acRate,
        extraBedNonAcRate: Number(editForm.extraBedNonAcRate) || 0,
        extraBedAcRate: Number(editForm.extraBedAcRate) || 0,
        maxOccupancy: Number(editForm.maxOccupancy),
        gstPercentage: Number(editForm.gstPercentage) || 0,
        gstType: editForm.gstType || "EXCLUSIVE",
        status: editForm.status || "active",
      })

      toast({
        title: "Updated",
        description: "Room type updated successfully",
      })

      setIsEditOpen(false)
      setSelectedRoomType(null)
      fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDeleteRatePlan = async (id: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this rate plan?")

    if (!confirmDelete) return

    try {
      await deleteSetupRatePlan(id)

      toast({
        title: "Deleted",
        description: "Rate plan deleted successfully",
      })

      fetchData()

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleUpdateRatePlan = async () => {
    if (editForm.foodIncluded && (!editForm.mealType || Number(editForm.foodCharge) < 0)) {
      toast({
        title: "Error",
        description: "Meal Type and valid Food Charge are required when food is included",
        variant: "destructive",
      })
      return
    }

    try {
      await updateSetupRatePlan(selectedRatePlan._id, {
        name: editForm.name,
        code: editForm.code,
        description: editForm.description,
        foodIncluded: !!editForm.foodIncluded,
        mealType: editForm.foodIncluded ? editForm.mealType || "" : "",
        foodCharge: editForm.foodIncluded ? Number(editForm.foodCharge || 0) : 0,
        status: editForm.status || "active",
      })

      toast({
        title: "Updated",
        description: "Rate plan updated successfully",
      })

      setIsEditOpen(false)
      setSelectedRatePlan(null)
      fetchData()

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleCreateService = async () => {
    if (!genericForm.name?.trim()) {
      toast({
        title: "Error",
        description: "Service name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await createSetupService({
        name: genericForm.name.trim(),
        code: genericForm.code?.trim(),
        category: genericForm.category || "Other",
        defaultPrice: Number(genericForm.defaultPrice || 0),
        chargeType: genericForm.chargeType || "PER_STAY",
        gstApplicable: !!genericForm.gstApplicable,
        gstPercentage: Number(genericForm.gstPercentage || 0),
        isFood: !!genericForm.isFood,
      })

      toast({
        title: "Success",
        description: "Service created successfully",
      });

      setIsAddOpen(false);
      setGenericForm({});
      fetchData();

    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateService = async () => {
    try {
      await updateSetupService(selectedService._id, {
        name: editForm.name,
        code: editForm.code,
        category: editForm.category || "Other",
        defaultPrice: Number(editForm.defaultPrice),
        chargeType: editForm.chargeType,
        gstApplicable: !!editForm.gstApplicable,
        gstPercentage: Number(editForm.gstPercentage || 0),
        isFood: !!editForm.isFood,
        status: editForm.status || "active",
      })

      toast({
        title: "Updated",
        description: "Service updated successfully",
      })

      setIsEditOpen(false)
      setSelectedService(null)
      fetchData()

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDeleteService = async (id: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this service?")

    if (!confirmDelete) return

    try {
      await deleteSetupService(id)

      toast({
        title: "Deleted",
        description: "Service deleted successfully",
      })

      fetchData()

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // Company handlers
  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company)
    setCompanyForm({
      name: company.name,
      code: company.code || "",
      contactPerson: company.contactPerson || "",
      phone: company.phone || "",
      email: company.email || "",
      address: company.address || "",
      gstNumber: company.gstNumber || "",
      type: (company as any).type || "Company",
      creditAllowed: company.creditAllowed,
      creditLimit: company.creditLimit,
      status: company.status
    })
    setIsCompanyModalOpen(true)
  }

  const handleDeleteCompany = async (id: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this company?")
    if (!confirmDelete) return

    try {
      const company = companies.find((item) => item._id === id)
      if ((company as any)?.__source === "travelAgent") {
        await deleteTravelAgent(id)
      } else {
        await deleteCompany(id)
      }
      toast({
        title: "Deleted",
        description: "Registration deleted successfully",
      })
      setCompanies((prev) => prev.filter((item) => item._id !== id))
      fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleSaveCompany = async () => {
    try {
      if (!companyForm.name.trim()) {
        toast({
          title: "Error",
          description: "Name is required",
          variant: "destructive",
        })
        return
      }

      let savedRegistration: any = null
      if (selectedCompany) {
        savedRegistration = (selectedCompany as any).__source === "travelAgent"
          ? normalizeRegistration(await updateTravelAgent(selectedCompany._id, companyForm), "Travel Agent", "travelAgent")
          : normalizeRegistration(await updateCompany(selectedCompany._id, companyForm), companyForm.type, "company")
        toast({
          title: "Updated",
          description: "Registration updated successfully",
        })
      } else {
        savedRegistration = companyForm.type === "Travel Agent"
          ? normalizeRegistration(await createTravelAgent(companyForm), "Travel Agent", "travelAgent")
          : normalizeRegistration(await createCompany(companyForm), companyForm.type, "company")
        if (!savedRegistration._id) {
          savedRegistration = normalizeRegistration(
            { ...companyForm, _id: `local-${companyForm.type}-${Date.now()}` },
            companyForm.type,
            companyForm.type === "Travel Agent" ? "travelAgent" : "company"
          )
        }
        toast({
          title: "Created",
          description: "Company created successfully",
        })
      }
      cacheCompanyRegistrations([savedRegistration])
      upsertRegistration(savedRegistration)
      setIsCompanyModalOpen(false)
      setSelectedCompany(null)
      setCompanyForm({
        name: "",
        code: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
        gstNumber: "",
        type: "Company",
        creditAllowed: false,
        creditLimit: 0,
        status: true
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Front Office Setup</h1>
          <p className="text-sm text-muted-foreground">Configure room types, floor-wise rooms, rate plans, and other settings</p>
        </div>
        {user?.needsSetup && (
          <Button 
            onClick={handleFinishSetup} 
            disabled={isFinishing}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isFinishing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Finish Setup
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="room-config"><Layers className="h-4 w-4 mr-1.5" />Room Configuration</TabsTrigger>
          <TabsTrigger value="room-types"><BedDouble className="h-4 w-4 mr-1.5" />Room Types</TabsTrigger>
          <TabsTrigger value="rate-plans"><CreditCard className="h-4 w-4 mr-1.5" />Rate Plans</TabsTrigger>
          <TabsTrigger value="service-codes"><Tags className="h-4 w-4 mr-1.5" />Services</TabsTrigger>
          <TabsTrigger value="companies"><Building className="h-4 w-4 mr-1.5" />Company Registration</TabsTrigger>
          <TabsTrigger value="hotel-config"><Building className="h-4 w-4 mr-1.5" />Hotel Config</TabsTrigger>
          <TabsTrigger value="master-data"><Settings className="h-4 w-4 mr-1.5" />Master Data</TabsTrigger>
        </TabsList>

        {/* Room Configuration Tab */}
        <TabsContent value="room-config" className="mt-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Floor-wise Room Configuration</CardTitle>
                <CardDescription>
                  Configure rooms by floor. Total: {totalRooms} rooms across {floors.length} floors.
                  {hotelConfig?.totalRooms && (
                    <span className="ml-1 font-medium text-primary">Limit: {hotelConfig.totalRooms} rooms</span>
                  )}
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsAddFloorOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />Add Floor
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {floors.sort((a, b) => a.floorNumber - b.floorNumber).map((floor) => (
                <Collapsible
                  key={floor._id}
                  open={expandedFloors.includes(floor._id)}
                  onOpenChange={() => toggleFloor(floor._id)}
                >
                  <div className="border rounded-lg">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          {expandedFloors.includes(floor._id) ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{floor.name}</p>
                              {floor.floorType === "banquet" && <Badge variant="outline">Banquet Hall</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {floor.floorType === "banquet"
                                ? "Complete floor reserved for banquet hall"
                                : `${floor.totalRooms} rooms - ${floor.rooms.map(r => `${r.count} ${r.roomTypeName} ${r.acType === "AC" ? "AC" : "Non AC"}`).join(", ") || "No rooms configured"}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{floor.floorType === "banquet" ? "Banquet" : `${floor.totalRooms} Rooms`}</Badge>
                          {floor.floorType !== "banquet" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedFloor(floor)
                                setIsAddRoomToFloorOpen(true)
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />Add Rooms
                            </Button>
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t p-3 bg-muted/30">
                        {floor.floorType === "banquet" ? (
                          <p className="text-sm text-muted-foreground text-center py-4">This complete floor is configured as a banquet hall.</p>
                        ) : floor.rooms.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">No rooms configured for this floor yet.</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Room Type</TableHead>
                                <TableHead>AC Type</TableHead>
                                <TableHead>Count</TableHead>
                                <TableHead>Room Numbers</TableHead>
                                <TableHead>Rates</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {floor.rooms.map((room, index) => {
                                const roomType = roomTypes.find(rt => rt._id === room.roomTypeId)
                                return (
                                  <TableRow key={`${floor._id}-${room.roomTypeId}-${index}`}>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary">{roomType?.code}</Badge>
                                        <span className="font-medium">{room.roomTypeName}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>{room.acType === "AC" ? "AC" : "Non AC"}</TableCell>
                                    <TableCell>{room.count}</TableCell>
                                    <TableCell>
                                      <div className="flex flex-wrap gap-1">
                                        {room.roomNumbers.map(num => (
                                          <Badge key={num} variant="outline" className="text-xs">
                                            {num} {room.roomTypeName} {room.acType === "AC" ? "AC" : "Non AC"}
                                          </Badge>
                                        ))}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      Non AC {formatOptionalRate(roomType?.nonAcRate)} / AC {formatOptionalRate(roomType?.acRate)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleOpenEditRoomConfig(floor, room)}
                                        >
                                          <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="text-destructive"
                                          onClick={() => handleDeleteRoomConfig(floor._id, room.roomTypeId, room.acType)}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Room Types Tab */}
        <TabsContent value="room-types" className="mt-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Room Types</CardTitle>
              <Button size="sm" onClick={() => { setAddType("room-type"); setIsAddOpen(true) }}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />Add Room Type
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Non AC Rate</TableHead>
                    <TableHead>AC Rate</TableHead>
                    <TableHead>Extra Bed Non AC Rate</TableHead>
                    <TableHead>Extra Bed AC Rate</TableHead>
                    <TableHead>Max Occupancy</TableHead>
                    <TableHead>GST</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roomTypes.map((rt) => (
                    <TableRow key={rt._id}>
                      <TableCell className="font-medium">{rt.name}</TableCell>
                      <TableCell><Badge variant="secondary">{rt.code}</Badge></TableCell>
                      <TableCell>{formatOptionalRate(rt.nonAcRate)}</TableCell>
                      <TableCell>{formatOptionalRate(rt.acRate)}</TableCell>
                      <TableCell>{formatOptionalRate(rt.extraBedNonAcRate)}</TableCell>
                      <TableCell>{formatOptionalRate(rt.extraBedAcRate)}</TableCell>
                      <TableCell>{rt.maxOccupancy}</TableCell>
                      <TableCell>
                        {rt.gstPercentage ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-medium">{rt.gstPercentage}%</span>
                            <span className="text-[10px] text-muted-foreground uppercase">{rt.gstType}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">No GST</span>
                        )}
                      </TableCell>
                      <TableCell><Badge className="bg-primary/10 text-primary border-primary/20">{rt.status || "Active"}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => {
                            setSelectedRoomType(rt)
                            setEditForm({
                              name: rt.name,
                              code: rt.code,
                              nonAcRate: rt.nonAcRate ?? rt.baseRate,
                              acRate: rt.acRate ?? rt.baseRate,
                              extraBedNonAcRate: rt.extraBedNonAcRate ?? 0,
                              extraBedAcRate: rt.extraBedAcRate ?? 0,
                              maxOccupancy: rt.maxOccupancy,
                              gstPercentage: rt.gstPercentage || 0,
                              gstType: rt.gstType || "EXCLUSIVE",
                              status: rt.status || "active",
                            })
                            setIsEditOpen(true)
                          }}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteRoomType(rt._id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rate Plans Tab */}
        <TabsContent value="rate-plans" className="mt-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Rate Plans</CardTitle>
              <Button size="sm" onClick={() => { setAddType("rate-plan"); setGenericForm({ foodIncluded: false }); setIsAddOpen(true) }}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />Add Rate Plan
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Food Included</TableHead>
                    <TableHead>Meal Type</TableHead>
                    <TableHead>Food Charge</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ratePlans.map((rp) => (
                    <TableRow key={rp._id}>
                      <TableCell className="font-medium">{rp.name}</TableCell>
                      <TableCell><Badge variant="secondary">{rp.code}</Badge></TableCell>
                      <TableCell>{rp.description}</TableCell>
                      <TableCell>{rp.foodIncluded ? <Badge variant="secondary">Yes</Badge> : <Badge variant="outline">No</Badge>}</TableCell>
                      <TableCell>{rp.foodIncluded ? rp.mealType || "-" : "-"}</TableCell>
                      <TableCell>{rp.foodIncluded ? Number(rp.foodCharge || 0).toFixed(2) : "-"}</TableCell>
                      <TableCell><Badge className="bg-primary/10 text-primary border-primary/20">{rp.status || "Active"}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => {
                            setSelectedRatePlan(rp)
                            setEditForm({
                              name: rp.name,
                              code: rp.code,
                              description: rp.description,
                              foodIncluded: !!rp.foodIncluded,
                              mealType: rp.mealType || "",
                              foodCharge: rp.foodCharge || 0,
                              status: rp.status || "active",
                            })
                            setIsEditOpen(true)
                          }}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteRatePlan(rp._id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Codes Tab */}
        <TabsContent value="service-codes" className="mt-3 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Services</CardTitle>
                <CardDescription>Master list of unified services available for guest billing</CardDescription>
              </div>
              <Button size="sm" onClick={() => { setAddType("service"); setIsAddOpen(true) }}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />Add Service
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Service Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Default Price</TableHead>
                    <TableHead>Charge Type</TableHead>
                    <TableHead>GST</TableHead>
                    <TableHead>Food Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((s) => (
                    <TableRow key={s._id}>
                      <TableCell><Badge variant="secondary">{s.code}</Badge></TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.category || "Other"}</TableCell>
                      <TableCell>Rs. {s.defaultPrice}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {s.chargeType === "PER_DAY" ? "Per Day" : "Per Stay"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {s.gstPercentage > 0 ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">
                            {s.gstPercentage}%
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">No GST</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {s.isFood ? (
                          <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[10px]">YES</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">NO</Badge>
                        )}
                      </TableCell>
                      <TableCell><Badge className="bg-primary/10 text-primary border-primary/20">{s.status || "Active"}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => {
                            setSelectedService(s)
                            setEditForm({
                              name: s.name,
                              code: s.code,
                              defaultPrice: s.defaultPrice,
                              chargeType: s.chargeType || "PER_STAY",
                              gstPercentage: s.gstPercentage || 0,
                              gstApplicable: !!s.gstApplicable,
                              isFood: !!s.isFood,
                              status: s.status || "active",
                            })
                            setIsEditOpen(true)
                          }}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteService(s._id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {services.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center py-4 text-muted-foreground">No global services configured</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Registration Tab */}
        <TabsContent value="companies" className="mt-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Company Registration</CardTitle>
                <CardDescription>Manage companies and travel agents for bookings</CardDescription>
              </div>
              <Button size="sm" onClick={() => {
                setSelectedCompany(null);
                setCompanyForm({
                  name: "",
                  code: "",
                  contactPerson: "",
                  phone: "",
                  email: "",
                  address: "",
                  gstNumber: "",
                  type: "Company",
                  creditAllowed: false,
                  creditLimit: 0,
                  status: true
                });
                setIsCompanyModalOpen(true);
              }}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />Add Registration
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>GST Number</TableHead>
                    <TableHead>Credit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company._id}>
                      <TableCell>
                        <Badge variant="outline" className={
                          company.type === "Company" ? "bg-blue-50 text-blue-700 border-blue-200" :
                            company.type === "Travel Agent" ? "bg-purple-50 text-purple-700 border-purple-200" :
                              "bg-orange-50 text-orange-700 border-orange-200"
                        }>
                          {company.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {company.code ? <Badge variant="secondary">{company.code}</Badge> : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {company.contactPerson && <div>{company.contactPerson}</div>}
                          {company.phone && <div className="text-muted-foreground">{company.phone}</div>}
                          {company.email && <div className="text-muted-foreground">{company.email}</div>}
                        </div>
                      </TableCell>
                      <TableCell>{company.gstNumber || "-"}</TableCell>
                      <TableCell>
                        {company.creditAllowed ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            Rs. {company.creditLimit.toLocaleString()}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">No Credit</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={company.status ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}>
                          {company.status ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEditCompany(company)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteCompany(company._id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {companies.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center py-4 text-muted-foreground">No registrations configured</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hotel Config Tab */}
        <TabsContent value="hotel-config" className="mt-3">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Hotel Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Hotel Name</Label><Input value={hotelConfigForm.name || ""} onChange={(e) => setHotelConfigForm({ ...hotelConfigForm, name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Address</Label><Input value={hotelConfigForm.address || ""} onChange={(e) => setHotelConfigForm({ ...hotelConfigForm, address: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Phone</Label><Input value={hotelConfigForm.phone || ""} onChange={(e) => setHotelConfigForm({ ...hotelConfigForm, phone: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input value={hotelConfigForm.email || ""} onChange={(e) => setHotelConfigForm({ ...hotelConfigForm, email: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>GST Number</Label><Input value={hotelConfigForm.gstNumber || ""} onChange={(e) => setHotelConfigForm({ ...hotelConfigForm, gstNumber: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Hotel Logo</Label>
                  <div className="flex items-center gap-3 rounded-md border border-input p-3">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                      {hotelLogoPreview ? (
                        <img src={hotelLogoPreview} alt="Hotel logo preview" className="h-full w-full object-contain" />
                      ) : (
                        <ImageIcon className="h-7 w-7 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{hotelLogoName}</p>
                      <p className="text-xs text-muted-foreground">Saved under hotel logo folder in S3</p>
                    </div>
                    <Input id="hotel-logo-upload" type="file" accept="image/*" className="hidden" onChange={handleHotelLogoChange} />
                    <Button type="button" variant="outline" size="sm" asChild disabled={isHotelLogoUploading}>
                      <Label htmlFor="hotel-logo-upload" className="cursor-pointer">
                        {isHotelLogoUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        Upload
                      </Label>
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Total Floors</Label><Input type="number" value={floors.length} readOnly /></div>
                  <div className="space-y-2"><Label>Total Rooms</Label><Input type="number" value={totalRooms} readOnly /></div>
                </div>
                <Button className="w-full" onClick={handleSaveHotelConfig} disabled={isHotelLogoUploading || isPaymentQrUploading}>
                  {(isHotelLogoUploading || isPaymentQrUploading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Hotel Details
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bank Account Details</CardTitle>
                <CardDescription>Configure bank account details to be printed on guest invoices.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Account Name</Label>
                  <Input 
                    value={hotelConfigForm.bankDetails?.accountName || ""} 
                    onChange={(e) => setHotelConfigForm({ 
                      ...hotelConfigForm, 
                      bankDetails: { ...hotelConfigForm.bankDetails, accountName: e.target.value } 
                    })} 
                    placeholder="e.g., Grand Hotel Pvt Ltd"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input 
                    value={hotelConfigForm.bankDetails?.accountNumber || ""} 
                    onChange={(e) => setHotelConfigForm({ 
                      ...hotelConfigForm, 
                      bankDetails: { ...hotelConfigForm.bankDetails, accountNumber: e.target.value } 
                    })} 
                    placeholder="Enter account number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input 
                    value={hotelConfigForm.bankDetails?.bankName || ""} 
                    onChange={(e) => setHotelConfigForm({ 
                      ...hotelConfigForm, 
                      bankDetails: { ...hotelConfigForm.bankDetails, bankName: e.target.value } 
                    })} 
                    placeholder="e.g., HDFC Bank, SBI"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>IFSC / SWIFT Code</Label>
                    <Input 
                      value={hotelConfigForm.bankDetails?.ifscCode || ""} 
                      onChange={(e) => setHotelConfigForm({ 
                        ...hotelConfigForm, 
                        bankDetails: { ...hotelConfigForm.bankDetails, ifscCode: e.target.value.toUpperCase() } 
                      })} 
                      placeholder="IFSC Code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Branch Name</Label>
                    <Input 
                      value={hotelConfigForm.bankDetails?.branchName || ""} 
                      onChange={(e) => setHotelConfigForm({ 
                        ...hotelConfigForm, 
                        bankDetails: { ...hotelConfigForm.bankDetails, branchName: e.target.value } 
                      })} 
                      placeholder="Branch"
                    />
                  </div>
                  
                </div>
                <div className="space-y-2">
                  <Label>Payment QR Code</Label>
                  <div className="flex items-center gap-3 rounded-md border border-input p-3">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                      {paymentQrPreview ? (
                        <img src={paymentQrPreview} alt="Payment QR preview" className="h-full w-full object-contain" />
                      ) : (
                        <ImageIcon className="h-7 w-7 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{paymentQrFile?.name || hotelConfigForm.paymentQrCode?.fileName || "No QR code selected"}</p>
                      <p className="text-xs text-muted-foreground">Saved under hotel QRCode folder in S3</p>
                    </div>
                    <Input id="payment-qr-upload" type="file" accept="image/*" className="hidden" onChange={handlePaymentQrChange} />
                    <Button type="button" variant="outline" size="sm" asChild disabled={isPaymentQrUploading}>
                      <Label htmlFor="payment-qr-upload" className="cursor-pointer">
                        {isPaymentQrUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        Upload
                      </Label>
                    </Button>
                  </div>
                </div>
                <Button className="w-full" onClick={handleSaveHotelConfig}>Save Bank Details</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Operational Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Check-In Time</Label>
                  <Input type="time" value={hotelConfigForm.checkInTime || "14:00"} onChange={(e) => setHotelConfigForm({ ...hotelConfigForm, checkInTime: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Check-Out Time</Label>
                  <Input type="time" value={hotelConfigForm.checkOutTime || "11:00"} onChange={(e) => setHotelConfigForm({ ...hotelConfigForm, checkOutTime: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Select value={hotelConfigForm.currency || "INR"} onValueChange={(val) => setHotelConfigForm({ ...hotelConfigForm, currency: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (Indian Rupee)</SelectItem>
                      <SelectItem value="USD">USD (US Dollar)</SelectItem>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                      <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select value={hotelConfigForm.dateFormat || "DD-MM-YYYY"} onValueChange={(val) => setHotelConfigForm({ ...hotelConfigForm, dateFormat: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
                      <SelectItem value="MM-DD-YYYY">MM-DD-YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Night Audit Time</Label>
                    <Input
                      type="time"
                      value={hotelConfigForm.nightAuditTime || "00:00"}
                      onChange={(e) => setHotelConfigForm({ ...hotelConfigForm, nightAuditTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Night Audit</Label>
                    <Select
                      value={hotelConfigForm.nightAuditEnabled === false ? "disabled" : "enabled"}
                      onValueChange={(val) => setHotelConfigForm({ ...hotelConfigForm, nightAuditEnabled: val === "enabled" })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enabled">Enabled</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  Last night audit: {hotelConfigForm.lastNightAuditAt ? new Date(hotelConfigForm.lastNightAuditAt).toLocaleString() : "Not run yet"}
                </div>
                <Button className="w-full" onClick={handleSaveHotelConfig}>Save Settings</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Booking Number Settings</CardTitle>
                <CardDescription>Configure the readable booking sequence used for new reservations and check-ins.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Prefix</Label>
                    <Input
                      value={hotelConfigForm.bookingPrefix || ""}
                      onChange={(e) => setHotelConfigForm({ ...hotelConfigForm, bookingPrefix: e.target.value.toUpperCase() })}
                      placeholder="NOV"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Number</Label>
                    <Input
                      type="number"
                      min={1}
                      value={hotelConfigForm.startNumber ?? 1}
                      onChange={(e) => setHotelConfigForm({ ...hotelConfigForm, startNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Digit Length</Label>
                    <Input
                      type="number"
                      min={1}
                      value={hotelConfigForm.digitLength ?? 4}
                      onChange={(e) => setHotelConfigForm({ ...hotelConfigForm, digitLength: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Current Running Number</Label>
                    <Input
                      type="number"
                      min={1}
                      value={hotelConfigForm.currentNumber ?? 1}
                      onChange={(e) => setHotelConfigForm({ ...hotelConfigForm, currentNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Financial Year Format</Label>
                    <Select
                      value={hotelConfigForm.financialYearFormat || "YYYY-YY"}
                      onValueChange={(val) => setHotelConfigForm({ ...hotelConfigForm, financialYearFormat: val })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="YYYY-YY">2026-27</SelectItem>
                        <SelectItem value="YYYY-YYYY">2026-2027</SelectItem>
                        <SelectItem value="YY-YY">26-27</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Current Financial Year</Label>
                    <Input
                      value={hotelConfigForm.currentFinancialYear || ""}
                      onChange={(e) => setHotelConfigForm({ ...hotelConfigForm, currentFinancialYear: e.target.value })}
                      placeholder="Auto on first booking"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={hotelConfigForm.resetFinancialYear !== false}
                      onCheckedChange={(checked) => setHotelConfigForm({ ...hotelConfigForm, resetFinancialYear: checked })}
                    />
                    <Label>Reset Every Financial Year</Label>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Preview: </span>
                    <span className="font-semibold">{bookingPreview}</span>
                  </div>
                </div>
                <Button className="w-full" onClick={handleSaveHotelConfig}>Save Booking Number Settings</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="master-data" className="mt-3">
          <MasterDataPanel />
        </TabsContent>
      </Tabs>

      {/* Add Floor Dialog */}
      <Dialog open={isAddFloorOpen} onOpenChange={setIsAddFloorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Floor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Floor Name</Label>
              <Input
                placeholder="e.g., Fourth Floor, Penthouse"
                value={newFloor.name}
                onChange={(e) => setNewFloor({ ...newFloor, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Floor Number</Label>
              <Input
                type="number"
                placeholder="e.g., 4"
                value={newFloor.floorNumber}
                onChange={(e) => setNewFloor({ ...newFloor, floorNumber: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Use 0 for Ground Floor</p>
            </div>
            <div className="space-y-2">
              <Label>Floor Use</Label>
              <Select
                value={newFloor.floorType}
                onValueChange={(value: "rooms" | "banquet") => setNewFloor({ ...newFloor, floorType: value })}
              >
                <SelectTrigger><SelectValue placeholder="Select floor use" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rooms">Guest Rooms</SelectItem>
                  <SelectItem value="banquet">Banquet Hall</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddFloorOpen(false)}>Cancel</Button>
            <Button onClick={handleAddFloor} disabled={!newFloor.name || !newFloor.floorNumber}>Add Floor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Rooms to Floor Dialog */}
      <Dialog open={isAddRoomToFloorOpen} onOpenChange={(open) => {
        setIsAddRoomToFloorOpen(open)
        if (!open) {
          setIsEditingRoomConfig(false)
          setOldRoomTypeId(null)
          setOldAcType(null)
          setNewRoomConfig({ roomTypeId: "", acType: "NON_AC", count: "", startNumber: "" })
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditingRoomConfig ? "Edit Room Configuration" : `Add Rooms to ${selectedFloor?.name}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Room Type</Label>
              <Select
                value={newRoomConfig.roomTypeId}
                onValueChange={(val) => setNewRoomConfig({ ...newRoomConfig, roomTypeId: val })}
              >
                <SelectTrigger><SelectValue placeholder="Select room type" /></SelectTrigger>
                <SelectContent>
                  {roomTypes.map(rt => (
                    <SelectItem key={rt._id} value={String(rt._id)}>
                      {rt.name} ({rt.code}) - Non AC {formatOptionalRate(rt.nonAcRate)} / AC {formatOptionalRate(rt.acRate)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>AC Type</Label>
              <Select
                value={newRoomConfig.acType}
                onValueChange={(value: "AC" | "NON_AC") => setNewRoomConfig({ ...newRoomConfig, acType: value })}
              >
                <SelectTrigger><SelectValue placeholder="Select AC type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AC">AC</SelectItem>
                  <SelectItem value="NON_AC">Non AC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Number of Rooms</Label>
                <Input
                  type="number"
                  placeholder="e.g., 5"
                  value={newRoomConfig.count}
                  onChange={(e) => setNewRoomConfig({ ...newRoomConfig, count: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Starting Room Number</Label>
                <Input
                  type="text"
                  placeholder="e.g., 101 or G01"
                  value={newRoomConfig.startNumber}
                  onChange={(e) => setNewRoomConfig({ ...newRoomConfig, startNumber: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Rooms: {roomConfigPreview}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { 
              setIsAddRoomToFloorOpen(false)
              setIsEditingRoomConfig(false)
              setOldRoomTypeId(null)
              setOldAcType(null)
              setSelectedFloor(null)
              setNewRoomConfig({ roomTypeId: "", acType: "NON_AC", count: "", startNumber: "" })
            }}>Cancel</Button>
            <Button onClick={handleAddRoomToFloor} disabled={!newRoomConfig.roomTypeId || !newRoomConfig.acType || !newRoomConfig.count}>
              {isEditingRoomConfig ? "Update Configuration" : "Add Rooms"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generic Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {addType === "room-type" ? "Add Room Type" : addType === "rate-plan" ? "Add Rate Plan" : addType === "service" ? "Add Service" : "Add Service Code"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name</Label><Input
                value={genericForm.name || ""}
                onChange={(e) =>
                  setGenericForm({ ...genericForm, name: e.target.value })
                }
              /></div>
              <div className="space-y-2"><Label>Code</Label><Input
                placeholder="Code"
                value={genericForm.code || ""}
                onChange={(e) =>
                  setGenericForm({ ...genericForm, code: e.target.value.toUpperCase() })
                }
              /></div>
            </div>
            {addType === "service" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={genericForm.category || "Other"}
                      onValueChange={(val) => setGenericForm({ ...genericForm, category: val })}
                    >
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Accommodation">Accommodation</SelectItem>
                        <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                        <SelectItem value="Laundry">Laundry</SelectItem>
                        <SelectItem value="Transport">Transport</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Default Price</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={genericForm.defaultPrice || ""}
                      onChange={(e) => setGenericForm({ ...genericForm, defaultPrice: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Charge Type</Label>
                    <Select
                      value={genericForm.chargeType || "PER_STAY"}
                      onValueChange={(val) => setGenericForm({ ...genericForm, chargeType: val })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PER_STAY">Per Stay</SelectItem>
                        <SelectItem value="PER_DAY">Per Day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>GST %</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={genericForm.gstPercentage || ""}
                      onChange={(e) => setGenericForm({ ...genericForm, gstPercentage: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="is-food"
                      checked={genericForm.isFood || false}
                      onCheckedChange={(val) => setGenericForm({ ...genericForm, isFood: val })}
                    />
                    <Label htmlFor="is-food">Food Service</Label>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="gst-applicable"
                      checked={genericForm.gstApplicable || false}
                      onCheckedChange={(val) => setGenericForm({ ...genericForm, gstApplicable: val })}
                    />
                    <Label htmlFor="gst-applicable">GST Applicable</Label>
                  </div>
                </div>
              </div>
            )}
            {addType === "room-type" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Non AC Rate</Label><Input
                    type="number"
                    placeholder="Optional"
                    value={genericForm.nonAcRate || ""}
                    onChange={(e) =>
                      setGenericForm({ ...genericForm, nonAcRate: e.target.value })
                    }
                  /></div>
                  <div className="space-y-2"><Label>AC Rate</Label><Input
                    type="number"
                    placeholder="Optional"
                    value={genericForm.acRate || ""}
                    onChange={(e) =>
                      setGenericForm({ ...genericForm, acRate: e.target.value })
                    }
                  /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Extra Bed Non AC Rate</Label><Input
                    type="number"
                    placeholder="0"
                    value={genericForm.extraBedNonAcRate || ""}
                    onChange={(e) =>
                      setGenericForm({ ...genericForm, extraBedNonAcRate: e.target.value })
                    }
                  /></div>
                  <div className="space-y-2"><Label>Extra Bed AC Rate</Label><Input
                    type="number"
                    placeholder="0"
                    value={genericForm.extraBedAcRate || ""}
                    onChange={(e) =>
                      setGenericForm({ ...genericForm, extraBedAcRate: e.target.value })
                    }
                  /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Max Occupancy</Label><Input
                    type="number"
                    placeholder="2"
                    value={genericForm.maxOccupancy || ""}
                    onChange={(e) =>
                      setGenericForm({ ...genericForm, maxOccupancy: e.target.value })
                    }
                  /></div>
                  <div className="space-y-2"><Label>GST %</Label><Input
                    type="number"
                    placeholder="0"
                    value={genericForm.gstPercentage || ""}
                    onChange={(e) =>
                      setGenericForm({ ...genericForm, gstPercentage: e.target.value })
                    }
                  /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>GST Type</Label>
                    <Select
                      value={genericForm.gstType || "EXCLUSIVE"}
                      onValueChange={(val) => setGenericForm({ ...genericForm, gstType: val })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EXCLUSIVE">Exclusive</SelectItem>
                        <SelectItem value="INCLUSIVE">Inclusive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
            {addType === "rate-plan" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="e.g., European Plan, Bed & Breakfast"
                    value={genericForm.description || ""}
                    onChange={(e) =>
                      setGenericForm({ ...genericForm, description: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="rate-plan-food-included"
                    checked={!!genericForm.foodIncluded}
                    onCheckedChange={(value) =>
                      setGenericForm({
                        ...genericForm,
                        foodIncluded: value,
                        mealType: value ? genericForm.mealType || "" : "",
                        foodCharge: value ? genericForm.foodCharge || "" : "",
                      })
                    }
                  />
                  <Label htmlFor="rate-plan-food-included">Food Included</Label>
                </div>
                {genericForm.foodIncluded && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Meal Type</Label>
                      <Input
                        placeholder="e.g., CP, MAP, AP"
                        value={genericForm.mealType || ""}
                        onChange={(e) => setGenericForm({ ...genericForm, mealType: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Food Charge</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0.00"
                        value={genericForm.foodCharge || ""}
                        onChange={(e) => setGenericForm({ ...genericForm, foodCharge: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={
              addType === "room-type"
                ? handleCreateRoomType
                : addType === "rate-plan"
                  ? handleCreateRatePlan
                  : handleCreateService
            }>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <EditDetailsModal
        open={isEditOpen}
        onOpenChange={(open: boolean) => {
          setIsEditOpen(open)
          if (!open) {
            setSelectedRoomType(null)
            setSelectedRatePlan(null)
          }
        }}
        title={selectedRoomType ? "Edit Room Type" : selectedRatePlan ? "Edit Rate Plan" : selectedService ? "Edit Service" : "Edit Item"}
        formData={editForm}
        setFormData={setEditForm}
        fields={
          selectedRoomType
            ? [
              { name: "name", label: "Name" },
              { name: "code", label: "Code" },
              { name: "nonAcRate", label: "Non AC Rate", type: "number" },
              { name: "acRate", label: "AC Rate", type: "number" },
              { name: "extraBedNonAcRate", label: "Extra Bed Non AC Rate", type: "number" },
              { name: "extraBedAcRate", label: "Extra Bed AC Rate", type: "number" },
              { name: "maxOccupancy", label: "Max Occupancy", type: "number" },
              { name: "gstPercentage", label: "GST %", type: "number" },
            ]
            : selectedRatePlan
              ? [
                { name: "name", label: "Name" },
                { name: "code", label: "Code" },
                { name: "description", label: "Description" },
              ]
              : selectedService
                ? [
                  { name: "name", label: "Name" },
                  { name: "code", label: "Code" },
                  { name: "defaultPrice", label: "Default Price", type: "number" },
                  { name: "gstPercentage", label: "GST %", type: "number" },
                ]
                : []
        }
        onSubmit={
          selectedRoomType
            ? handleUpdateRoomType
            : selectedRatePlan
              ? handleUpdateRatePlan
              : handleUpdateService
        }
      >
        {(selectedRoomType || selectedRatePlan || selectedService) && (
          <div className="space-y-4 pt-4">
            {selectedService && (
              <>
                <div className="space-y-2">
                  <Label>Charge Type</Label>
                  <Select
                    value={editForm.chargeType || "PER_STAY"}
                    onValueChange={(val) => setEditForm({ ...editForm, chargeType: val })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PER_STAY">Per Stay</SelectItem>
                      <SelectItem value="PER_DAY">Per Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-is-food"
                    checked={editForm.isFood || false}
                    onCheckedChange={(val) => setEditForm({ ...editForm, isFood: val })}
                  />
                  <Label htmlFor="edit-is-food">Food Service</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-gst-applicable"
                    checked={editForm.gstApplicable || false}
                    onCheckedChange={(val) => setEditForm({ ...editForm, gstApplicable: val })}
                  />
                  <Label htmlFor="edit-gst-applicable">GST Applicable</Label>
                </div>
              </>
            )}
            {selectedRoomType && (
              <div className="space-y-2">
                <Label>GST Type</Label>
                <Select
                  value={editForm.gstType || "EXCLUSIVE"}
                  onValueChange={(value) => setEditForm({ ...editForm, gstType: value })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXCLUSIVE">Exclusive</SelectItem>
                    <SelectItem value="INCLUSIVE">Inclusive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {selectedRatePlan && (
              <>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-rate-plan-food-included"
                    checked={!!editForm.foodIncluded}
                    onCheckedChange={(value) =>
                      setEditForm({
                        ...editForm,
                        foodIncluded: value,
                        mealType: value ? editForm.mealType || "" : "",
                        foodCharge: value ? editForm.foodCharge || "" : "",
                      })
                    }
                  />
                  <Label htmlFor="edit-rate-plan-food-included">Food Included</Label>
                </div>
                {editForm.foodIncluded && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Meal Type</Label>
                      <Input
                        placeholder="e.g., CP, MAP, AP"
                        value={editForm.mealType || ""}
                        onChange={(e) => setEditForm({ ...editForm, mealType: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Food Charge</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0.00"
                        value={editForm.foodCharge || ""}
                        onChange={(e) => setEditForm({ ...editForm, foodCharge: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={editForm.status || "active"}
                onValueChange={(value) => setEditForm({ ...editForm, status: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </EditDetailsModal>

      {/* Company Modal */}
      <Dialog open={isCompanyModalOpen} onOpenChange={setIsCompanyModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCompany ? "Edit Registration" : "Add Registration"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="registration-type">Type *</Label>
              <Select
                value={companyForm.type}
                onValueChange={(val: any) => setCompanyForm({ ...companyForm, type: val })}
              >
                <SelectTrigger id="registration-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Company">Company</SelectItem>
                  <SelectItem value="Travel Agent">Travel Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-name">Name *</Label>
              <Input
                id="company-name"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-code">Code</Label>
              <Input
                id="company-code"
                value={companyForm.code}
                onChange={(e) => setCompanyForm({ ...companyForm, code: e.target.value.toUpperCase() })}
                placeholder="Enter code"
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-person">Contact Person</Label>
              <Input
                id="contact-person"
                value={companyForm.contactPerson}
                onChange={(e) => setCompanyForm({ ...companyForm, contactPerson: e.target.value })}
                placeholder="Enter contact person name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={companyForm.phone}
                onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={companyForm.email}
                onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                placeholder="Enter email address"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gst-number">GST Number</Label>
              <Input
                id="gst-number"
                value={companyForm.gstNumber}
                onChange={(e) => setCompanyForm({ ...companyForm, gstNumber: e.target.value })}
                placeholder="Enter GST number"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={companyForm.address}
                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                placeholder="Enter company address"
              />
            </div>
            <div className="space-y-2">
              <Label>Credit Allowed</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={companyForm.creditAllowed}
                  onCheckedChange={(val) => setCompanyForm({ ...companyForm, creditAllowed: val })}
                />
                <Label>{companyForm.creditAllowed ? "Yes" : "No"}</Label>
              </div>
            </div>
            {companyForm.creditAllowed && (
              <div className="space-y-2">
                <Label htmlFor="credit-limit">Credit Limit (Rs.)</Label>
                <Input
                  id="credit-limit"
                  type="number"
                  value={companyForm.creditLimit}
                  onChange={(e) => setCompanyForm({ ...companyForm, creditLimit: Number(e.target.value) })}
                  placeholder="Enter credit limit"
                  min="0"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={companyForm.status}
                  onCheckedChange={(val) => setCompanyForm({ ...companyForm, status: val })}
                />
                <Label>{companyForm.status ? "Active" : "Inactive"}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompanyModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCompany}>
              {selectedCompany ? "Update" : "Create"} Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
