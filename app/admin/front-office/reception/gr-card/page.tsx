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

  // Split address into two lines for printed form
  const splitAddress = (address: string = "") => {
    if (!address) return ["", ""];
    if (address.length <= 45) return [address, ""];
    
    // Find last space before 50 chars to avoid cutting words
    const lastSpace = address.substring(0, 50).lastIndexOf(" ");
    const splitIndex = lastSpace > 30 ? lastSpace : 45;
    
    return [
      address.substring(0, splitIndex),
      address.substring(splitIndex).trim()
    ];
  };

  const [addrLine1, addrLine2] = splitAddress(grData?.address);

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
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              margin: 0;
              padding: 0;
              background: white;
              -webkit-print-color-adjust: exact;
            }
            #gr-card-print {
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              width: 100% !important;
              max-width: none !important;
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
    <DashboardLayout requiredRole={["admin", "staff"]}>
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
            <div id="gr-card-print" className="border border-border rounded-lg p-8 bg-white min-h-[1000px] w-full max-w-[210mm] mx-auto text-black print:border-none print:p-0 print:shadow-none">
              {/* Header */}
              <div className="text-center space-y-1 mb-6">
                <h2 className="text-xl font-bold uppercase tracking-tight">{grData?.hotel?.name || hotelInfo?.name || "GUEST REGISTRATION CARD"}</h2>
                <div className="text-xs space-y-0.5">
                  <p>{grData?.hotel?.address || hotelInfo?.address || ""}</p>
                  <p>
                    {grData?.hotel?.city || hotelInfo?.city || ""}
                    {grData?.hotel?.country || hotelInfo?.country ? `, ${grData?.hotel?.country || hotelInfo?.country}` : ""}
                    {(grData?.hotel?.phone || hotelInfo?.phone) && ` | Phone: ${grData?.hotel?.phone || hotelInfo?.phone}`}
                  </p>
                </div>
                <h3 className="text-lg font-bold border-y border-black py-1 mt-4 uppercase">Guest Registration Card</h3>
              </div>

              {isLoadingGR ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Two Column Section */}
                  <div className="flex justify-between items-start gap-12">
                    {/* Left Column */}
                    <div className="w-[48%] space-y-2 text-[11px]">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Booking No :</span>
                        <span className="border-b border-gray-400 flex-1 min-h-[14px]">{grData?.bookingNo || ""}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Guest Name :</span>
                        <span className="border-b border-gray-400 flex-1 min-h-[14px] uppercase font-semibold">{grData?.guestName || ""}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Nationality :</span>
                        <span className="border-b border-gray-400 flex-1 min-h-[14px]">{grData?.nationality || ""}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0 pt-1">Address :</span>
                        <div className="flex-1 space-y-[6px]">
                          <div className="border-b border-gray-400 min-h-[14px] flex items-end">
                            {addrLine1}
                          </div>
                          <div className="border-b border-gray-400 min-h-[14px] flex items-end">
                            {addrLine2}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Email Address :</span>
                        <span className="border-b border-gray-400 flex-1 min-h-[14px]">{grData?.email || ""}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Contact No :</span>
                        <span className="border-b border-gray-400 flex-1 min-h-[14px]">{grData?.mobileNo || ""}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Company / Agent :</span>
                        <span className="border-b border-gray-400 flex-1 min-h-[14px]">{grData?.company || ""}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">ID Proof :</span>
                        <span className="border-b border-gray-400 flex-1 min-h-[14px] uppercase">{grData?.idProof || ""}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Check-In :</span>
                        <span className="border-b border-gray-400 flex-1 min-h-[14px]">{grData?.checkIn ? format(new Date(grData.checkIn), "dd-MM-yyyy HH:mm") : ""}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Check-Out :</span>
                        <span className="border-b border-gray-400 flex-1 min-h-[14px]">{grData?.checkOut ? format(new Date(grData.checkOut), "dd-MM-yyyy HH:mm") : ""}</span>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="w-[48%] space-y-2 text-[11px]">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Date of Birth :</span>
                        <span className="border-b border-gray-400 flex-1 min-h-[14px]">{grData?.dob ? format(new Date(grData.dob), "dd-MM-yyyy") : ""}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Arrived From :</span>
                        <span className="border-b border-gray-400 flex-1 min-h-[14px]">{grData?.arrivalFrom || ""}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Departure To :</span>
                        <span className="border-b border-gray-400 flex-1 min-h-[14px]">{grData?.departureTo || ""}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Purpose :</span>
                        <span className="border-b border-gray-400 flex-1 min-h-[14px]">{grData?.purposeOfVisit || ""}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Arr. In India :</span>
                        <span className="border-b border-gray-400 flex-1 min-h-[14px]"></span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Emp. In India :</span>
                        <span className="border-b border-gray-400 flex-1 min-h-[14px]"></span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Passport No :</span>
                        <span className="border-b border-gray-400 flex-1 min-h-[14px]"></span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Pass. Issue :</span>
                        <span className="border-b border-gray-400 flex-1 min-h-[14px]"></span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Pass. Expiry :</span>
                        <span className="border-b border-gray-400 flex-1 min-h-[14px]"></span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Place of Issue :</span>
                        <span className="border-b border-gray-400 flex-1 min-h-[14px]"></span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Visa Details :</span>
                        <span className="border-b border-gray-400 flex-1 min-h-[14px]"></span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Stay Duration :</span>
                        <span className="border-b border-gray-400 flex-1 min-h-[14px]"></span>
                      </div>
                    </div>
                  </div>

                  {/* Room Details Table */}
                  <div className="mt-[15px] flex justify-center">
                    <table className="w-full border-collapse border border-black text-[11px]">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-black p-3 text-left uppercase text-[9px] font-bold">Room No</th>
                          <th className="border border-black p-3 text-center uppercase text-[9px] font-bold">Male</th>
                          <th className="border border-black p-3 text-center uppercase text-[9px] font-bold">Female</th>
                          <th className="border border-black p-3 text-center uppercase text-[9px] font-bold">Child</th>
                          <th className="border border-black p-3 text-left uppercase text-[9px] font-bold">Plan</th>
                          <th className="border border-black p-3 text-right uppercase text-[9px] font-bold">Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-black p-3 font-semibold">{grData?.roomNumber || ""}</td>
                          <td className="border border-black p-3 text-center">{grData?.adultMale ?? ""}</td>
                          <td className="border border-black p-3 text-center">{grData?.adultFemale ?? ""}</td>
                          <td className="border border-black p-3 text-center">{grData?.children ?? ""}</td>
                          <td className="border border-black p-3 uppercase">{grData?.planType || ""}</td>
                          <td className="border border-black p-3 text-right font-bold">{grData?.tariff ? `₹${grData.tariff.toLocaleString()}` : ""}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="mt-8 text-[9px] text-gray-600 space-y-2">
                    <p className="font-bold uppercase border-b border-gray-200 pb-1">Declaration:</p>
                    <p className="leading-normal">I hereby declare that the details furnished above are true and correct to the best of my knowledge and belief. I agree to be held personally liable for the payment of the above-mentioned account and to abide by the rules and regulations of the hotel.</p>
                  </div>

                  {/* Signature Section */}
                  <div className="mt-24 flex justify-between items-end px-8">
                    <div className="w-64 border-t-[1.5px] border-black pt-3 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Guest Signature</span>
                    </div>
                    <div className="w-64 border-t-[1.5px] border-black pt-3 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Receptionist Signature</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 justify-end print:hidden">
          <Button 
            size="sm" 
            variant="outline" 
            className="gap-1.5" 
            onClick={() => {
              setGrData(null);
              setTimeout(handlePrint, 100);
            }}
          >
            <Printer className="h-3.5 w-3.5" /> Print Empty Form
          </Button>
          <Button 
            size="sm" 
            className="gap-1.5" 
            onClick={handlePrint} 
            disabled={!grData || isLoadingGR}
          >
            <Printer className="h-3.5 w-3.5" /> Print GR Card
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
