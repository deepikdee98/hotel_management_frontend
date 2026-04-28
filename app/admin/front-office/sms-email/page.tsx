"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Mail, MessageSquare, Send, Search, Plus, CheckCircle, XCircle, Clock } from "lucide-react"

const MOCK_MESSAGES = [
  { id: 1, type: "email", to: "james@email.com", recipient: "James Wilson", subject: "Welcome to Grand Heritage", sentAt: "2024-12-18 14:30", status: "delivered" },
  { id: 2, type: "sms", to: "+91 98765 43210", recipient: "James Wilson", subject: "Check-In Confirmation", sentAt: "2024-12-18 14:32", status: "delivered" },
  { id: 3, type: "email", to: "emma@email.com", recipient: "Emma Davis", subject: "Booking Confirmation #2045", sentAt: "2024-12-19 10:15", status: "delivered" },
  { id: 4, type: "email", to: "robert@email.com", recipient: "Robert Brown", subject: "Pre-Arrival Information", sentAt: "2024-12-20 09:00", status: "failed" },
  { id: 5, type: "sms", to: "+91 87654 32109", recipient: "Emma Davis", subject: "Checkout Reminder", sentAt: "2024-12-21 08:00", status: "pending" },
]

export default function SMSEmailPage() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [composeType, setComposeType] = useState<"email" | "sms">("email")
  const [formData, setFormData] = useState({
    to: "",
    subject: "",
    message: "",
    template: "",
  })

  const filtered = MOCK_MESSAGES.filter((m) => {
    const matchesSearch = m.recipient.toLowerCase().includes(search.toLowerCase()) || m.to.includes(search) || m.subject.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === "all" || m.type === typeFilter
    return matchesSearch && matchesType
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered": return <Badge className="bg-primary/10 text-primary border-primary/20"><CheckCircle className="h-3 w-3 mr-1" />Delivered</Badge>
      case "failed": return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>
      case "pending": return <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">SMS / Email</h1>
            <p className="text-sm text-muted-foreground">Send and track guest communications via SMS and Email</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setComposeType("sms"); setIsComposeOpen(true) }}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Send SMS
            </Button>
            <Button onClick={() => { setComposeType("email"); setIsComposeOpen(true) }}>
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Sent", value: MOCK_MESSAGES.length, icon: Send },
            { label: "Emails", value: MOCK_MESSAGES.filter((m) => m.type === "email").length, icon: Mail },
            { label: "SMS", value: MOCK_MESSAGES.filter((m) => m.type === "sms").length, icon: MessageSquare },
            { label: "Delivered", value: MOCK_MESSAGES.filter((m) => m.status === "delivered").length, icon: CheckCircle },
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
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search messages..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      {m.type === "email" ? (
                        <Badge variant="outline"><Mail className="h-3 w-3 mr-1" />Email</Badge>
                      ) : (
                        <Badge variant="outline"><MessageSquare className="h-3 w-3 mr-1" />SMS</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{m.recipient}</TableCell>
                    <TableCell className="text-sm">{m.to}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{m.subject}</TableCell>
                    <TableCell className="text-sm">{m.sentAt}</TableCell>
                    <TableCell>{getStatusBadge(m.status)}</TableCell>
                    <TableCell className="text-right">
                      {m.status === "failed" ? (
                        <Button size="sm" variant="outline">Resend</Button>
                      ) : (
                        <Button size="sm" variant="ghost">View</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {composeType === "email" ? "Compose Email" : "Compose SMS"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Template (Optional)</Label>
                <Select value={formData.template} onValueChange={(v) => setFormData({ ...formData, template: v })}>
                  <SelectTrigger><SelectValue placeholder="Select a template" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome">Welcome Message</SelectItem>
                    <SelectItem value="booking-confirm">Booking Confirmation</SelectItem>
                    <SelectItem value="pre-arrival">Pre-Arrival Info</SelectItem>
                    <SelectItem value="checkout-reminder">Checkout Reminder</SelectItem>
                    <SelectItem value="thank-you">Thank You / Feedback</SelectItem>
                    <SelectItem value="custom">Custom Message</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{composeType === "email" ? "Email Address" : "Phone Number"}</Label>
                <Input
                  placeholder={composeType === "email" ? "guest@email.com" : "+91 XXXXX XXXXX"}
                  value={formData.to}
                  onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                />
              </div>
              {composeType === "email" && (
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input placeholder="Email subject" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} />
                </div>
              )}
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  rows={composeType === "email" ? 6 : 4}
                  placeholder={composeType === "email" ? "Compose your email message..." : "Type your SMS message (160 chars max)..."}
                  maxLength={composeType === "sms" ? 160 : undefined}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
                {composeType === "sms" && (
                  <p className="text-xs text-muted-foreground text-right">{formData.message.length}/160 characters</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsComposeOpen(false)}>Cancel</Button>
              <Button disabled={!formData.to || !formData.message}>
                <Send className="h-4 w-4 mr-2" />
                Send {composeType === "email" ? "Email" : "SMS"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
