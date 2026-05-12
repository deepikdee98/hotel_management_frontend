"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Printer, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { getCheckedInRooms, getFrontOfficeRooms, getGRCard, getSetupHotelConfig } from "@/lib/backend-api"
import type { Room, GRCardData, Hotel } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { loadGRCardPrintData, clearGRCardPrintData, type GRCardPrintPayload } from "@/lib/gr-card-utils"
import { printCurrentWindow } from "@/lib/print-utils"
import { format } from "date-fns"

export default function GRCardPage() {
  const { toast } = useToast()
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState("")
  const [grData, setGrData] = useState<GRCardData | GRCardPrintPayload | null>(null)
  const [storedPrintData, setStoredPrintData] = useState<GRCardPrintPayload | null>(null)
  const [autoPrintRequested, setAutoPrintRequested] = useState(false)
  const [hotelInfo, setHotelInfo] = useState<Hotel | null>(null)
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)
  const [isLoadingGR, setIsLoadingGR] = useState(false)
  type GRRoomOption = {
    id: string
    number: string
    guestName?: string
  }

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

  const roomOptions: GRRoomOption[] = rooms
    .map((room) => ({
      id: room.id,
      number: room.number,
      guestName: room.guestName,
    }))
    .filter((room) => room.id && room.number)

  const selectedRoom = roomOptions.find(r => r.id === selectedRoomId);
  const previewData = storedPrintData ?? grData;
  const previewRoomNumber = previewData?.roomNumber || (previewData as any)?.roomNo || selectedRoom?.number || "";

  const [addrLine1, addrLine2] = splitAddress(previewData?.address);

  const displayValue = (value: unknown): React.ReactNode => {
    if (value === undefined || value === null || value === "") return "-"
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return value
    }
    return String(value)
  }

  const formatDateTimeValue = (value?: string) => {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "-"
    return format(date, "dd-MM-yyyy HH:mm")
  }

  const formatDateValue = (value?: string) => {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "-"
    return format(date, "dd-MM-yyyy")
  }

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [checkinsResult, roomsResult, hotelResult] = await Promise.allSettled([
          getCheckedInRooms("checked-in"),
          getFrontOfficeRooms(),
          getSetupHotelConfig()
        ])

        const checkinRooms: Room[] = checkinsResult.status === "fulfilled"
          ? checkinsResult.value
              .filter((item: any) => item?.roomId && item?.roomNumber)
              .map((item: any) => ({
                id: String(item.roomId),
                number: String(item.roomNumber),
                floor: 0,
                type: String(item.roomType || ""),
                status: "occupied" as const,
                price: Number(item.planCharges || item.planCharge || 0),
                amenities: [],
                guestName: item.guestName ? String(item.guestName) : undefined,
              }))
          : []

        const occupiedRooms = roomsResult.status === "fulfilled"
          ? roomsResult.value.filter(r => r.status === "occupied")
          : []

        const roomsById = new Map<string, Room>()
        ;[...occupiedRooms, ...checkinRooms].forEach((room) => {
          if (room.id && room.number) roomsById.set(room.id, room)
        })
        setRooms(Array.from(roomsById.values()))

        if (hotelResult.status === "fulfilled" && hotelResult.value) {
          setHotelInfo(hotelResult.value as unknown as Hotel)
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
    const stored = loadGRCardPrintData()
    if (!stored) return

    setStoredPrintData(stored)
    setGrData(stored)
    setAutoPrintRequested(true)
    clearGRCardPrintData()
  }, [])

  useEffect(() => {
    if (!selectedRoomId) {
      if (!storedPrintData) {
        setGrData(null)
      }
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
  }, [selectedRoomId, toast, storedPrintData])

  useEffect(() => {
    if (!autoPrintRequested || !grData) return

    const timer = window.setTimeout(() => {
      printCurrentWindow()
      setAutoPrintRequested(false)
    }, 400)

    return () => window.clearTimeout(timer)
  }, [autoPrintRequested, grData])

  const handlePrint = () => {
    printCurrentWindow()
  }

  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
      <>
        <style jsx global>{`
          @media print {
            aside {
              display: none !important;
            }
            .min-h-screen > div {
              margin-left: 0 !important;
            }
            .print-hidden {
              display: none !important;
            }
            body {
              background: white !important;
            }
          }
        `}</style>
        <div className="space-y-4 max-w-2xl print:max-w-none print:p-0">
          <div className="print:hidden">
            <h1 className="text-2xl font-bold text-foreground">GR Card (Guest Registration Card)</h1>
            <p className="text-sm text-muted-foreground">Print Guest Registration Card for checked-in guests</p>
          </div>

          {!storedPrintData && (
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
                        {roomOptions.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.number} {r.guestName ? `- ${r.guestName}` : ""}
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
          )}

          {storedPrintData && (
            <Card className="print:hidden border border-border bg-muted p-4">
              <CardContent className="space-y-2 text-sm text-foreground">
                <p className="font-semibold">Print preview loaded from check-in form data.</p>
                <p>Click Print GR Card to print the loaded guest registration card.</p>
              </CardContent>
            </Card>
          )}

          {/* GR Card Preview */}
          <Card className="print:border-none print:shadow-none">
            <CardHeader className="pb-2 print:hidden">
              <CardTitle className="text-sm">GR Card Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div id="gr-card-print" className="border border-border rounded-lg p-8 bg-white min-h-250 w-full max-w-[210mm] mx-auto text-black print:border-none print:p-0 print:shadow-none">
                {/* Header */}
                <div className="text-center space-y-1 mb-6">
                  <h2 className="text-xl font-bold uppercase tracking-tight">{previewData?.hotel?.name || hotelInfo?.name || "GUEST REGISTRATION CARD"}</h2>
                  <div className="text-xs space-y-0.5">
                    <p>{previewData?.hotel?.address || hotelInfo?.address || ""}</p>
                    <p>
                      {previewData?.hotel?.city || hotelInfo?.city || ""}
                      {previewData?.hotel?.country || hotelInfo?.country ? `, ${previewData?.hotel?.country || hotelInfo?.country}` : ""}
                      {(previewData?.hotel?.phone || hotelInfo?.phone) && ` | Phone: ${previewData?.hotel?.phone || hotelInfo?.phone}`}
                    </p>
                  </div>
                  {/* <h3 className="text-lg font-bold border-y border-black py-1 mt-4 uppercase">Guest Registration Card</h3> */}
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
                          <span className="border-b border-gray-400 flex-1 min-h-3.5">{displayValue(previewData?.bookingNo)}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Guest Name :</span>
                          <span className="border-b border-gray-400 flex-1 min-h-3.5 uppercase font-semibold">{displayValue(previewData?.guestName)}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Mobile No :</span>
                          <span className="border-b border-gray-400 flex-1 min-h-3.5">{displayValue(previewData?.mobileNo)}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Email :</span>
                          <span className="border-b border-gray-400 flex-1 min-h-3.5">{displayValue(previewData?.email)}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Nationality :</span>
                          <span className="border-b border-gray-400 flex-1 min-h-3.5">{displayValue(previewData?.nationality)}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0 pt-1">Address :</span>
                          <div className="flex-1 space-y-1.5">
                            <div className="border-b border-gray-400 min-h-3.5 flex items-end">{addrLine1 || "-"}</div>
                            <div className="border-b border-gray-400 min-h-3.5 flex items-end">{addrLine2 || "-"}</div>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Company :</span>
                          <span className="border-b border-gray-400 flex-1 min-h-3.5">{displayValue(previewData?.company)}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">DOB :</span>
                          <span className="border-b border-gray-400 flex-1 min-h-3.5">{formatDateValue(previewData?.dob)}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Purpose of Visit :</span>
                          <span className="border-b border-gray-400 flex-1 min-h-3.5">{displayValue(previewData?.purposeOfVisit)}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Arrival From :</span>
                          <span className="border-b border-gray-400 flex-1 min-h-3.5">{displayValue(previewData?.arrivalFrom)}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Departure To :</span>
                          <span className="border-b border-gray-400 flex-1 min-h-3.5">{displayValue(previewData?.departureTo)}</span>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="w-[48%] space-y-2 text-[11px]">
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Room No :</span>
                          <span className="border-b border-gray-400 flex-1 min-h-3.5">{displayValue(previewRoomNumber)}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Room Type :</span>
                          <span className="border-b border-gray-400 flex-1 min-h-3.5">{displayValue(previewData?.roomType)}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Plan Type :</span>
                          <span className="border-b border-gray-400 flex-1 min-h-3.5">{displayValue(previewData?.planType)}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">No of Nights :</span>
                          <span className="border-b border-gray-400 flex-1 min-h-3.5">{displayValue(previewData?.noOfNights)}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Check-In :</span>
                          <span className="border-b border-gray-400 flex-1 min-h-3.5">{formatDateTimeValue(previewData?.checkIn)}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Check-Out :</span>
                          <span className="border-b border-gray-400 flex-1 min-h-3.5">{formatDateTimeValue(previewData?.checkOut)}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Adult Male :</span>
                          <span className="border-b border-gray-400 flex-1 min-h-3.5">{displayValue(previewData?.adultMale)}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Adult Female :</span>
                          <span className="border-b border-gray-400 flex-1 min-h-3.5">{displayValue(previewData?.adultFemale)}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Children :</span>
                          <span className="border-b border-gray-400 flex-1 min-h-3.5">{displayValue(previewData?.children)}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Total PAX :</span>
                          <span className="border-b border-gray-400 flex-1 min-h-3.5">{displayValue(previewData?.totalPax)}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Net Amount :</span>
                          <span className="border-b border-gray-400 flex-1 min-h-3.5">{previewData?.netAmount !== undefined ? `₹${Number(previewData.netAmount).toLocaleString()}` : "-"}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">ID Proof Type :</span>
                          <span className="border-b border-gray-400 flex-1 min-h-3.5">{displayValue((previewData as any)?.idProofType ?? previewData?.idProof)}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">ID Number :</span>
                          <span className="border-b border-gray-400 flex-1 min-h-3.5">{displayValue((previewData as any)?.idProofNumber)}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Passport No :</span>
                          <span className="border-b border-gray-400 flex-1 min-h-3.5">{displayValue((previewData as any)?.passportNo)}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-gray-700 uppercase text-[9px] w-32 shrink-0">Visa Details :</span>
                          <span className="border-b border-gray-400 flex-1 min-h-3.5">{displayValue((previewData as any)?.visaDetails)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Room Details Table */}
                    <div className="mt-3.75 flex justify-center">
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
                            <td className="border border-black p-3 font-semibold">{displayValue(previewRoomNumber)}</td>
                            <td className="border border-black p-3 text-center">{previewData?.adultMale ?? ""}</td>
                            <td className="border border-black p-3 text-center">{previewData?.adultFemale ?? ""}</td>
                            <td className="border border-black p-3 text-center">{previewData?.children ?? ""}</td>
                            <td className="border border-black p-3 uppercase">{previewData?.planType || ""}</td>
                            <td className="border border-black p-3 text-right font-bold">{previewData?.tariff ? `₹${previewData.tariff.toLocaleString()}` : ""}</td>
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
              disabled={!previewData || isLoadingGR}
            >
              <Printer className="h-3.5 w-3.5" /> Print GR Card
            </Button>
          </div>
        </div>
      </>
    </DashboardLayout>
  )
}
