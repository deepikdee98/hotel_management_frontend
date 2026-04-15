"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ArrowRight, Search, Plus, AlertCircle, Loader2 } from "lucide-react"
import { createAdvanceTransfer, getAdvanceTransfers, getInHouseGuests, cancelAdvanceTransfer } from "@/lib/backend-api"
import { useToast } from "@/hooks/use-toast"

interface Transfer {
  _id: string
  fromRoom: string
  toRoom: string
  fromGuestName: string
  toGuestName: string
  transferAmount: number
  reason: string
  status: "completed" | "pending" | "cancelled"
  createdAt: string
}

interface Room {
  id: string
  number: string
  guestName?: string
}
export default function AdvanceTransferPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fromRoom: "",
    toRoom: "",
    transferAmount: "",
    reason: "",
    remarks: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await getInHouseGuests()

      if (res.success) {
        const formattedRooms = res.data.guests.map((g: any) => ({
          id: g.folioId,          
          number: g.roomNumber,
          guestName: g.guestName,
        }))

        setRooms(formattedRooms)
      }
          const transfersResponse = await getAdvanceTransfers()
      const transfersData = Array.isArray(transfersResponse) ? transfersResponse : transfersResponse.data || []
      setTransfers(transfersData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load data"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.fromRoom || !formData.toRoom || !formData.transferAmount || !formData.reason) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (formData.fromRoom === formData.toRoom) {
      toast({
        title: "Validation Error",
        description: "Source and destination rooms must be different",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      await createAdvanceTransfer({
        fromRoom: formData.fromRoom,
        toRoom: formData.toRoom,
        transferAmount: parseFloat(formData.transferAmount),
        reason: formData.reason,
        remarks: formData.remarks,
      })

      toast({
        title: "Success",
        description: "Advance transferred successfully",
      })

      setFormData({
        fromRoom: "",
        toRoom: "",
        transferAmount: "",
        reason: "",
        remarks: "",
      })
      setIsNewOpen(false)
      await loadData()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create transfer"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (transferId: string) => {
    try {
      await cancelAdvanceTransfer(transferId)
      toast({
        title: "Success",
        description: "Advance transfer cancelled successfully",
      })
      await loadData()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to cancel transfer"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const filtered = transfers.filter((t) =>
    t.fromRoom.includes(search) ||
    t.toRoom.includes(search) ||
    t.fromGuestName.toLowerCase().includes(search.toLowerCase()) ||
    t.toGuestName.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: "bg-green-100 text-green-800 border-green-300",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      cancelled: "bg-red-100 text-red-800 border-red-300",
    }
    return styles[status as keyof typeof styles] || styles.completed
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Advance Transfer</h1>
            <p className="text-sm text-muted-foreground">Transfer advance amounts between rooms</p>
          </div>
          <Button onClick={() => setIsNewOpen(true)} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            New Transfer
          </Button>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-2 pt-6">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm text-red-800">{error}</span>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by room or guest..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From Room</TableHead>
                    <TableHead />
                    <TableHead>To Room</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length > 0 ? (
                    filtered.map((t) => (
                      <TableRow key={t._id}>
                        <TableCell className="font-medium">{t.fromRoom}</TableCell>
                        <TableCell>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell className="font-medium">{t.toRoom}</TableCell>
                        <TableCell>
                          <span className="block">{t.fromGuestName}</span>
                          <span className="text-xs text-muted-foreground">→ {t.toGuestName}</span>
                        </TableCell>
                        <TableCell className="font-medium">₹{t.transferAmount.toLocaleString()}</TableCell>
                        <TableCell className="max-w-sm truncate text-sm">{t.reason}</TableCell>
                        <TableCell className="text-sm">{formatDate(t.createdAt)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(t.status)}>
                            {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {t.status === "completed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancel(t._id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              Cancel
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        No transfers found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Advance Transfer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Room</Label>
                  <Select value={formData.fromRoom} onValueChange={(v) => setFormData({ ...formData, fromRoom: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Source room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.number} - {r.guestName || "No Guest"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>To Room</Label>
                  <Select value={formData.toRoom} onValueChange={(v) => setFormData({ ...formData, toRoom: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Target room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.number} - {r.guestName || "No Guest"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Amount to Transfer</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.transferAmount}
                  onChange={(e) => setFormData({ ...formData, transferAmount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Reason *</Label>
                <Input
                  placeholder="Reason for the transfer..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Additional Remarks</Label>
                <Textarea
                  placeholder="Additional remarks (optional)..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                disabled={!formData.fromRoom || !formData.toRoom || !formData.transferAmount || !formData.reason || submitting}
                onClick={handleSubmit}
              >
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Transfer Advance
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

