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
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Link2, Unlink, Search, ArrowRight, X } from "lucide-react"
import { getInHouseGuests, linkRooms, unlinkRooms, getRoomLinks } from "@/lib/backend-api"



export default function RoomLinkPage() {
  const [search, setSearch] = useState("")
  const [isLinkOpen, setIsLinkOpen] = useState(false)
  const [masterRoom, setMasterRoom] = useState("")
  const [targetRooms, setTargetRooms] = useState<string[]>([])
  const [targetSearch, setTargetSearch] = useState("")
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
      if (!masterRoom || targetRooms.length === 0) return

      await linkRooms({
        masterFolioId: masterRoom,
        linkedFolioIds: targetRooms,
        billingInstructions: "Master Folio Billing",
        linkType: "Full",
      })

      setIsLinkOpen(false)
      setMasterRoom("")
      setTargetRooms([])
      setTargetSearch("")

      await loadData()
      alert("Rooms linked successfully")

    } catch (err) {
      console.error("Link error:", err)
    }
  }

  const toggleTargetRoom = (folioId: string) => {
    setTargetRooms(prev => 
      prev.includes(folioId) 
        ? prev.filter(id => id !== folioId) 
        : [...prev, folioId]
    )
  }

  const filteredTargetGuests = guests
    .filter((g) => g.folioId !== masterRoom)
    .filter((g) => 
      g.roomNumber.includes(targetSearch) || 
      g.guestName.toLowerCase().includes(targetSearch.toLowerCase())
    )

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
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Target Rooms to Link</Label>
                  {targetRooms.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2 text-xs"
                      onClick={() => setTargetRooms([])}
                    >
                      Clear All ({targetRooms.length})
                    </Button>
                  )}
                </div>
                
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search rooms or guests..."
                    value={targetSearch}
                    onChange={(e) => setTargetSearch(e.target.value)}
                    className="pl-8 h-9 text-sm"
                  />
                </div>

                <ScrollArea className="h-50 border rounded-md p-2">
                  <div className="space-y-1">
                    {filteredTargetGuests.length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground py-4">No rooms found</p>
                    ) : (
                      filteredTargetGuests.map((g) => (
                        <div 
                          key={g.id} 
                          className="flex items-center space-x-3 p-2 rounded-sm hover:bg-accent cursor-pointer"
                          onClick={() => toggleTargetRoom(g.folioId)}
                        >
                          <Checkbox 
                            id={g.id} 
                            checked={targetRooms.includes(g.folioId)}
                            onCheckedChange={() => {}} // Handled by div onClick
                          />
                          <label
                            htmlFor={g.id}
                            className="text-sm font-medium leading-none cursor-pointer flex-1"
                          >
                            {g.roomNumber} - {g.guestName}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
                
                {targetRooms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {targetRooms.map(id => {
                      const guest = guests.find(g => g.folioId === id);
                      return (
                        <Badge key={id} variant="secondary" className="pl-2 pr-1 py-0.5 flex items-center gap-1 text-[10px]">
                          {guest?.roomNumber}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTargetRoom(id);
                            }}
                            className="hover:bg-muted rounded-full p-0.5"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </Badge>
                      )
                    })}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                All charges for the linked rooms will be billed to the master room folio.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsLinkOpen(false)
                setTargetRooms([])
                setTargetSearch("")
              }}>Cancel</Button>
              <Button
                disabled={!masterRoom || targetRooms.length === 0}
                onClick={handleLinkRooms}
              >
                Link Rooms {targetRooms.length > 0 && `(${targetRooms.length})`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
