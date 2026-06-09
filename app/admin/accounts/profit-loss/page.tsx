"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Download, TrendingUp, TrendingDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAccountsProfitLoss } from "@/services/api/accounts.service"

type ProfitLossLine = {
  category?: string
  amount?: number
  lastPeriod?: number
}

function formatCurrency(value: unknown) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// P&L data loaded from API
export default function ProfitLossPage() {
  const { toast } = useToast()
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7))
  const [compareWith, setCompareWith] = useState("last-month")
  const [plData, setPlData] = useState<any>({ period: "", revenue: [], expenses: [] })
  const [loading, setLoading] = useState(true)

  const loadProfitLoss = async (periodStr: string) => {
    setLoading(true)
    try {
      const [year, month] = String(periodStr || "").split("-").map(Number)
      const data = await getAccountsProfitLoss({ month, year })
      setPlData(data || { period: periodStr, revenue: [], expenses: [] })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load P&L statement"
      toast({ title: "P&L unavailable", description: message, variant: "destructive" })
      setPlData({ period, revenue: [], expenses: [] })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProfitLoss(period) }, [period])

  const totalRevenue = (plData.revenue || []).reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0)
  const totalLastRevenue = (plData.revenue || []).reduce((sum: number, item: any) => sum + Number(item.lastPeriod || 0), 0)
  const totalExpenses = (plData.expenses || []).reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0)
  const totalLastExpenses = (plData.expenses || []).reduce((sum: number, item: any) => sum + Number(item.lastPeriod || 0), 0)
  const netProfit = totalRevenue - totalExpenses
  const lastNetProfit = totalLastRevenue - totalLastExpenses
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  const revenueChange = totalLastRevenue > 0 ? ((totalRevenue - totalLastRevenue) / totalLastRevenue) * 100 : 0
  const expenseChange = totalLastExpenses > 0 ? ((totalExpenses - totalLastExpenses) / totalLastExpenses) * 100 : 0
  const profitChange = lastNetProfit !== 0 ? ((netProfit - lastNetProfit) / lastNetProfit) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profit & Loss Statement</h1>
          <p className="text-muted-foreground">Income statement for {plData.period}</p>
        </div>
        <div className="flex gap-2">
          <Input type="month" value={period} onChange={(event) => setPeriod(event.target.value)} className="w-40" />
          <Select value={compareWith} onValueChange={setCompareWith}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Compare" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-month">vs Last Month</SelectItem>
              <SelectItem value="last-year">vs Last Year</SelectItem>
              <SelectItem value="budget">vs Budget</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Revenue</div>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <div className={`flex items-center text-xs ${revenueChange >= 0 ? "text-primary" : "text-destructive"}`}>
              {revenueChange >= 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
              {revenueChange >= 0 ? "+" : ""}{revenueChange.toFixed(1)}% vs last period
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Expenses</div>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <div className={`flex items-center text-xs ${expenseChange <= 0 ? "text-primary" : "text-destructive"}`}>
              {expenseChange <= 0 ? <TrendingDown className="mr-1 h-3 w-3" /> : <TrendingUp className="mr-1 h-3 w-3" />}
              {expenseChange >= 0 ? "+" : ""}{expenseChange.toFixed(1)}% vs last period
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Net Profit</div>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? "text-primary" : "text-destructive"}`}>
              {formatCurrency(netProfit)}
            </div>
            <div className={`flex items-center text-xs ${profitChange >= 0 ? "text-primary" : "text-destructive"}`}>
              {profitChange >= 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
              {profitChange >= 0 ? "+" : ""}{profitChange.toFixed(1)}% vs last period
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Profit Margin</div>
            <div className="text-2xl font-bold">{profitMargin.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Net Profit / Revenue</div>
          </CardContent>
        </Card>
      </div>

      {/* P&L Statement */}
      <Card>
        <CardHeader>
          <CardTitle>Income Statement</CardTitle>
          <CardDescription>For the period ending {plData.period}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Revenue Section */}
            <div>
              <h3 className="font-semibold text-lg mb-3 text-primary">REVENUE</h3>
              <div className="space-y-2">
                {(plData.revenue || []).map((item: ProfitLossLine, idx: number) => {
                  const amount = Number(item.amount || 0)
                  const lastPeriod = Number(item.lastPeriod || 0)
                  const change = lastPeriod ? ((amount - lastPeriod) / lastPeriod) * 100 : 0
                  return (
                    <div key={idx} className="grid grid-cols-4 py-2 border-b">
                      <span className="col-span-2">{item.category || "-"}</span>
                      <span className="text-right font-medium">{formatCurrency(amount)}</span>
                      <span className={`text-right text-sm ${change >= 0 ? "text-primary" : "text-destructive"}`}>
                        {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                      </span>
                    </div>
                  )
                })}
                <div className="grid grid-cols-4 py-3 font-bold bg-primary/5 rounded px-2">
                  <span className="col-span-2">Total Revenue</span>
                  <span className="text-right">{formatCurrency(totalRevenue)}</span>
                  <span className={`text-right ${revenueChange >= 0 ? "text-primary" : "text-destructive"}`}>
                    {revenueChange >= 0 ? "+" : ""}{revenueChange.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Expenses Section */}
            <div>
              <h3 className="font-semibold text-lg mb-3 text-destructive">EXPENSES</h3>
              <div className="space-y-2">
                {(plData.expenses || []).map((item: ProfitLossLine, idx: number) => {
                  const amount = Number(item.amount || 0)
                  const lastPeriod = Number(item.lastPeriod || 0)
                  const change = lastPeriod ? ((amount - lastPeriod) / lastPeriod) * 100 : 0
                  return (
                    <div key={idx} className="grid grid-cols-4 py-2 border-b">
                      <span className="col-span-2">{item.category || "-"}</span>
                      <span className="text-right font-medium">{formatCurrency(amount)}</span>
                      <span className={`text-right text-sm ${change <= 0 ? "text-primary" : "text-destructive"}`}>
                        {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                      </span>
                    </div>
                  )
                })}
                <div className="grid grid-cols-4 py-3 font-bold bg-destructive/5 rounded px-2">
                  <span className="col-span-2">Total Expenses</span>
                  <span className="text-right">{formatCurrency(totalExpenses)}</span>
                  <span className={`text-right ${expenseChange <= 0 ? "text-primary" : "text-destructive"}`}>
                    {expenseChange >= 0 ? "+" : ""}{expenseChange.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Net Profit */}
            <div className="pt-4 border-t-2">
              <div className="grid grid-cols-4 py-4 font-bold text-xl">
                <span className="col-span-2">NET PROFIT / (LOSS)</span>
                <span className={`text-right ${netProfit >= 0 ? "text-primary" : "text-destructive"}`}>
                  {formatCurrency(netProfit)}
                </span>
                <span className={`text-right ${profitChange >= 0 ? "text-primary" : "text-destructive"}`}>
                  {profitChange >= 0 ? "+" : ""}{profitChange.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
