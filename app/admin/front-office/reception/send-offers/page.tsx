"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Send, Search, Plus, Mail, MessageSquare, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { getInHouseGuests, getOffers, sendOffer } from "@/lib/backend-api"

type Guest = {
  id: string
  roomNumber: string
  guestName: string
  email?: string
  phone?: string
}

type Offer = {
  _id: string
  title?: string
  channel?: string
  offer?: any
  status?: string
  createdAt?: string
  guestIds?: string[]
  targetType?: string
  sentBy?: string
}

export default function SendOffersPage() {
  const [search, setSearch] = useState("")
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [selectedGuests, setSelectedGuests] = useState<string[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    channel: "",
    subject: "",
    message: "",
    targetAudience: "",
    validFrom: "",
    validTo: "",
    discountType: "",
    discountValue: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [offersRes, guestsRes] = await Promise.all([
        getOffers(),
        getInHouseGuests()
      ])
      const offersData = Array.isArray(offersRes.data) ? offersRes.data : (offersRes as any).data?.offers || []
      setOffers(offersData)

      setGuests((guestsRes.data?.guests || []).map((g: any) => ({
        id: g.folioId || g._id,
        roomNumber: g.roomNumber,
        guestName: g.guestName,
        email: g.email,
        phone: g.phone
      })))
    } catch (err: any) {
      setError(err.message || "Failed to load data")
      console.error("Error loading data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendOffer = async () => {
    try {
      setSending(true)
      setError(null)
      setSuccess(false)

      if (!formData.title || !formData.channel || !formData.message) {
        setError("Please fill in all required fields")
        setSending(false)
        return
      }

      const guestIds = formData.targetAudience === "custom" ? selectedGuests : guests.map(g => g.id)

      const response = await sendOffer({
        targetType: formData.targetAudience || "in-house",
        guestIds,
        channel: formData.channel,
        offer: {
          title: formData.title,
          message: formData.message,
          subject: formData.subject,
          validFrom: formData.validFrom,
          validTo: formData.validTo,
          discountType: formData.discountType,
          discountValue: formData.discountValue
        }
      }) as any

      // Add the newly created offer to the list immediately
      if (response?.data) {
        const newOffer: Offer = {
          _id: response.data._id || response.data.id,
          title: formData.title,
          channel: formData.channel,
          offer: response.data.offer || {
            title: formData.title,
            guestIds: guestIds
          },
          guestIds: guestIds,
          status: "sent",
          createdAt: new Date().toISOString()
        }
        setOffers(prev => [newOffer, ...prev])
      }

      setSuccess(true)
      setIsNewOpen(false)
      setFormData({
        title: "",
        channel: "",
        subject: "",
        message: "",
        targetAudience: "",
        validFrom: "",
        validTo: "",
        discountType: "",
        discountValue: "",
      })
      setSelectedGuests([])

      // Refresh data from backend after a short delay
      setTimeout(() => loadData(), 1000)
    } catch (err: any) {
      setError(err.message || "Failed to send offer")
      console.error("Error sending offer:", err)
    } finally {
      setSending(false)
    }
  }

  const filtered = offers.filter(
    (o) => {
      const title = (typeof o.offer === 'object' && o.offer?.title) ? o.offer.title : (o.title || "")
      return title.toLowerCase().includes(search.toLowerCase())
    }
  )

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "sent": return <Badge className="bg-primary/10 text-primary border-primary/20"><CheckCircle className="h-3 w-3 mr-1" />Sent</Badge>
      case "draft": return <Badge variant="secondary">Draft</Badge>
      case "scheduled": return <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Clock className="h-3 w-3 mr-1" />Scheduled</Badge>
      default: return <Badge variant="outline">{status || "Sent"}</Badge>
    }
  }

  const toggleGuest = (id: string) => {
    setSelectedGuests((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    )
  }

  const sentCount = offers.filter(o => o.status === "sent").length
  const draftCount = offers.filter(o => o.status === "draft").length
  const scheduledCount = offers.filter(o => o.status === "scheduled").length
  const totalRecipients = offers.reduce((sum, o) => {
    const count = Array.isArray(o.guestIds) ? o.guestIds.length : (typeof o.offer === 'object' && Array.isArray(o.offer?.guestIds) ? o.offer.guestIds.length : 0)
    return sum + count
  }, 0)

  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
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
            <AlertDescription className="text-green-600">Offer sent successfully!</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Send Offers</h1>
            <p className="text-sm text-muted-foreground">Create and send promotional offers to guests via SMS and Email</p>
          </div>
          <Button onClick={() => setIsNewOpen(true)} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            Create Offer
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Sent", value: sentCount, icon: Send },
            { label: "Drafts", value: draftCount, icon: Mail },
            { label: "Scheduled", value: scheduledCount, icon: Clock },
            { label: "Total Recipients", value: totalRecipients, icon: MessageSquare },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="py-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search offers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                disabled={loading}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">Loading offers...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">
                  {offers.length === 0 ? "No offers yet" : "No results match your search"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Offer Title</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Sent Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((o) => {
                    // Helper to get offer title from different possible locations
                    const getOfferTitle = () => {
                      if (typeof o.offer === 'object' && o.offer?.title) return o.offer.title
                      if (o.title) return o.title
                      return "N/A"
                    }

                    // Helper to get guest IDs count
                    const getGuestCount = () => {
                      if (Array.isArray(o.guestIds)) return o.guestIds.length
                      if (typeof o.offer === 'object' && Array.isArray(o.offer?.guestIds)) return o.offer.guestIds.length
                      return 0
                    }

                    return (
                      <TableRow key={o._id}>
                        <TableCell className="font-medium">{getOfferTitle()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {o.channel === "email" ? <Mail className="h-3 w-3 mr-1" /> : o.channel === "sms" ? <MessageSquare className="h-3 w-3 mr-1" /> : <Send className="h-3 w-3 mr-1" />}
                            {o.channel || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>{getGuestCount()}</TableCell>
                        <TableCell>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>{getStatusBadge(o.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline">View</Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Offer</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="details">Offer Details</TabsTrigger>
                <TabsTrigger value="recipients">Recipients</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Offer Title *</Label>
                    <Input placeholder="e.g. Weekend Special - 30% Off" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Channel *</Label>
                    <Select value={formData.channel} onValueChange={(v) => setFormData({ ...formData, channel: v })}>
                      <SelectTrigger><SelectValue placeholder="Select channel" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Target Audience</Label>
                    <Select value={formData.targetAudience} onValueChange={(v) => setFormData({ ...formData, targetAudience: v })}>
                      <SelectTrigger><SelectValue placeholder="Select audience" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in-house">All In-House Guests</SelectItem>
                        <SelectItem value="custom">Custom Selection</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valid From</Label>
                    <Input type="date" value={formData.validFrom} onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Valid To</Label>
                    <Input type="date" value={formData.validTo} onChange={(e) => setFormData({ ...formData, validTo: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Discount Type</Label>
                    <Select value={formData.discountType} onValueChange={(v) => setFormData({ ...formData, discountType: v })}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="flat">Flat Amount</SelectItem>
                        <SelectItem value="complimentary">Complimentary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Discount Value</Label>
                    <Input placeholder={formData.discountType === "percentage" ? "e.g. 30" : "e.g. 5000"} value={formData.discountValue} onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })} />
                  </div>
                </div>
                {formData.channel !== "sms" && (
                  <div className="space-y-2">
                    <Label>Email Subject</Label>
                    <Input placeholder="Subject line for email" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Message *</Label>
                  <Textarea rows={4} placeholder="Compose your offer message..." value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} />
                </div>
              </TabsContent>
              <TabsContent value="recipients" className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  {formData.targetAudience === "custom"
                    ? "Select specific guests to receive this offer:"
                    : "This offer will be sent to all in-house guests"}
                </p>
                {formData.targetAudience === "custom" && (
                  <div className="border rounded-lg">
                    {loading ? (
                      <div className="p-4 text-center">
                        <p className="text-muted-foreground">Loading guests...</p>
                      </div>
                    ) : guests.length === 0 ? (
                      <div className="p-4 text-center">
                        <p className="text-muted-foreground">No in-house guests available</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10">
                              <Checkbox
                                checked={selectedGuests.length === guests.length && guests.length > 0}
                                onCheckedChange={() => {
                                  if (selectedGuests.length === guests.length) {
                                    setSelectedGuests([])
                                  } else {
                                    setSelectedGuests(guests.map((g) => g.id))
                                  }
                                }}
                              />
                            </TableHead>
                            <TableHead>Room</TableHead>
                            <TableHead>Guest Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {guests.map((g) => (
                            <TableRow key={g.id}>
                              <TableCell>
                                <Checkbox checked={selectedGuests.includes(g.id)} onCheckedChange={() => toggleGuest(g.id)} />
                              </TableCell>
                              <TableCell className="font-medium">{g.roomNumber}</TableCell>
                              <TableCell>{g.guestName}</TableCell>
                              <TableCell className="text-sm">{g.email || "-"}</TableCell>
                              <TableCell className="text-sm">{g.phone || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
                <p className="text-sm text-muted-foreground">{selectedGuests.length} guest(s) selected</p>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewOpen(false)} disabled={sending}>Cancel</Button>
              <Button
                onClick={handleSendOffer}
                disabled={sending || !formData.title || !formData.channel || !formData.message}
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? "Sending..." : "Send Offer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
