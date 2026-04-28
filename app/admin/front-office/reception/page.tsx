"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import {
  LogIn, Zap, UserPlus, FileText, Banknote, ArrowRightLeft,
  Lock, ConciergeBell, DoorOpen, Receipt, Link2, MessageSquare,
  CalendarPlus, Send, CalendarCheck, CreditCard
} from "lucide-react"


const RECEPTION_OPTIONS = [
  { label: "Check-In", desc: "Register guest arrival and assign room", href: "/admin/front-office/reception/check-in", icon: LogIn },
  { label: "Express Check-In", desc: "Fast-track check-in for repeat guests", href: "/admin/front-office/reception/express-check-in", icon: Zap },
  { label: "PAX Check-In", desc: "Check-in additional guest in occupied room", href: "/admin/front-office/reception/pax-check-in", icon: UserPlus },
  { label: "GR Card", desc: "Print Guest Registration Card", href: "/admin/front-office/reception/gr-card", icon: FileText },
  { label: "Room Advance", desc: "Record advance payment for a room", href: "/admin/front-office/reception/room-advance", icon: Banknote },
  { label: "Shift Room", desc: "Transfer guest to a different room", href: "/admin/front-office/reception/shift-room", icon: ArrowRightLeft },
  { label: "Block Room", desc: "Mark room as unavailable", href: "/admin/front-office/reception/block-room", icon: Lock },
  { label: "Post Other Services", desc: "Add external service charges to folio", href: "/admin/front-office/reception/post-services", icon: ConciergeBell },
  { label: "Check-Out", desc: "Process guest departure and billing", href: "/admin/front-office/reception/check-out", icon: DoorOpen },
  { label: "Settlement", desc: "Complete final billing and payment", href: "/admin/front-office/reception/settlement", icon: Receipt },
  { label: "Room Link/Unlink", desc: "Link or separate room billing folios", href: "/admin/front-office/reception/room-link", icon: Link2 },
  { label: "Paidout/Refund", desc: "Process refund or paid-out amounts", href: "/admin/front-office/reception/paidout-refund", icon: Banknote },
  { label: "Guest Complaint", desc: "Log and track guest complaints", href: "/admin/front-office/reception/guest-complaint", icon: MessageSquare },
  { label: "Extend Checkout", desc: "Extend guest stay beyond checkout date", href: "/admin/front-office/reception/extend-checkout", icon: CalendarPlus },
  { label: "Send Offers", desc: "Send promotions via SMS/Email/WhatsApp", href: "/admin/front-office/reception/send-offers", icon: Send },
  { label: "Events/Plan", desc: "Manage hotel events and guest reminders", href: "/admin/front-office/reception/events", icon: CalendarCheck },
  { label: "Post Room Tariff", desc: "Manually adjust room tariff charges", href: "/admin/front-office/reception/post-room-tariff", icon: CreditCard },
  { label: "Advance Transfer", desc: "Transfer advance payment between rooms", href: "/admin/front-office/reception/advance-transfer", icon: ArrowRightLeft },
]

export default function ReceptionPage() {
  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reception</h1>
          <p className="text-sm text-muted-foreground">Central area for daily guest services</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {RECEPTION_OPTIONS.map((opt) => {
            const Icon = opt.icon
            return (
              <Link key={opt.href} href={opt.href}>
                <Card className="h-full hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group">
                  <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                    <div className="rounded-lg bg-primary/10 p-2.5 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground leading-tight">{opt.label}</span>
                    <span className="text-xs text-muted-foreground leading-tight">{opt.desc}</span>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}
