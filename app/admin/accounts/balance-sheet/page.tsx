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
import { Download } from "lucide-react"

const balanceSheetData = {
  asOf: "January 31, 2024",
  assets: {
    current: [
      { name: "Cash in Hand", amount: 15000.00 },
      { name: "Bank Accounts", amount: 185000.00 },
      { name: "Accounts Receivable", amount: 24500.00 },
      { name: "Inventory - F&B", amount: 12000.00 },
      { name: "Inventory - Supplies", amount: 8500.00 },
      { name: "Prepaid Expenses", amount: 6000.00 },
    ],
    fixed: [
      { name: "Land", amount: 500000.00 },
      { name: "Building", amount: 1200000.00 },
      { name: "Less: Accumulated Depreciation - Building", amount: -180000.00 },
      { name: "Furniture & Fixtures", amount: 150000.00 },
      { name: "Less: Accumulated Depreciation - F&F", amount: -45000.00 },
      { name: "Equipment", amount: 80000.00 },
      { name: "Less: Accumulated Depreciation - Equipment", amount: -24000.00 },
      { name: "Vehicles", amount: 60000.00 },
      { name: "Less: Accumulated Depreciation - Vehicles", amount: -18000.00 },
    ],
    other: [
      { name: "Security Deposits", amount: 25000.00 },
      { name: "Intangible Assets (Software)", amount: 15000.00 },
    ]
  },
  liabilities: {
    current: [
      { name: "Accounts Payable", amount: 18500.00 },
      { name: "Accrued Expenses", amount: 12000.00 },
      { name: "Advance Deposits from Guests", amount: 35000.00 },
      { name: "GST Payable", amount: 17393.00 },
      { name: "TDS Payable", amount: 3300.00 },
      { name: "Salaries Payable", amount: 8000.00 },
    ],
    longTerm: [
      { name: "Bank Loan", amount: 400000.00 },
      { name: "Vehicle Loan", amount: 35000.00 },
    ]
  },
  equity: [
    { name: "Share Capital", amount: 500000.00 },
    { name: "Retained Earnings", amount: 850807.00 },
    { name: "Current Year Profit", amount: 164600.00 },
  ]
}

export default function BalanceSheetPage() {
  const [asOf, setAsOf] = useState("31-01-2024")

  const totalCurrentAssets = balanceSheetData.assets.current.reduce((sum, item) => sum + item.amount, 0)
  const totalFixedAssets = balanceSheetData.assets.fixed.reduce((sum, item) => sum + item.amount, 0)
  const totalOtherAssets = balanceSheetData.assets.other.reduce((sum, item) => sum + item.amount, 0)
  const totalAssets = totalCurrentAssets + totalFixedAssets + totalOtherAssets

  const totalCurrentLiabilities = balanceSheetData.liabilities.current.reduce((sum, item) => sum + item.amount, 0)
  const totalLongTermLiabilities = balanceSheetData.liabilities.longTerm.reduce((sum, item) => sum + item.amount, 0)
  const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities

  const totalEquity = balanceSheetData.equity.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Balance Sheet</h1>
          <p className="text-muted-foreground">As of {balanceSheetData.asOf}</p>
        </div>
        <div className="flex gap-2">
          <Select value={asOf} onValueChange={setAsOf}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="As of date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="31-01-2024">January 31, 2024</SelectItem>
              <SelectItem value="31-12-2023">December 31, 2023</SelectItem>
              <SelectItem value="31-03-2023">March 31, 2023</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Assets</div>
            <div className="text-2xl font-bold">${totalAssets.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Liabilities</div>
            <div className="text-2xl font-bold text-destructive">${totalLiabilities.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Equity</div>
            <div className="text-2xl font-bold text-primary">${totalEquity.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Assets */}
        <Card>
          <CardHeader>
            <CardTitle>ASSETS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Assets */}
            <div>
              <h4 className="font-semibold mb-2 text-muted-foreground">Current Assets</h4>
              <div className="space-y-1">
                {balanceSheetData.assets.current.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1.5 border-b">
                    <span className="text-sm">{item.name}</span>
                    <span className="text-sm font-medium">${item.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 font-semibold">
                  <span>Total Current Assets</span>
                  <span>${totalCurrentAssets.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Fixed Assets */}
            <div>
              <h4 className="font-semibold mb-2 text-muted-foreground">Fixed Assets</h4>
              <div className="space-y-1">
                {balanceSheetData.assets.fixed.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1.5 border-b">
                    <span className={`text-sm ${item.amount < 0 ? "pl-4 text-muted-foreground" : ""}`}>{item.name}</span>
                    <span className={`text-sm font-medium ${item.amount < 0 ? "text-destructive" : ""}`}>
                      {item.amount < 0 ? `(${Math.abs(item.amount).toLocaleString()})` : `$${item.amount.toLocaleString()}`}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between py-2 font-semibold">
                  <span>Total Fixed Assets (Net)</span>
                  <span>${totalFixedAssets.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Other Assets */}
            <div>
              <h4 className="font-semibold mb-2 text-muted-foreground">Other Assets</h4>
              <div className="space-y-1">
                {balanceSheetData.assets.other.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1.5 border-b">
                    <span className="text-sm">{item.name}</span>
                    <span className="text-sm font-medium">${item.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 font-semibold">
                  <span>Total Other Assets</span>
                  <span>${totalOtherAssets.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between py-3 font-bold text-lg bg-muted rounded px-3">
              <span>TOTAL ASSETS</span>
              <span>${totalAssets.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Liabilities & Equity */}
        <Card>
          <CardHeader>
            <CardTitle>LIABILITIES & EQUITY</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Liabilities */}
            <div>
              <h4 className="font-semibold mb-2 text-muted-foreground">Current Liabilities</h4>
              <div className="space-y-1">
                {balanceSheetData.liabilities.current.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1.5 border-b">
                    <span className="text-sm">{item.name}</span>
                    <span className="text-sm font-medium">${item.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 font-semibold">
                  <span>Total Current Liabilities</span>
                  <span>${totalCurrentLiabilities.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Long-term Liabilities */}
            <div>
              <h4 className="font-semibold mb-2 text-muted-foreground">Long-term Liabilities</h4>
              <div className="space-y-1">
                {balanceSheetData.liabilities.longTerm.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1.5 border-b">
                    <span className="text-sm">{item.name}</span>
                    <span className="text-sm font-medium">${item.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 font-semibold">
                  <span>Total Long-term Liabilities</span>
                  <span>${totalLongTermLiabilities.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between py-2 font-bold text-destructive">
              <span>TOTAL LIABILITIES</span>
              <span>${totalLiabilities.toLocaleString()}</span>
            </div>

            {/* Equity */}
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-2 text-muted-foreground">Owner's Equity</h4>
              <div className="space-y-1">
                {balanceSheetData.equity.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1.5 border-b">
                    <span className="text-sm">{item.name}</span>
                    <span className="text-sm font-medium">${item.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 font-bold text-primary">
                  <span>TOTAL EQUITY</span>
                  <span>${totalEquity.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between py-3 font-bold text-lg bg-muted rounded px-3">
              <span>TOTAL LIABILITIES & EQUITY</span>
              <span>${(totalLiabilities + totalEquity).toLocaleString()}</span>
            </div>

            {/* Balance Check */}
            <div className={`p-3 rounded text-center ${Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
              {Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1 
                ? "Balance Sheet is balanced" 
                : `Difference: $${Math.abs(totalAssets - (totalLiabilities + totalEquity)).toLocaleString()}`
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
