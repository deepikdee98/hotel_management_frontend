"use client"

import { useEffect, useState } from "react"
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
  ArrowRightLeft,
  Receipt,
  Banknote,
  ClipboardList,
  BarChart,
  Calendar,
} from "lucide-react"
import { getAccountsDashboard, type AccountsTransaction } from "@/services/api/accounts.service"

// Data loaded from API

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
  const [summary, setSummary] = useState<Record<string, any>>({})
  const [liveTransactions, setLiveTransactions] = useState<AccountsTransaction[]>([])
  const [livePendingPayments, setLivePendingPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    getAccountsDashboard()
      .then((data) => {
        if (!active) return
        setSummary(data.summary as Record<string, any>)
        setLiveTransactions(data.recentTransactions)
        setLivePendingPayments(data.pendingPayments)
      })
      .catch(() => {
        if (!active) return
        setSummary({})
        setLiveTransactions([])
        setLivePendingPayments([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const formatCurrency = (value: unknown) => `₹${Number(value || 0).toLocaleString("en-IN")}`

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
            <div className="text-2xl font-bold">{formatCurrency(summary.todayRevenue)}</div>
            <p className="text-xs text-muted-foreground">{loading ? "Loading..." : "Live account data"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.todayExpenses)}</div>
            <p className="text-xs text-muted-foreground">{loading ? "Loading..." : "Live account data"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">{loading ? "Loading..." : "Live account data"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.pendingPayments)}</div>
            <p className="text-xs text-muted-foreground">{Number(summary.pendingInvoiceCount || 0)} invoices pending</p>
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
              {liveTransactions.map((txn: any) => (
                <div key={txn.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{txn.description}</p>
                    <p className="text-xs text-muted-foreground">{txn.date}</p>
                  </div>
                  <span className={String(txn.type).toLowerCase() === "income" ? "text-primary font-medium" : "text-destructive font-medium"}>
                    {String(txn.type).toLowerCase() === "income" ? "+" : "-"}{formatCurrency(txn.amount)}
                  </span>
                </div>
              ))}
              {!loading && liveTransactions.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">No recent transactions found.</p>
              )}
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
              {livePendingPayments.map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{payment.guest}</p>
                    <p className="text-xs text-muted-foreground">Due: {payment.dueDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(payment.amount)}</p>
                    <Badge variant="outline" className="text-xs">Pending</Badge>
                  </div>
                </div>
              ))}
              {!loading && livePendingPayments.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">No pending payments found.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>This Month's Summary</CardTitle>
          <CardDescription>Financial overview for the current period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Room Revenue</p>
              <p className="text-xl font-bold">{formatCurrency(summary.roomRevenue)}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">F&B Revenue</p>
              <p className="text-xl font-bold">{formatCurrency(summary.fbRevenue)}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Other Services</p>
              <p className="text-xl font-bold">{formatCurrency(summary.otherServicesRevenue)}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-xl font-bold text-destructive">{formatCurrency(summary.monthlyExpenses)}</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10">
              <p className="text-sm text-muted-foreground">Net Profit</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(summary.monthlyNetProfit)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
