"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Printer, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { getFrontOfficeRooms, getGRCard, getSetupHotelConfig } from "@/lib/backend-api"
import type { Room, GRCardData, Hotel } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"

export default function GRCardPage() {
  const { toast } = useToast()
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState("")
  const [grData, setGrData] = useState<GRCardData | null>(null)
  const [hotelInfo, setHotelInfo] = useState<Hotel | null>(null)
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)
  const [isLoadingGR, setIsLoadingGR] = useState(false)

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [roomsData, hotelData] = await Promise.all([
          getFrontOfficeRooms({ status: "occupied" }),
          getSetupHotelConfig()
        ])
        setRooms(roomsData)
        if (hotelData) {
          setHotelInfo(hotelData)
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch initial data",
          variant: "destructive",
        })
      } finally {
        setIsLoadingRooms(false)
      }
    }
    fetchInitialData()
  }, [toast])

  useEffect(() => {
    if (!selectedRoomId) {
      setGrData(null)
      return
    }

    async function fetchGRData() {
      setIsLoadingGR(true)
      try {
        const data = await getGRCard(selectedRoomId)
        setGrData(data)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch GR card data",
          variant: "destructive",
        })
        setGrData(null)
      } finally {
        setIsLoadingGR(false)
      }
    }
    fetchGRData()
  }, [selectedRoomId, toast])

 const handlePrint = () => {
  const content = document.getElementById("gr-card-print")

  if (!content) return

  const win = window.open("", "", "width=900,height=700")

  if (win) {
    win.document.write(`
      <html>
        <head>
          <title>GR Card</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body {
              margin: 0;
              padding: 20px;
              background: white;
            }
          </style>
        </head>

        <body>
          ${content.outerHTML}
        </body>
      </html>
    `)

    win.document.close()
    setTimeout(() => {
      win.print()
      win.close()
    }, 500)
  }
}

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-4 max-w-2xl print:max-w-none print:p-0">
        <div className="print:hidden">
          <h1 className="text-2xl font-bold text-foreground">GR Card (Guest Registration Card)</h1>
          <p className="text-sm text-muted-foreground">Print Guest Registration Card for checked-in guests</p>
        </div>

        <Card className="print:hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Select Room to Print GR Card</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Room No</Label>
                <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={isLoadingRooms ? "Loading..." : "Select room"} />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">No of Copies</Label>
                <Input className="h-8 text-xs" type="number" min="1" defaultValue="1" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GR Card Preview */}
        <Card className="print:border-none print:shadow-none">
          <CardHeader className="pb-2 print:hidden">
            <CardTitle className="text-sm">GR Card Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div id="gr-card-print"  className="border border-border rounded-lg p-6 space-y-4 bg-card min-h-96 print:border-none print:p-0">
              <div className="text-center space-y-1 border-b border-border pb-4">
                <h2 className="text-lg font-bold text-foreground uppercase">{grData?.hotel?.name || hotelInfo?.name || "GUEST REGISTRATION CARD"}</h2>
                <p className="text-xs text-muted-foreground">
                  {grData?.hotel?.address || hotelInfo?.address ? `${grData?.hotel?.address || hotelInfo?.address}, ` : ""}
                  {grData?.hotel?.city || hotelInfo?.city ? `${grData?.hotel?.city || hotelInfo?.city}, ` : ""}
                  {grData?.hotel?.country || hotelInfo?.country || ""}
                  {(grData?.hotel?.phone || hotelInfo?.phone) && ` | Phone: ${grData?.hotel?.phone || hotelInfo?.phone}`}
                </p>
              </div>

              {isLoadingGR ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <span className="font-medium text-foreground min-w-24">Booking No:</span>
                        <span className="border-b border-border flex-1 text-muted-foreground">
                          {grData?.bookingNo || "__________"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-medium text-foreground min-w-24">Register No:</span>
                        <span className="border-b border-border flex-1 text-muted-foreground">
                          {grData?.registerNo || "__________"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-medium text-foreground min-w-24">Guest Name:</span>
                        <span className="border-b border-border flex-1 text-muted-foreground">
                          {grData?.guestName || "__________"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-medium text-foreground min-w-24">Room No:</span>
                        <span className="border-b border-border flex-1 text-muted-foreground">
                          {grData?.roomNumber || "__________"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-medium text-foreground min-w-24">Check-In:</span>
                        <span className="border-b border-border flex-1 text-muted-foreground">
                          {grData?.checkIn ? format(new Date(grData.checkIn), "dd-MM-yyyy HH:mm") : "__________"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <span className="font-medium text-foreground min-w-24">Room Type:</span>
                        <span className="border-b border-border flex-1 text-muted-foreground">
                          {grData?.roomType || "__________"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-medium text-foreground min-w-24">Plan:</span>
                        <span className="border-b border-border flex-1 text-muted-foreground">
                          {grData?.planType || "__________"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-medium text-foreground min-w-24">Tariff:</span>
                        <span className="border-b border-border flex-1 text-muted-foreground">
                          {grData ? `₹${grData.tariff}` : "__________"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-medium text-foreground min-w-24">No of PAX:</span>
                        <span className="border-b border-border flex-1 text-muted-foreground">
                          {grData?.noOfPax || "__________"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-medium text-foreground min-w-24">ID Proof:</span>
                        <span className="border-b border-border flex-1 text-muted-foreground">
                          {grData?.idProof || "__________"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 flex justify-between text-xs text-muted-foreground">
                    <div className="space-y-4">
                      <span className="block border-t border-border pt-1">Guest Signature</span>
                    </div>
                    <div className="space-y-4 text-right">
                      <span className="block border-t border-border pt-1">Receptionist Signature</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 justify-end print:hidden">
          <Button size="sm" className="gap-1.5" onClick={handlePrint} disabled={!grData || isLoadingGR}>
            <Printer className="h-3.5 w-3.5" /> Print GR Card
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
