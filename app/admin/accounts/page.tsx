"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Calculator,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  Receipt,
  Banknote,
  ClipboardList,
  BarChart,
  Calendar,
} from "lucide-react"

// Mock data
const recentTransactions = [
  { id: "TXN-001", date: "2024-01-15", description: "Room 101 - Checkout", type: "income", amount: 450.00 },
  { id: "TXN-002", date: "2024-01-15", description: "Restaurant - Order #234", type: "income", amount: 85.50 },
  { id: "TXN-003", date: "2024-01-15", description: "Laundry Supplies", type: "expense", amount: 120.00 },
  { id: "TXN-004", date: "2024-01-14", description: "Room 205 - Checkout", type: "income", amount: 380.00 },
  { id: "TXN-005", date: "2024-01-14", description: "Electricity Bill", type: "expense", amount: 850.00 },
]

const pendingPayments = [
  { id: "INV-002", guest: "Emma Wilson", amount: 520.00, dueDate: "Jan 16" },
  { id: "INV-004", guest: "Sarah Davis", amount: 640.00, dueDate: "Jan 18" },
  { id: "INV-007", guest: "Robert Chen", amount: 890.00, dueDate: "Jan 20" },
]

const quickLinks = [
  { label: "Transactions", href: "/admin/accounts/transactions", icon: ArrowRightLeft, description: "View all transactions" },
  { label: "Invoices", href: "/admin/accounts/invoices", icon: FileText, description: "Manage guest invoices" },
  { label: "Receipts", href: "/admin/accounts/receipts", icon: Receipt, description: "Payment receipts" },
  { label: "Payments", href: "/admin/accounts/payments", icon: Banknote, description: "Record payments" },
  { label: "Expenses", href: "/admin/accounts/expenses", icon: CreditCard, description: "Track expenses" },
  { label: "Ledger", href: "/admin/accounts/ledger", icon: ClipboardList, description: "General ledger" },
  { label: "Day Book", href: "/admin/accounts/day-book", icon: Calendar, description: "Daily transactions" },
  { label: "Profit & Loss", href: "/admin/accounts/profit-loss", icon: BarChart, description: "P&L statement" },
]

export default function AccountsDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Accounts Dashboard</h1>
        <p className="text-muted-foreground">Financial overview and quick access to accounting functions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,450</div>
            <div className="flex items-center text-xs text-primary">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              +18% from yesterday
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$3,280</div>
            <div className="flex items-center text-xs text-destructive">
              <ArrowDownRight className="mr-1 h-3 w-3" />
              +5% from yesterday
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$248,500</div>
            <div className="flex items-center text-xs text-primary">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              +12% from last month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$15,340</div>
            <p className="text-xs text-muted-foreground">12 invoices pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
          <CardDescription>Navigate to accounting modules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link key={link.href} href={link.href}>
                  <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted transition-colors">
                    <div className="p-2 rounded-md bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{link.label}</p>
                      <p className="text-xs text-muted-foreground">{link.description}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest financial activities</CardDescription>
            </div>
            <Link href="/admin/accounts/transactions">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{txn.description}</p>
                    <p className="text-xs text-muted-foreground">{txn.date}</p>
                  </div>
                  <span className={txn.type === "income" ? "text-primary font-medium" : "text-destructive font-medium"}>
                    {txn.type === "income" ? "+" : "-"}${txn.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pending Payments</CardTitle>
              <CardDescription>Outstanding invoices</CardDescription>
            </div>
            <Link href="/admin/accounts/invoices">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{payment.guest}</p>
                    <p className="text-xs text-muted-foreground">Due: {payment.dueDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">${payment.amount.toFixed(2)}</p>
                    <Badge variant="outline" className="text-xs">Pending</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>This Month's Summary</CardTitle>
          <CardDescription>Financial overview for January 2024</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Room Revenue</p>
              <p className="text-xl font-bold">$185,200</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">F&B Revenue</p>
              <p className="text-xl font-bold">$42,800</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Other Services</p>
              <p className="text-xl font-bold">$20,500</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-xl font-bold text-destructive">$82,400</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10">
              <p className="text-sm text-muted-foreground">Net Profit</p>
              <p className="text-xl font-bold text-primary">$166,100</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
