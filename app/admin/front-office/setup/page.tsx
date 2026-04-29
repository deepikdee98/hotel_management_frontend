"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Plus, Pencil, Trash2, BedDouble, CreditCard, Tags, Building, Layers, ChevronDown, ChevronRight, Loader2 } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import EditDetailsModal from "@/components/common/EditDetailsModal"

import {
  getSetupRoomTypes,
  getSetupRatePlans,
  getSetupServiceCodes,
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
  createSetupServiceCode,
  updateSetupServiceCode,
  deleteSetupServiceCode,
  updateSetupHotelConfig,
  deleteSetupRoomConfig
} from "@/lib/backend-api"
import { useToast } from "@/hooks/use-toast"

interface RoomType {
  _id: string
  name: string
  code: string
  baseRate: number
  maxOccupancy: number
  status: string
}

interface FloorRoom {
  roomTypeId: string
  roomTypeName: string
  count: number
  roomNumbers: string[]
}

interface Floor {
  _id: string
  name: string
  floorNumber: number
  totalRooms: number
  rooms: FloorRoom[]
}

export default function FOSetupPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [ratePlans, setRatePlans] = useState<any[]>([])
  const [serviceCodes, setServiceCodes] = useState<any[]>([])
  const [floors, setFloors] = useState<Floor[]>([])
  const [hotelConfig, setHotelConfig] = useState<any>(null)
  const [hotelConfigForm, setHotelConfigForm] = useState<any>({})

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addType, setAddType] = useState("")
  const [expandedFloors, setExpandedFloors] = useState<string[]>([])
  const [isAddFloorOpen, setIsAddFloorOpen] = useState(false)
  const [isAddRoomToFloorOpen, setIsAddRoomToFloorOpen] = useState(false)
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null)

  const [newFloor, setNewFloor] = useState({ name: "", floorNumber: "" })
  const [newRoomConfig, setNewRoomConfig] = useState({ roomTypeId: "", count: "", startNumber: "" })
  const [genericForm, setGenericForm] = useState<any>({})

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [selectedRoomType, setSelectedRoomType] = useState<any>(null)
  const [selectedRatePlan, setSelectedRatePlan] = useState<any>(null)
  const [selectedServiceCode, setSelectedServiceCode] = useState<any>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [rt, rp, sc, fl, hc] = await Promise.all([
        getSetupRoomTypes(),
        getSetupRatePlans(),
        getSetupServiceCodes(),
        getSetupFloors(),
        getSetupHotelConfig()
      ])

      setRoomTypes(rt as unknown as RoomType[])
      setRatePlans(rp)
      setServiceCodes(sc)

      // Map floor data from backend to UI structure
      const mappedFloors: Floor[] = fl.map((f: any) => ({
        _id: f._id,
        name: f.name,
        floorNumber: f.floorNumber,
        totalRooms: f.roomConfigurations?.reduce((sum: number, rc: any) => sum + rc.count, 0) || 0,
        rooms: f.roomConfigurations?.map((rc: any) => ({
          roomTypeId: rc.roomTypeId?._id || rc.roomTypeId,
          roomTypeName: rc.roomTypeId?.name || "Unknown",
          count: rc.count,
          roomNumbers: rc.rooms || []
        })) || []
      }))

      setFloors(mappedFloors)
      if (mappedFloors.length > 0) {
        setExpandedFloors([mappedFloors[0]._id])
      }
      setHotelConfig(hc)
      setHotelConfigForm({
        name: hc?.name || "",
        address: hc?.address || "",
        phone: hc?.phone || "",
        email: hc?.email || "",
        gstNumber: hc?.gstNumber || "",
        checkInTime: hc?.checkInTime || "14:00",
        checkOutTime: hc?.checkOutTime || "11:00",
        currency: String(hc?.currency || "INR").toUpperCase(),
        dateFormat: String(hc?.dateFormat || "DD-MM-YYYY").toUpperCase(),
        nightAuditTime: hc?.nightAuditTime || "00:00",
        nightAuditEnabled: hc?.nightAuditEnabled ?? true,
        lastNightAuditAt: hc?.lastNightAuditAt || null,
      })
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
    fetchData()
  }, [])

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
        floorNumber: parseInt(newFloor.floorNumber)
      })
      toast({ title: "Success", description: "Floor added successfully" })
      fetchData()
      setNewFloor({ name: "", floorNumber: "" })
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
    const roomType = roomTypes.find(rt => rt._id === newRoomConfig.roomTypeId)
    if (!roomType) return

    const requestedCount = parseInt(newRoomConfig.count)
    const currentTotal = floors.reduce((sum, f) => sum + f.totalRooms, 0)
    const maxAllowed = hotelConfig?.totalRooms || 0

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

      await createSetupRoomConfig(selectedFloor._id, {
        roomTypeId: newRoomConfig.roomTypeId,
        count: requestedCount,
        startingRoomNumber,
        roomNumberFormat,
      })

      toast({ title: "Success", description: "Rooms added successfully" })
      fetchData()
      setNewRoomConfig({ roomTypeId: "", count: "", startNumber: "" })
      setIsAddRoomToFloorOpen(false)
      setSelectedFloor(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add rooms",
        variant: "destructive"
      })
    }
  }

  const handleDeleteRoomConfig = async (floorId: string, roomTypeId: string) => {
    const confirmDelete = confirm("Are you sure you want to remove this room configuration?")
    if (!confirmDelete) return

    try {
      await deleteSetupRoomConfig(floorId, roomTypeId)
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
    if (!hotelConfigForm.name || !hotelConfigForm.address) {
      toast({
        title: "Validation error",
        description: "Hotel name and address are required",
        variant: "destructive"
      })
      return
    }

    try {
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
      })

      const updatedHotel = (result as any)?.hotel || {
        ...hotelConfig,
        ...hotelConfigForm,
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
      })

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
    }
  }

  const totalRooms = floors.reduce((sum, f) => sum + f.totalRooms, 0)


  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg font-medium">Loading setup...</span>
      </div>
    )
  }

  const handleCreateRoomType = async () => {
    if (!genericForm.name || !genericForm.code || !genericForm.baseRate || !genericForm.maxOccupancy) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    try {
      await createSetupRoomType({
        name: genericForm.name,
        code: genericForm.code,
        baseRate: Number(genericForm.baseRate),
        maxOccupancy: Number(genericForm.maxOccupancy),
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

    try {
      await createSetupRatePlan({
        name: genericForm.name,
        code: genericForm.code,
        description: genericForm.description || "",
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
    try {
      await updateSetupRoomType(selectedRoomType._id, {
        name: editForm.name,
        code: editForm.code,
        baseRate: Number(editForm.baseRate),
        maxOccupancy: Number(editForm.maxOccupancy),
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
    try {
      await updateSetupRatePlan(selectedRatePlan._id, {
        name: editForm.name,
        code: editForm.code,
        description: editForm.description,
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

  const handleCreateServiceCode = async () => {
    if (!genericForm.name || !genericForm.code || !genericForm.category) {
      toast({
        title: "Error",
        description: "Name, Code and Category are required",
        variant: "destructive",
      });
      return;
    }

    try {
      await createSetupServiceCode({
        serviceName: genericForm.name,
        code: genericForm.code,
        category: genericForm.category,
        defaultRate: Number(genericForm.rate) || 0,
        gst: Number(genericForm.gstPercent) || 0,
      })

      toast({
        title: "Success",
        description: "Service code created successfully",
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

  const handleUpdateServiceCode = async () => {
    try {
      await updateSetupServiceCode(selectedServiceCode._id, {
        serviceName: editForm.name,
        code: editForm.code,
        category: editForm.category,
        defaultRate: Number(editForm.rate) || 0,
        gst: Number(editForm.gstPercent) || 0,
      })

      toast({
        title: "Updated",
        description: "Service code updated successfully",
      })

      setIsEditOpen(false)
      setSelectedServiceCode(null)
      fetchData()

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDeleteServiceCode = async (id: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this service code?")

    if (!confirmDelete) return

    try {
      await deleteSetupServiceCode(id)

      toast({
        title: "Deleted",
        description: "Service code deleted successfully",
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Front Office Setup</h1>
        <p className="text-sm text-muted-foreground">Configure room types, floor-wise rooms, rate plans, and other settings</p>
      </div>

      <Tabs defaultValue="room-config" className="w-full">
        <TabsList>
          <TabsTrigger value="room-config"><Layers className="h-4 w-4 mr-1.5" />Room Configuration</TabsTrigger>
          <TabsTrigger value="room-types"><BedDouble className="h-4 w-4 mr-1.5" />Room Types</TabsTrigger>
          <TabsTrigger value="rate-plans"><CreditCard className="h-4 w-4 mr-1.5" />Rate Plans</TabsTrigger>
          <TabsTrigger value="service-codes"><Tags className="h-4 w-4 mr-1.5" />Service Codes</TabsTrigger>
          <TabsTrigger value="hotel-config"><Building className="h-4 w-4 mr-1.5" />Hotel Config</TabsTrigger>
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
                            <p className="font-medium">{floor.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {floor.totalRooms} rooms - {floor.rooms.map(r => `${r.count} ${r.roomTypeName}`).join(", ") || "No rooms configured"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{floor.totalRooms} Rooms</Badge>
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
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t p-3 bg-muted/30">
                        {floor.rooms.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">No rooms configured for this floor yet.</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Room Type</TableHead>
                                <TableHead>Count</TableHead>
                                <TableHead>Room Numbers</TableHead>
                                <TableHead>Base Rate</TableHead>
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
                                    <TableCell>{room.count}</TableCell>
                                    <TableCell>
                                      <div className="flex flex-wrap gap-1">
                                        {room.roomNumbers.map(num => (
                                          <Badge key={num} variant="outline" className="text-xs">{num}</Badge>
                                        ))}
                                      </div>
                                    </TableCell>
                                    <TableCell>Rs. {roomType?.baseRate.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive"
                                        onClick={() => handleDeleteRoomConfig(floor._id, room.roomTypeId)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
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
                    <TableHead>Base Rate</TableHead>
                    <TableHead>Max Occupancy</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roomTypes.map((rt) => (
                    <TableRow key={rt._id}>
                      <TableCell className="font-medium">{rt.name}</TableCell>
                      <TableCell><Badge variant="secondary">{rt.code}</Badge></TableCell>
                      <TableCell>Rs. {rt.baseRate.toLocaleString()}</TableCell>
                      <TableCell>{rt.maxOccupancy}</TableCell>
                      <TableCell><Badge className="bg-primary/10 text-primary border-primary/20">{rt.status || "Active"}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => {
                            setSelectedRoomType(rt)
                            setEditForm({
                              name: rt.name,
                              code: rt.code,
                              baseRate: rt.baseRate,
                              maxOccupancy: rt.maxOccupancy,
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
              <Button size="sm" onClick={() => { setAddType("rate-plan"); setIsAddOpen(true) }}>
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
                      <TableCell><Badge className="bg-primary/10 text-primary border-primary/20">{rp.status || "Active"}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => {
                            setSelectedRatePlan(rp)
                            setEditForm({
                              name: rp.name,
                              code: rp.code,
                              description: rp.description,
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
        <TabsContent value="service-codes" className="mt-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Service Codes</CardTitle>
              <Button size="sm" onClick={() => { setAddType("service-code"); setIsAddOpen(true) }}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />Add Service Code
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Service Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Default Rate</TableHead>
                    <TableHead>GST %</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceCodes.map((sc) => (
                    <TableRow key={sc._id}>
                      <TableCell><Badge variant="secondary">{sc.code}</Badge></TableCell>
                      <TableCell className="font-medium">{sc.serviceName}</TableCell>
                      <TableCell>{sc.category}</TableCell>
                      <TableCell>{sc.defaultRate}</TableCell>
                      <TableCell>{sc.gst}%</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => {
                            setSelectedServiceCode(sc)
                            setEditForm({
                              name: sc.serviceName,
                              code: sc.code,
                              category: sc.category,
                              rate: sc.defaultRate,
                              gstPercent: sc.gst,
                            })
                            setIsEditOpen(true)
                          }}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteServiceCode(sc._id)}>
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

        {/* Hotel Config Tab */}
        <TabsContent value="hotel-config" className="mt-3">
          <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Total Floors</Label><Input type="number" value={floors.length} readOnly /></div>
                  <div className="space-y-2"><Label>Total Rooms</Label><Input type="number" value={totalRooms} readOnly /></div>
                </div>
                <Button className="w-full" onClick={handleSaveHotelConfig}>Save Hotel Details</Button>
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
          </div>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddFloorOpen(false)}>Cancel</Button>
            <Button onClick={handleAddFloor} disabled={!newFloor.name || !newFloor.floorNumber}>Add Floor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Rooms to Floor Dialog */}
      <Dialog open={isAddRoomToFloorOpen} onOpenChange={setIsAddRoomToFloorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Rooms to {selectedFloor?.name}</DialogTitle>
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
                      {rt.name} ({rt.code}) - Rs. {rt.baseRate.toLocaleString()}
                    </SelectItem>
                  ))}
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
                  Rooms: {selectedFloor && newRoomConfig.count && newRoomConfig.startNumber
                    ? `${parseInt(newRoomConfig.startNumber)} - ${parseInt(newRoomConfig.startNumber) +
                    parseInt(newRoomConfig.count) -
                    1
                    }`
                    : "Enter values to see range"}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddRoomToFloorOpen(false); setSelectedFloor(null) }}>Cancel</Button>
            <Button onClick={handleAddRoomToFloor} disabled={!newRoomConfig.roomTypeId || !newRoomConfig.count}>Add Rooms</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generic Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {addType === "room-type" ? "Add Room Type" : addType === "rate-plan" ? "Add Rate Plan" : "Add Service Code"}
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
                placeholder="3-letter code"
                maxLength={3}
                value={genericForm.code || ""}
                onChange={(e) =>
                  setGenericForm({ ...genericForm, code: e.target.value.toUpperCase() })
                }
              /></div>
            </div>
            {addType === "room-type" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Base Rate</Label><Input
                  type="number"
                  placeholder="0.00"
                  value={genericForm.baseRate || ""}
                  onChange={(e) =>
                    setGenericForm({ ...genericForm, baseRate: e.target.value })
                  }
                /></div>
                <div className="space-y-2"><Label>Max Occupancy</Label><Input
                  type="number"
                  placeholder="2"
                  value={genericForm.maxOccupancy || ""}
                  onChange={(e) =>
                    setGenericForm({ ...genericForm, maxOccupancy: e.target.value })
                  }
                /></div>

              </div>
            )}
            {addType === "rate-plan" && (
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
            )}
            {addType === "service-code" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={genericForm.category || ""}
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Default Rate</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={genericForm.rate || ""}
                      onChange={(e) => setGenericForm({ ...genericForm, rate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>GST %</Label>
                    <Input
                      type="number"
                      placeholder="18"
                      value={genericForm.gstPercent || ""}
                      onChange={(e) => setGenericForm({ ...genericForm, gstPercent: e.target.value })}
                    />
                  </div>
                </div>
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
                  : handleCreateServiceCode
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
            setSelectedServiceCode(null)
          }
        }}
        title={selectedRoomType ? "Edit Room Type" : selectedRatePlan ? "Edit Rate Plan" : "Edit Service Code"}
        formData={editForm}
        setFormData={setEditForm}
        fields={
          selectedRoomType
            ? [
              { name: "name", label: "Name" },
              { name: "code", label: "Code" },
              { name: "baseRate", label: "Base Rate", type: "number" },
              { name: "maxOccupancy", label: "Max Occupancy", type: "number" },
            ]
            : selectedRatePlan
              ? [
                { name: "name", label: "Name" },
                { name: "code", label: "Code" },
                { name: "description", label: "Description" },
              ]
              : [
                { name: "name", label: "Name" },
                { name: "code", label: "Code" },
                { name: "category", label: "Category" },
                { name: "rate", label: "Rate", type: "number" },
                { name: "gstPercent", label: "GST %", type: "number" },
              ]
        }
        onSubmit={
          selectedRoomType
            ? handleUpdateRoomType
            : selectedRatePlan
              ? handleUpdateRatePlan
              : handleUpdateServiceCode
        }
      >
        {(selectedRoomType || selectedRatePlan) && (
          <div className="space-y-4 pt-4">
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
        )}
      </EditDetailsModal>
    </div>
  )
}
