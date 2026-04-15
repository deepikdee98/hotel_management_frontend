"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CreditCard, Search, CheckCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getInHouseGuests, postRoomTariff } from "@/lib/backend-api"

type Room = {
  roomNo: string
  guestName: string
  roomType: string
  ratePlan: string
  tariff: number
  gst: number
  total: number
  nights: number
  folioId: string
  posted?: boolean
}

export default function PostRoomTariffPage() {
  const [search, setSearch] = useState("")
  const [selectedRooms, setSelectedRooms] = useState<string[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [postedRooms, setPostedRooms] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadRooms()
  }, [])

  const loadRooms = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await getInHouseGuests()

      const formattedRooms = (res.data?.guests || []).map((r: any) => {
        const roomTypeName = typeof r.roomType === 'object' ? r.roomType?.name : r.roomType
        const ratePlanName = typeof r.ratePlan === 'object' ? r.ratePlan?.name : (r.ratePlan || "EP")

        return {
          roomNo: r.roomNumber,
          guestName: r.guestName,
          roomType: roomTypeName || "N/A",
          ratePlan: ratePlanName,
          tariff: r.roomRate || 0,
          gst: r.taxAmount || 0,
          total: r.totalAmount || r.roomRate || 0,
          nights: r.nights || 1,
          folioId: r.folioId,
          posted: postedRooms.has(r.folioId)
        }
      })

      setRooms(formattedRooms)
    } catch (err: any) {
      setError(err.message || "Failed to load rooms")
      console.error("Error loading rooms:", err)
    } finally {
      setLoading(false)
    }
  }

  const handlePostTariff = async () => {
    try {
      setPosting(true)
      setError(null)
      setSuccess(false)

      let failedRooms: string[] = []

      for (const roomNo of selectedRooms) {
        const room = rooms.find(r => r.roomNo === roomNo)
        if (!room) {
          failedRooms.push(roomNo)
          continue
        }

        try {
          await postRoomTariff(room.folioId, {
            roomRate: room.tariff,
            taxes: {
              cgst: room.gst / 2,
              sgst: room.gst / 2
            },
            totalAmount: room.total,
            remarks: "Daily Room Tariff"
          })
          setPostedRooms(prev => new Set([...prev, room.folioId]))
        } catch (err) {
          failedRooms.push(roomNo)
        }
      }

      if (failedRooms.length > 0) {
        setError(`Failed to post tariff for rooms: ${failedRooms.join(", ")}`)
      } else {
        setSuccess(true)
        setSelectedRooms([])
        setTimeout(() => {
          loadRooms()
        }, 1500)
      }
    } catch (err: any) {
      setError(err.message || "Error posting tariff")
      console.error("Error posting tariff:", err)
    } finally {
      setPosting(false)
    }
  }

  const formattedRooms = rooms.map(r => ({
    ...r,
    posted: postedRooms.has(r.folioId)
  }))

  const filtered = formattedRooms.filter(
    (r: Room) =>
      r.roomNo.includes(search) ||
      r.guestName.toLowerCase().includes(search.toLowerCase())
  )

  const unposted = filtered.filter((r: Room) => !r.posted)
  const toggleRoom = (roomNo: string) => {
    setSelectedRooms((prev) =>
      prev.includes(roomNo) ? prev.filter((r) => r !== roomNo) : [...prev, roomNo]
    )
  }
  const selectAll = () => {
    if (selectedRooms.length === unposted.length) {
      setSelectedRooms([])
    } else {
      setSelectedRooms(unposted.map((r: Room) => r.roomNo))
    }
  }

  const totalSelected = filtered.filter((r: Room) => selectedRooms.includes(r.roomNo)).reduce((sum: number, r: Room) => sum + r.total, 0)

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-4">
        {error && (
          <Alert className="border-destructive/50 bg-destructive/10">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500/50 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">Room tariff posted successfully!</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Post Room Tariff</h1>
            <p className="text-sm text-muted-foreground">Post daily room tariff to guest folios</p>
          </div>
          <Button
            onClick={handlePostTariff}
            disabled={selectedRooms.length === 0 || posting || loading}
            className="gap-2"
          >
            <CreditCard className="h-4 w-4" />
            {posting ? "Posting..." : `Post Tariff (${selectedRooms.length} rooms)`}
          </Button>
        </div>

        {selectedRooms.length > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-3 flex items-center justify-between">
              <span className="text-sm font-medium">{selectedRooms.length} room(s) selected</span>
              <span className="text-sm font-bold">Total: ${totalSelected.toLocaleString()}</span>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by room or guest..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  disabled={loading}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">Loading rooms...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">
                  {rooms.length === 0 ? "No in-house guests found" : "No results match your search"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedRooms.length === unposted.length && unposted.length > 0}
                        onCheckedChange={selectAll}
                        disabled={loading}
                      />
                    </TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Room Type</TableHead>
                    <TableHead>Rate Plan</TableHead>
                    <TableHead>Tariff</TableHead>
                    <TableHead>GST</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Nights</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((room: Room) => (
                    <TableRow key={room.roomNo} className={room.posted ? "opacity-60" : ""}>
                      <TableCell>
                        {!room.posted && (
                          <Checkbox
                            checked={selectedRooms.includes(room.roomNo)}
                            onCheckedChange={() => toggleRoom(room.roomNo)}
                            disabled={posting}
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{room.roomNo}</TableCell>
                      <TableCell>{room.guestName}</TableCell>
                      <TableCell>{room.roomType}</TableCell>
                      <TableCell><Badge variant="secondary">{room.ratePlan}</Badge></TableCell>
                      <TableCell>${typeof room.tariff === 'number' ? room.tariff.toLocaleString() : '0'}</TableCell>
                      <TableCell>${typeof room.gst === 'number' ? room.gst.toLocaleString() : '0'}</TableCell>
                      <TableCell className="font-medium">${typeof room.total === 'number' ? room.total.toLocaleString() : '0'}</TableCell>
                      <TableCell>{room.nights || 1}</TableCell>
                      <TableCell>
                        {room.posted ? (
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            <CheckCircle className="h-3 w-3 mr-1" /> Posted
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
