"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MessageSquare, Search, Plus, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { getComplaints, createComplaint, updateComplaint, getInHouseGuests } from "@/lib/backend-api"



export default function GuestComplaintPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [complaints, setComplaints] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [formData, setFormData] = useState({
    roomId: "",
    roomNo: "",
    guestName: "",
    folioId: "",
    category: "",
    subject: "",
    description: "",
    priority: "",
    assignedTo: "",
  })

  useEffect(() => {
    loadComplaints()
    loadRooms()
  }, [])

  const loadComplaints = async () => {
    try {
      const res = await getComplaints()
      if (res.success) {
        setComplaints(res.data.complaints)
      }
    } catch (err) {
      console.error(err)
    }
  }
  const loadRooms = async () => {
    try {
      const res = await getInHouseGuests()
      if (res.success) {
        setRooms(res.data.guests)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = complaints.filter((c) => {
    const matchesSearch =
      c.guestName?.toLowerCase().includes(search.toLowerCase()) ||
      c.roomNumber?.includes(search) ||
      c.subject?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === "all" || c.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open": return <Badge className="bg-destructive/10 text-destructive border-destructive/20"><AlertTriangle className="h-3 w-3 mr-1" />Open</Badge>
      case "In Progress": return <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>
      case "Resolved": return <Badge className="bg-primary/10 text-primary border-primary/20"><CheckCircle className="h-3 w-3 mr-1" />Resolved</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Critical": return <Badge variant="destructive">Critical</Badge>
      case "High": return <Badge className="bg-orange-100 text-orange-700 border-orange-200">High</Badge>
      case "Medium": return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Medium</Badge>
      case "Low": return <Badge variant="secondary">Low</Badge>
      default: return <Badge variant="outline">{priority}</Badge>
    }
  }

  const handleCreateComplaint = async () => {
    try {
      const payload = {
        roomNumber: formData.roomNo,
        category: formData.category,
        subject: formData.subject,
        description: formData.description,
        priority: formData.priority,
        reportedTo: formData.assignedTo,
        guestName: formData.guestName,
        folioId: formData.folioId,
      }

      const res = await createComplaint(payload)

      if (res.success) {
        toast({ title: "Complaint logged successfully" })
        setIsNewOpen(false)

        setFormData({
          roomId: "",
          roomNo: "",
          guestName: "",
          folioId: "",
          category: "",
          subject: "",
          description: "",
          priority: "",
          assignedTo: "",
        })

        loadComplaints()
      }
    } catch (err) {
      console.error("Create complaint error:", err)
      toast({
        title: "Failed to log complaint",
        variant: "destructive",
      })
    }
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Guest Complaints</h1>
            <p className="text-sm text-muted-foreground">Track and resolve guest complaints and feedback</p>
          </div>
          <Button onClick={() => setIsNewOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Log Complaint
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total", count: complaints.length, color: "text-foreground" },
            { label: "Open", count: complaints.filter(c => c.status === "Open").length, color: "text-destructive" },
            { label: "In Progress", count: complaints.filter(c => c.status === "In Progress").length, color: "text-amber-600" },
            { label: "Resolved", count: complaints.filter(c => c.status === "Resolved").length, color: "text-primary" },
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
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search complaints..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell className="font-medium">{c.roomNumber}</TableCell>
                    <TableCell>{c.guestName}</TableCell>
                    <TableCell>{c.category}</TableCell>
                    <TableCell className="max-w-[180px] truncate">{c.subject}</TableCell>
                    <TableCell>{getPriorityBadge(c.priority)}</TableCell>
                    <TableCell>{getStatusBadge(c.status)}</TableCell>
                    <TableCell className="text-sm">{c.reportedTo}</TableCell>
                    <TableCell>{new Date(c.reportedAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      {c.status !== "Resolved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await updateComplaint(c._id, {
                              status: "Resolved",
                              resolvedAt: new Date(),
                            })
                            loadComplaints()
                          }}
                        >
                          Resolve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">No complaints found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Log New Complaint</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Room Number</Label>
                  <Select value={formData.roomId} onValueChange={(v) => {
                    const selected = rooms.find(r => r.id === v)
                    setFormData({ 
                      ...formData, 
                      roomId: v,
                      roomNo: selected?.roomNumber || "",
                      guestName: selected?.guestName || "",
                      folioId: selected?.folioId || ""
                    })
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                    <SelectContent>
                      {rooms.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.roomNumber} - {r.guestName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => {
                    setFormData({
                      ...formData,
                      category: v
                    })
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Housekeeping">Housekeeping</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="F&B">Food & Beverage</SelectItem>
                      <SelectItem value="Noise">Noise</SelectItem>
                      <SelectItem value="Staff">Staff Behavior</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical (Urgent)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <Select value={formData.assignedTo} onValueChange={(v) => setFormData({ ...formData, assignedTo: v })}>
                    <SelectTrigger><SelectValue placeholder="Select dept" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="front-desk">Front Desk</SelectItem>
                      <SelectItem value="housekeeping">Housekeeping Dept</SelectItem>
                      <SelectItem value="maintenance">Maintenance Team</SelectItem>
                      <SelectItem value="fb-manager">F&B Manager</SelectItem>
                      <SelectItem value="gm">General Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input placeholder="Brief subject of the complaint" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Detailed Description</Label>
                <Textarea placeholder="Describe the complaint in detail..." rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateComplaint} disabled={!formData.roomId || !formData.subject || !formData.category || !formData.description}>Log Complaint</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
