"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Download, TrendingUp, TrendingDown } from "lucide-react"

const plData = {
  period: "January 2024",
  revenue: [
    { category: "Room Revenue", amount: 185200.00, lastPeriod: 168500.00 },
    { category: "Food & Beverage", amount: 42800.00, lastPeriod: 38200.00 },
    { category: "Spa & Wellness", amount: 12500.00, lastPeriod: 11800.00 },
    { category: "Laundry Services", amount: 3200.00, lastPeriod: 2900.00 },
    { category: "Banquet & Events", amount: 18500.00, lastPeriod: 15000.00 },
    { category: "Other Income", amount: 2800.00, lastPeriod: 2400.00 },
  ],
  expenses: [
    { category: "Salaries & Wages", amount: 45000.00, lastPeriod: 43000.00 },
    { category: "Food & Beverage Cost", amount: 17120.00, lastPeriod: 15280.00 },
    { category: "Utilities", amount: 8500.00, lastPeriod: 7800.00 },
    { category: "Housekeeping Supplies", amount: 4200.00, lastPeriod: 3900.00 },
    { category: "Maintenance & Repairs", amount: 6500.00, lastPeriod: 5200.00 },
    { category: "Marketing & Advertising", amount: 3500.00, lastPeriod: 4000.00 },
    { category: "Insurance", amount: 2500.00, lastPeriod: 2500.00 },
    { category: "Depreciation", amount: 8000.00, lastPeriod: 8000.00 },
    { category: "Administrative Expenses", amount: 3200.00, lastPeriod: 2800.00 },
    { category: "Other Expenses", amount: 1880.00, lastPeriod: 1600.00 },
  ]
}

export default function ProfitLossPage() {
  const [period, setPeriod] = useState("01-2024")
  const [compareWith, setCompareWith] = useState("last-month")

  const totalRevenue = plData.revenue.reduce((sum, item) => sum + item.amount, 0)
  const totalLastRevenue = plData.revenue.reduce((sum, item) => sum + item.lastPeriod, 0)
  const totalExpenses = plData.expenses.reduce((sum, item) => sum + item.amount, 0)
  const totalLastExpenses = plData.expenses.reduce((sum, item) => sum + item.lastPeriod, 0)
  const netProfit = totalRevenue - totalExpenses
  const lastNetProfit = totalLastRevenue - totalLastExpenses
  const profitMargin = (netProfit / totalRevenue) * 100

  const revenueChange = ((totalRevenue - totalLastRevenue) / totalLastRevenue) * 100
  const expenseChange = ((totalExpenses - totalLastExpenses) / totalLastExpenses) * 100
  const profitChange = ((netProfit - lastNetProfit) / lastNetProfit) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profit & Loss Statement</h1>
          <p className="text-muted-foreground">Income statement for {plData.period}</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="01-2024">January 2024</SelectItem>
              <SelectItem value="Q4-2023">Q4 2023</SelectItem>
              <SelectItem value="FY-2023">FY 2023-24</SelectItem>
            </SelectContent>
          </Select>
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
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <div className={`flex items-center text-xs ${revenueChange >= 0 ? "text-primary" : "text-destructive"}`}>
              {revenueChange >= 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
              {revenueChange >= 0 ? "+" : ""}{revenueChange.toFixed(1)}% vs last period
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Expenses</div>
            <div className="text-2xl font-bold">${totalExpenses.toLocaleString()}</div>
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
              ${netProfit.toLocaleString()}
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
                {plData.revenue.map((item, idx) => {
                  const change = ((item.amount - item.lastPeriod) / item.lastPeriod) * 100
                  return (
                    <div key={idx} className="grid grid-cols-4 py-2 border-b">
                      <span className="col-span-2">{item.category}</span>
                      <span className="text-right font-medium">${item.amount.toLocaleString()}</span>
                      <span className={`text-right text-sm ${change >= 0 ? "text-primary" : "text-destructive"}`}>
                        {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                      </span>
                    </div>
                  )
                })}
                <div className="grid grid-cols-4 py-3 font-bold bg-primary/5 rounded px-2">
                  <span className="col-span-2">Total Revenue</span>
                  <span className="text-right">${totalRevenue.toLocaleString()}</span>
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
                {plData.expenses.map((item, idx) => {
                  const change = ((item.amount - item.lastPeriod) / item.lastPeriod) * 100
                  return (
                    <div key={idx} className="grid grid-cols-4 py-2 border-b">
                      <span className="col-span-2">{item.category}</span>
                      <span className="text-right font-medium">${item.amount.toLocaleString()}</span>
                      <span className={`text-right text-sm ${change <= 0 ? "text-primary" : "text-destructive"}`}>
                        {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                      </span>
                    </div>
                  )
                })}
                <div className="grid grid-cols-4 py-3 font-bold bg-destructive/5 rounded px-2">
                  <span className="col-span-2">Total Expenses</span>
                  <span className="text-right">${totalExpenses.toLocaleString()}</span>
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
                  ${netProfit.toLocaleString()}
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
