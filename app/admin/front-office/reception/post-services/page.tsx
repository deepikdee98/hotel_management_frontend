"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Save, RotateCcw, X, Plus, Pencil, Trash2 } from "lucide-react"
import { addService, getServices, deleteService, updateService, getInHouseGuests, getSetupServiceCodes } from "@/lib/backend-api"
import EditDetailsModal from "@/components/common/EditDetailsModal"

export default function PostServicesPage() {
  const [services, setServices] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [serviceCodes, setServiceCodes] = useState<any[]>([])
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({
    serviceId: "",
    serviceName: "",
    roomNo: "",
    qty: "1",
    amount: "0",
    inclusive: false,
    remark: "",
    gst: 0,
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [serviceData, roomData, serviceCodeData] = await Promise.all([
          getServices(),
          getInHouseGuests(),
          getSetupServiceCodes()
        ])

        setServices(serviceData)

        // Deduplicate rooms by ID to avoid duplicate key warnings
        const guestsList = roomData?.data?.guests || []
        const uniqueRooms = Array.from(
          new Map(guestsList.map((r: any) => [r.roomId || r._id || r.id, r])).values()
        )
        setRooms(uniqueRooms)

        setServiceCodes(serviceCodeData)

      } catch (err) {
        console.error(err)
      }
    }

    loadData()
  }, [])

  const handleServiceSelect = (id: string) => {
    const svc = serviceCodes.find(s => (s._id || s.id) === id)
    setForm(prev => ({
      ...prev,
      serviceId: id,
      serviceName: svc ? svc.serviceName : "",
      amount: svc ? String(svc.defaultRate || svc.amount || "0") : "0",
      gst: svc ? Number(svc.gst || 0) : 0
    }))
  }

  const baseAmount = Number(form.qty) * Number(form.amount)
  const totalAmount = form.inclusive
    ? baseAmount
    : baseAmount + (baseAmount * (form.gst / 100))

  const handleSave = async () => {
    try {
      if (!form.serviceId || !form.roomNo || Number(form.qty) < 1 || Number(form.amount) <= 0) {
        alert("Fill all required fields")
        return
      }

      const selectedRoom = rooms.find(r => (r.roomId || r._id || r.id) === form.roomNo)

      const payload = {
        serviceName: form.serviceName,
        serviceId: form.serviceId,
        serviceCodeId: form.serviceId,
        room: form.roomNo,
        roomId: form.roomNo,
        roomNumber: selectedRoom?.roomNumber || selectedRoom?.room?.roomNumber,
        folioId: selectedRoom?.folioId || selectedRoom?._id || selectedRoom?.id || form.roomNo,
        qty: Number(form.qty),
        amount: Number(form.amount),
        total: totalAmount,
        remark: form.remark,
        gstInclusive: form.inclusive,
        category: "service"
      }

      if (editId) {
        await updateService(editId, payload)
        alert("Service updated")
      } else {
        await addService(payload)
        alert("Service added")
      }

      const data = await getServices()
      setServices(data)

      handleReset()

    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to save service")
    }
  }

  const handleReset = () => {
    setForm({ serviceId: "", serviceName: "", roomNo: "", qty: "1", amount: "0", inclusive: false, remark: "", gst: 0 })
    setEditId(null)
  }

  const handleEdit = (s: any) => {
    setEditId(s._id || s.id)

    const roomVal = typeof s.room === 'object' ? (s.room?._id || s.room?.id) : s.room;

    const svc = serviceCodes.find(sc => sc.serviceName === s.serviceName);

    setForm({
      serviceId: svc?._id || svc?.id || "",
      serviceName: s.serviceName,
      roomNo: roomVal || "",
      qty: String(s.qty),
      amount: String(s.amount),
      inclusive: !!s.gstInclusive,
      remark: s.remark || "",
      gst: svc ? Number(svc.gst || 0) : 0
    })
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteService(id)

      alert("Deleted successfully")

      const data = await getServices()
      setServices(data)

    } catch (err: any) {
      console.error(err)
      alert(err.message || "Delete failed")
    }
  }

  const getRoomDisplay = (s: any) => {
    const roomInfo = s.room || s.roomId || s.room_id;
    if (!roomInfo) return s.roomNo || s.roomNumber || s.room_number || "-";

    if (typeof roomInfo === 'object') {
      return roomInfo.roomNumber || roomInfo.number || roomInfo.room_number || "-";
    }

    const room = rooms.find(r => (r._id || r.id || r.roomNumber) === roomInfo);
    return room ? room.roomNumber : (s.roomNumber || s.room_number || roomInfo);
  };

  const totalPostedAmount = services.reduce((sum, s) => sum + (Number(s.total) || 0), 0)

  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Post Other Services</h1>
          <p className="text-sm text-muted-foreground">Add additional service charges to guest folio</p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">New Service Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs">Service Name <span className="text-destructive">*</span></Label>
                <Select value={form.serviceId} onValueChange={handleServiceSelect}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {serviceCodes.map(s => <SelectItem key={s._id || s.id} value={s._id || s.id}>{s.serviceName} - {s.gst}%</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Room No <span className="text-destructive">*</span></Label>
                <Select value={form.roomNo} onValueChange={v => setForm(prev => ({ ...prev, roomNo: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {rooms.map((g: any) => {
                      const roomId = g.roomId || g._id || g.id
                      return (
                        <SelectItem key={roomId} value={roomId}>
                          {g.roomNumber} - {g.guestName}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Qty <span className="text-destructive">*</span></Label>
                <Input className="h-8 text-xs" type="number" min="1" value={form.qty} onChange={e => setForm(prev => ({ ...prev, qty: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Amount <span className="text-destructive">*</span></Label>
                <Input className="h-8 text-xs" type="number" value={form.amount} onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs">Total Amount</Label>
                <Input className="h-8 text-xs bg-muted font-medium" value={totalAmount.toFixed(2)} readOnly />
              </div>
              <div className="flex items-end pb-1">
                <div className="flex items-center gap-2">
                  <Checkbox id="inclusive" checked={form.inclusive} onCheckedChange={(v) => setForm(prev => ({ ...prev, inclusive: !!v }))} />
                  <Label htmlFor="inclusive" className="text-xs">GST Inclusive</Label>
                </div>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Remark</Label>
                <Input className="h-8 text-xs" value={form.remark} onChange={e => setForm(prev => ({ ...prev, remark: e.target.value }))} placeholder="Optional remark" />
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleReset}><RotateCcw className="h-3.5 w-3.5" /> Reset</Button>
              <Button variant="outline" size="sm" className="gap-1.5"><X className="h-3.5 w-3.5" /> Close</Button>
              <Button size="sm" className="gap-1.5" onClick={handleSave}><Save className="h-3.5 w-3.5" /> Save</Button>
            </div>
          </CardContent>
        </Card>

        {/* Posted Services List */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Posted Services</CardTitle>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleReset}><Plus className="h-3 w-3" /> New Other Service</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Service</TableHead>
                  <TableHead className="text-xs">Room</TableHead>
                  <TableHead className="text-xs">Qty</TableHead>
                  <TableHead className="text-xs">Amount</TableHead>
                  <TableHead className="text-xs">Total</TableHead>
                  <TableHead className="text-xs">Remark</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((s, index) => (
                  <TableRow key={s._id || s.id || index}>
                    <TableCell className="text-xs">{s.date}</TableCell>
                    <TableCell className="text-xs font-medium">{s.serviceName}</TableCell>
                    <TableCell className="text-xs">{getRoomDisplay(s)}</TableCell>
                    <TableCell className="text-xs">{s.qty}</TableCell>
                    <TableCell className="text-xs">{Number(s.amount || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-xs font-medium">{Number(s.total || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-xs">{s.remark || "-"}</TableCell>
                    <TableCell className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(s)}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(s._id || s.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {services.length > 0 && (
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={5} className="text-right text-xs">Total Services Amount:</TableCell>
                    <TableCell className="text-xs">{totalPostedAmount.toFixed(2)}</TableCell>
                    <TableCell colSpan={2}></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
