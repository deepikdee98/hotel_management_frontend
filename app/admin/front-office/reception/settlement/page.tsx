"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Save, RotateCcw, X, Printer, Loader2 } from "lucide-react"
import { getInHouseGuests, getFolioDetails, settleFolio } from "@/lib/backend-api"
import { useToast } from "@/hooks/use-toast"
import { useSetupOptions } from "@/hooks/use-setup-options"

export default function SettlementPage() {
  const { toast } = useToast()
  const paymentModeOptions = useSetupOptions("paymentMode")
  const ledgerAccountOptions = useSetupOptions("ledgerAccount")
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingFolio, setFetchingFolio] = useState(false)
  const [folioId, setFolioId] = useState("")
  const [form, setForm] = useState({
    roomNo: "",
    billAmount: "0.00",
    advancePaid: "0.00",
    discount: "0",
    paymentMode: "",
    ledgerAc: "",
    amountPaid: "",
    remark: "",
  })

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const res = await getInHouseGuests()
        if (res.success && res.data?.guests) {
          setRooms(res.data.guests)
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load in-house guests",
          variant: "destructive",
        })
      }
    }

    loadRooms()
  }, [])

  const handleRoomChange = async (checkinId: string) => {
    const selectedGuest = rooms.find(r => r.id === checkinId)
    setForm(prev => ({ ...prev, roomNo: checkinId }))
    
    if (!selectedGuest || !selectedGuest.folioId) {
      toast({
        title: "Error",
        description: "Folio not found for this room",
        variant: "destructive",
      })
      return
    }

    const targetFolioId = selectedGuest.folioId
    setFolioId(targetFolioId)
    setFetchingFolio(true)
    try {
      const res = await getFolioDetails(targetFolioId)
      if (res.success && res.data?.folio) {
        const folio = res.data.folio
        
        // Use summary data if charges are present, else fallback to room/guest plan data
        const totalCharges = folio.summary?.totalCharges || (Number(selectedGuest.planCharges || 0) * Number(selectedGuest.nights || 0)) || 0
        const totalPayments = folio.summary?.totalPayments || Number(selectedGuest.advanceAmount || 0) || 0
        
        setForm(prev => ({
          ...prev,
          billAmount: totalCharges.toFixed(2),
          advancePaid: totalPayments.toFixed(2),
          amountPaid: "0.00", 
        }))
      }
    } catch (error: any) {
      console.error("Folio fetch error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch folio details",
        variant: "destructive",
      })
    } finally {
      setFetchingFolio(false)
    }
  }

  const handleSettle = async () => {
    if (!folioId) {
      toast({
        title: "Error",
        description: "Please select a room first",
        variant: "destructive",
      })
      return
    }

    if (!form.paymentMode || !form.ledgerAc) {
      toast({
        title: "Error",
        description: "Please select payment mode and ledger account",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const billAmount = Number(form.billAmount)
      const advancePaid = Number(form.advancePaid)
      const discount = Number(form.discount)
      const netPayable = billAmount - advancePaid - discount
      const amountPaid = Number(form.amountPaid) || 0
      const balance = netPayable - amountPaid
      

      const isFullSettlement = Math.abs(balance) < 0.01

      const payload = {
        payments: [
          {
            amount: amountPaid,
            mode: form.paymentMode,
            ledgerAc: form.ledgerAc,
            remark: form.remark,
          }
        ],
        discount: discount,
        settlementType: isFullSettlement ? "Full" : "Partial",
        performCheckOut: isFullSettlement,
        remarks: form.remark,
      }
      const res = await settleFolio(folioId, payload)
      if (res.success) {
        toast({
          title: "Success",
          description: isFullSettlement 
            ? "Settlement and Check-Out completed successfully" 
            : "Partial settlement recorded successfully",
        })
        
        // Reset form and refresh room list
        setForm({
          roomNo: "",
          billAmount: "0.00",
          advancePaid: "0.00",
          discount: "0",
          paymentMode: "",
          ledgerAc: "",
          amountPaid: "",
          remark: "",
        })
        setFolioId("")
        
        const roomRes = await getInHouseGuests()
        if (roomRes.success && roomRes.data?.guests) {
          setRooms(roomRes.data.guests)
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete settlement",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  

  const billAmount = Number(form.billAmount)
  const advancePaid = Number(form.advancePaid)
  const discount = Number(form.discount)
  const netPayable = billAmount - advancePaid - discount
  const amountPaid = Number(form.amountPaid) || 0
  const balance = netPayable - amountPaid
  const isRefund = netPayable < 0

  useEffect(() => {
    if (netPayable < 0) {
      setForm(prev => ({
        ...prev,
        amountPaid: "0.00"
      }))
    }
  }, [netPayable])

  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
      <div className="space-y-4 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settlement Check-Out</h1>
          <p className="text-sm text-muted-foreground">Complete final billing and payment collection</p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Settlement Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Room No <span className="text-destructive">*</span></Label>
                <Select value={form.roomNo} onValueChange={handleRoomChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map(r => (
                      <SelectItem key={r._id || r.id} value={r._id || r.id}>
                        {r.roomNumber || r.number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Bill Amount</Label>
                <div className="relative">
                  <Input className="h-8 text-xs bg-muted font-medium" value={form.billAmount} readOnly />
                  {fetchingFolio && (
                    <div className="absolute right-2 top-1.5">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Advance Paid</Label>
                <Input className="h-8 text-xs bg-muted" value={form.advancePaid} readOnly />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Discount</Label>
                <Input className="h-8 text-xs" type="number" value={form.discount} onChange={e => setForm(prev => ({ ...prev, discount: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-foreground">Net Payable</span>
              <span className="text-lg font-bold text-primary">{netPayable.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Payment Mode <span className="text-destructive">*</span></Label>
                <Select value={form.paymentMode} onValueChange={v => {
                  setForm(prev => ({ ...prev, paymentMode: v, ledgerAc: v === "Cash" ? "Cash" : prev.ledgerAc }))
                }}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {paymentModeOptions.loading ? <SelectItem value="__loading__" disabled>Loading...</SelectItem> : paymentModeOptions.data.map(p => <SelectItem key={p._id} value={p.value}>{p.value}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ledger A/C <span className="text-destructive">*</span></Label>
                <Select value={form.ledgerAc} onValueChange={v => setForm(prev => ({ ...prev, ledgerAc: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {ledgerAccountOptions.loading ? <SelectItem value="__loading__" disabled>Loading...</SelectItem> : ledgerAccountOptions.data.map(l => <SelectItem key={l._id} value={l.value}>{l.value}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">
                  {isRefund ? "Refund Amount" : "Amount Received"}
                </Label>
                <Input
                  className="h-8 text-xs"
                  type="number"
                  min="0"
                  disabled={isRefund}
                  value={form.amountPaid}
                  onChange={e => {
                    const value = e.target.value
                    if (Number(value) >= 0) {
                      setForm(prev => ({ ...prev, amountPaid: value }))
                    }
                  }}
                  placeholder="0.00"
                />              </div>
              <div className="space-y-1">
                <Label className="text-xs">Balance</Label>
                <Input className="h-8 text-xs bg-muted font-medium" value={balance.toFixed(2)} readOnly />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Remarks</Label>
              <Input className="h-8 text-xs" value={form.remark} onChange={e => setForm(prev => ({ ...prev, remark: e.target.value }))} placeholder="Optional" />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 justify-end">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
            setForm(prev => ({ ...prev, roomNo: "", paymentMode: "", ledgerAc: "", amountPaid: "", discount: "0", remark: "", billAmount: "0.00", advancePaid: "0.00" }))
            setFolioId("")
          }} disabled={loading}><RotateCcw className="h-3.5 w-3.5" /> Reset</Button>
          <Button variant="outline" size="sm" className="gap-1.5" disabled={loading}><X className="h-3.5 w-3.5" /> Close</Button>
          <Button variant="outline" size="sm" className="gap-1.5" disabled={loading || !folioId}><Printer className="h-3.5 w-3.5" /> Print Receipt</Button>
          <Button size="sm" className="gap-1.5" onClick={handleSettle} disabled={loading || !folioId}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Settle
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
