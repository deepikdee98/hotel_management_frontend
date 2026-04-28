"use client"

import { useState, useEffect} from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Link2, Unlink, Search, ArrowRight } from "lucide-react"
import { getInHouseGuests, linkRooms, unlinkRooms, getRoomLinks } from "@/lib/backend-api"



export default function RoomLinkPage() {
  const [search, setSearch] = useState("")
  const [isLinkOpen, setIsLinkOpen] = useState(false)
  const [masterRoom, setMasterRoom] = useState("")
  const [targetRoom, setTargetRoom] = useState("")
  const [guests, setGuests] = useState<any[]>([])
  const [links, setLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  


  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [guestsRes, linksRes] = await Promise.all([
        getInHouseGuests(),
        getRoomLinks()
      ])

      if (guestsRes.success) {
        setGuests(guestsRes.data.guests)
      }
      if (linksRes.success) {
        setLinks(linksRes.data)
      }
    } catch (err) {
      console.error("Load error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleLinkRooms = async () => {
    try {
      if (!masterRoom || !targetRoom) return

      await linkRooms({
        masterFolioId: masterRoom,
        linkedFolioIds: [targetRoom],
        billingInstructions: "Master Folio Billing",
        linkType: "Full",
      })

      setIsLinkOpen(false)
      setMasterRoom("")
      setTargetRoom("")

      await loadData()
      alert("Rooms linked successfully")

    } catch (err) {
      console.error("Link error:", err)
    }
  }

  const handleUnlinkRooms = async (masterFolioId: string) => {
    try {
      await unlinkRooms(masterFolioId)
      await loadData()
      alert("Rooms unlinked successfully")

    } catch (err) {
      console.error("Unlink error:", err)
    }
  }

  const filtered = links.filter((link) => {
    const masterRoomNum = link.masterFolioId?.roomId?.roomNumber || link.masterFolioId?.checkinId?.roomNumber?.roomNumber || ""
    const guestName = link.masterFolioId?.guestName || ""
    const linkedRoomsArr = Array.isArray(link.linkedFolioIds) ? link.linkedFolioIds : []
    const linkedRoomsStr = linkedRoomsArr.map((f: any) => f.roomId?.roomNumber || f.checkinId?.roomNumber?.roomNumber).join(", ")
    
    return (
      masterRoomNum.includes(search) ||
      guestName.toLowerCase().includes(search.toLowerCase()) ||
      linkedRoomsStr.includes(search)
    )
  })

  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Room Link / Unlink</h1>
            <p className="text-sm text-muted-foreground">Link or unlink rooms for group billing and guest management</p>
          </div>
          <Button onClick={() => setIsLinkOpen(true)}>
            <Link2 className="h-4 w-4 mr-2" />
            Link Rooms
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by room number or guest name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Master Room</TableHead>
                  <TableHead>Linked Rooms</TableHead>
                  <TableHead>Guest Name</TableHead>
                  <TableHead>Linked Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((link) => (
                  <TableRow key={link._id}>
                    <TableCell className="font-medium">
                      {link.masterFolioId?.roomId?.roomNumber || link.masterFolioId?.checkinId?.roomNumber?.roomNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {link.linkedFolioIds?.map((f: any) => (
                          <Badge key={f._id} variant="secondary">
                            {f.roomId?.roomNumber || f.checkinId?.roomNumber?.roomNumber}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{link.masterFolioId?.guestName}</TableCell>
                    <TableCell>
                      {link.createdAt ? new Date(link.createdAt).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleUnlinkRooms(link.masterFolioId?._id)}
                      >
                        <Unlink className="h-3.5 w-3.5 mr-1.5" />
                        Unlink
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No linked rooms found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isLinkOpen} onOpenChange={setIsLinkOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Link Rooms</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Master Room (Billing Room)</Label>
                <Select value={masterRoom} onValueChange={setMasterRoom}>
                  <SelectTrigger><SelectValue placeholder="Select master room" /></SelectTrigger>
                  <SelectContent>
                    {guests.map((g) => (
                      <SelectItem key={g.id} value={g.folioId}>
                        {g.roomNumber} - {g.guestName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {masterRoom && (
                <div className="flex items-center justify-center gap-3 text-muted-foreground">
                  <Badge variant="outline" className="text-sm">
                    Room {guests.find(g => g.folioId === masterRoom)?.roomNumber}
                  </Badge>
                  <ArrowRight className="h-4 w-4" />
                  <span className="text-xs">will be linked to</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
              <div className="space-y-2">
                <Label>Target Room to Link</Label>
                <Select value={targetRoom} onValueChange={setTargetRoom}>
                  <SelectTrigger><SelectValue placeholder="Select room to link" /></SelectTrigger>
                  <SelectContent>
                    {guests
                      .filter((g) => g.folioId !== masterRoom)
                      .map((g) => (
                        <SelectItem key={g.id} value={g.folioId}>
                          {g.roomNumber} - {g.guestName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                All charges for the linked room will be billed to the master room folio.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsLinkOpen(false)}>Cancel</Button>
              <Button
                disabled={!masterRoom || !targetRoom}
                onClick={handleLinkRooms}
              >
                Link Rooms
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
