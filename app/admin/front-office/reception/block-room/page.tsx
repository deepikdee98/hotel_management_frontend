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
import { Lock, Unlock, RotateCcw, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { blockRoom, getBlockedRooms, unblockRoom, getFrontOfficeRooms } from "@/lib/backend-api"



export default function BlockRoomPage() {
  const [blocked, setBlocked] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ roomNo: "", from: "", to: "", remark: "" })

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [blockedData, roomsData] = await Promise.all([
          getBlockedRooms(),
          getFrontOfficeRooms({ status: "available" })
        ])

        setBlocked(blockedData)
        setRooms(roomsData)

      } catch (err: any) {
        console.error(err)
        setError(err.message || "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleBlock = async () => {
    try {
      if (!form.roomNo || !form.from || !form.to || !form.remark) {
        alert("Please fill all fields")
        return
      }

      await blockRoom({
        roomId: form.roomNo,
        from: form.from,
        to: form.to,
        remark: form.remark
      })

      alert("Room blocked successfully ")

      const [blockedData, roomsData] = await Promise.all([
        getBlockedRooms(),
        getFrontOfficeRooms({ status: "available" })
      ])

      setBlocked(blockedData)
      setRooms(roomsData)

      setForm({ roomNo: "", from: "", to: "", remark: "" })

    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to block room")
    }
  }

  const handleUnblock = async (id: string) => {
    try {
      await unblockRoom(id)

      alert("Room unblocked ")

      const [blockedData, roomsData] = await Promise.all([
        getBlockedRooms(),
        getFrontOfficeRooms({ status: "available" })
      ])

      setBlocked(blockedData)
      setRooms(roomsData)

    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to unblock")
    }
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Block Room</h1>
          <p className="text-sm text-muted-foreground">Mark rooms as unavailable for maintenance, VIP hold, or other reasons</p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Block a Room</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs">Room No <span className="text-destructive">*</span></Label>
                <Select value={form.roomNo} onValueChange={v => setForm(prev => ({ ...prev, roomNo: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {rooms.map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">From <span className="text-destructive">*</span></Label>
                <Input className="h-8 text-xs" type="date" value={form.from} onChange={e => setForm(prev => ({ ...prev, from: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To <span className="text-destructive">*</span></Label>
                <Input className="h-8 text-xs" type="date" value={form.to} onChange={e => setForm(prev => ({ ...prev, to: e.target.value }))} />
              </div>
              <div className="flex items-end gap-2">
                <Button size="sm" className="gap-1.5" onClick={handleBlock}><Lock className="h-3.5 w-3.5" /> Block</Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setForm({ roomNo: "", from: "", to: "", remark: "" })}><RotateCcw className="h-3.5 w-3.5" /> Reset</Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Remark <span className="text-destructive">*</span></Label>
              <Textarea className="text-xs min-h-12" value={form.remark} onChange={e => setForm(prev => ({ ...prev, remark: e.target.value }))} placeholder="Reason for blocking..." />
            </div>
          </CardContent>
        </Card>

        {/* Blocked Rooms List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Blocked Rooms History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Room No</TableHead>
                  <TableHead className="text-xs">From</TableHead>
                  <TableHead className="text-xs">To</TableHead>
                  <TableHead className="text-xs">Remark</TableHead>
                  <TableHead className="text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blocked.map(b => (
                  <TableRow key={b._id}>
                    <TableCell className="text-xs font-medium">{b.room?.roomNumber}</TableCell>
                    <TableCell className="text-xs">{b.from}</TableCell>
                    <TableCell className="text-xs">{b.to}</TableCell>
                    <TableCell className="text-xs">{b.remark}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={() => handleUnblock(b._id)}>
                        <Unlock className="h-3 w-3" /> Unblock
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {blocked.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">No blocked rooms</TableCell>
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
