"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Banknote, Search, Plus, ArrowUpRight, ArrowDownLeft, Loader2, AlertCircle } from "lucide-react"
import { getInHouseGuests, createPaidoutRefund, getPaidoutRefundTransactions } from "@/lib/backend-api"
import { useToast } from "@/hooks/use-toast"

interface Transaction {
  _id: string
  type: "paidout" | "refund"
  roomNo: string
  guestName: string
  amount: number
  reason: string
  date: string
  approvedBy: string
}

interface InHouseGuest {
  folioId: string
  roomNumber: string
  guestName: string
}

export default function PaidoutRefundPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [txnType, setTxnType] = useState<"paidout" | "refund">("paidout")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [rooms, setRooms] = useState<InHouseGuest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    roomNo: "",
    amount: "",
    reason: "",
    paymentMode: "",
    authorizedBy: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch in-house guests
      const guestRes = await getInHouseGuests()
      if (guestRes.success && guestRes.data?.guests) {
        const mappedRooms = guestRes.data.guests.map((guest: any) => ({
          folioId: guest.folioId || guest._id,
          roomNumber: guest.roomNumber,
          guestName: guest.guestName,
        }))
        setRooms(mappedRooms)
      }

      // Fetch transactions
      const txnRes = await getPaidoutRefundTransactions()
      const txnData = Array.isArray(txnRes) ? txnRes : txnRes.data || []
      setTransactions(txnData)
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
    if (!formData.roomNo || !formData.amount || !formData.reason || !formData.paymentMode) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)

      const payload = {
        type: txnType === "refund" ? "Refund" : "Paidout",
        amount: parseFloat(formData.amount),
        paymentMode: formData.paymentMode,
        approvedBy: formData.authorizedBy,
        remarks: formData.reason,
      }

      await createPaidoutRefund(formData.roomNo, payload)

      toast({
        title: "Success",
        description: `${txnType === "refund" ? "Refund" : "Paidout"} processed successfully`,
      })

      setIsNewOpen(false)
      setFormData({
        roomNo: "",
        amount: "",
        reason: "",
        paymentMode: "",
        authorizedBy: "",
      })

      await loadData()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to process transaction"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.guestName.toLowerCase().includes(search.toLowerCase()) ||
      t.roomNo.includes(search)
    const matchesTab = activeTab === "all" || t.type === activeTab
    return matchesSearch && matchesTab
  })

  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Paidout / Refund</h1>
            <p className="text-sm text-muted-foreground">Manage guest paidouts and refunds</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setTxnType("paidout"); setIsNewOpen(true) }} disabled={loading}>
              <ArrowUpRight className="h-4 w-4 mr-2" />
              New Paidout
            </Button>
            <Button onClick={() => { setTxnType("refund"); setIsNewOpen(true) }} disabled={loading}>
              <ArrowDownLeft className="h-4 w-4 mr-2" />
              New Refund
            </Button>
          </div>
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
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by guest or room..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="paidout">Paidouts</TabsTrigger>
                  <TabsTrigger value="refund">Refunds</TabsTrigger>
                </TabsList>
              </Tabs>
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
                    <TableHead>Type</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Approved By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length > 0 ? (
                    filtered.map((t) => (
                      <TableRow key={t._id}>
                        <TableCell>
                          <Badge variant={t.type === "paidout" ? "secondary" : "destructive"}>
                            {t.type === "paidout" ? "Paidout" : "Refund"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{t.roomNo}</TableCell>
                        <TableCell>{t.guestName}</TableCell>
                        <TableCell className="font-medium">₹{t.amount.toFixed(2)}</TableCell>
                        <TableCell className="max-w-sm truncate text-sm">{t.reason}</TableCell>
                        <TableCell className="text-sm">{t.date}</TableCell>
                        <TableCell className="text-sm">{t.approvedBy}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No transactions found
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
              <DialogTitle>
                {txnType === "paidout" ? "New Paidout" : "New Refund"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="space-y-2">
                <Label>Room Number *</Label>
                <Select value={formData.roomNo} onValueChange={(v) => setFormData({ ...formData, roomNo: v })}>
                  <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                  <SelectContent>
                    {rooms.map((r) => (
                      <SelectItem key={r.folioId} value={r.folioId}>
                        {r.roomNumber} - {r.guestName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input type="number" placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Payment Mode *</Label>
                <Select value={formData.paymentMode} onValueChange={(v) => setFormData({ ...formData, paymentMode: v })}>
                  <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Authorized By</Label>
                <Input placeholder="Manager name" value={formData.authorizedBy} onChange={(e) => setFormData({ ...formData, authorizedBy: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Reason / Remarks *</Label>
                <Textarea placeholder="Describe the reason for this transaction..." value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewOpen(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!formData.roomNo || !formData.amount || !formData.reason || !formData.paymentMode || submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {txnType === "paidout" ? "Process Paidout" : "Process Refund"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
