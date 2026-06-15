"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download } from "lucide-react"
import { getAccountsBalanceSheet } from "@/services/api/accounts.service"
import { useToast } from "@/hooks/use-toast"

type BalanceLine = {
  name: string
  amount: number
}

type BalanceSheetData = {
  asOf?: string
  assets?: {
    current?: BalanceLine[]
    fixed?: BalanceLine[]
    other?: BalanceLine[]
  }
  liabilities?: {
    current?: BalanceLine[]
    longTerm?: BalanceLine[]
  }
  equity?: BalanceLine[]
}

const emptyBalanceSheet: BalanceSheetData = {
  assets: { current: [], fixed: [], other: [] },
  liabilities: { current: [], longTerm: [] },
  equity: [],
}

function sumLines(lines: BalanceLine[] = []) {
  return lines.reduce((sum, item) => sum + Number(item.amount || 0), 0)
}

function money(value: number) {
  const amount = Math.abs(Number(value || 0)).toLocaleString()
  return value < 0 ? `(₹${amount})` : `₹${amount}`
}

function BalanceSection({ title, totalLabel, lines = [] }: { title: string; totalLabel: string; lines?: BalanceLine[] }) {
  const total = sumLines(lines)

  return (
    <div>
      <h4 className="mb-2 font-semibold text-muted-foreground">{title}</h4>
      <div className="space-y-1">
        {lines.map((item) => (
          <div key={`${title}-${item.name}`} className="flex justify-between gap-4 border-b py-1.5">
            <span className={`text-sm ${item.amount < 0 ? "pl-4 text-muted-foreground" : ""}`}>{item.name}</span>
            <span className={`text-sm font-medium ${item.amount < 0 ? "text-destructive" : ""}`}>{money(item.amount)}</span>
          </div>
        ))}
        {lines.length === 0 && (
          <div className="py-3 text-sm text-muted-foreground">No records found.</div>
        )}
        <div className="flex justify-between gap-4 py-2 font-semibold">
          <span>{totalLabel}</span>
          <span>{money(total)}</span>
        </div>
      </div>
    </div>
  )
}

export default function BalanceSheetPage() {
  const { toast } = useToast()
  const [asOf, setAsOf] = useState(() => new Date().toISOString().slice(0, 10))
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData>(emptyBalanceSheet)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)

    getAccountsBalanceSheet({ asOfDate: asOf })
      .then((data) => {
        if (!active) return
        setBalanceSheet(data || emptyBalanceSheet)
      })
      .catch((err) => {
        if (!active) return
        const message = err instanceof Error ? err.message : "Failed to load balance sheet"
        toast({ title: "Balance sheet unavailable", description: message, variant: "destructive" })
        setBalanceSheet(emptyBalanceSheet)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [asOf, toast])

  const assets = balanceSheet.assets || emptyBalanceSheet.assets!
  const liabilities = balanceSheet.liabilities || emptyBalanceSheet.liabilities!
  const equity = balanceSheet.equity || []

  const totalCurrentAssets = sumLines(assets.current)
  const totalFixedAssets = sumLines(assets.fixed)
  const totalOtherAssets = sumLines(assets.other)
  const totalAssets = totalCurrentAssets + totalFixedAssets + totalOtherAssets

  const totalCurrentLiabilities = sumLines(liabilities.current)
  const totalLongTermLiabilities = sumLines(liabilities.longTerm)
  const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities

  const totalEquity = sumLines(equity)
  const liabilitiesAndEquity = totalLiabilities + totalEquity
  const difference = Math.abs(totalAssets - liabilitiesAndEquity)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Balance Sheet</h1>
          <p className="text-muted-foreground">As of {balanceSheet.asOf || asOf}</p>
        </div>
        <div className="flex gap-2">
          <Input type="date" value={asOf} onChange={(event) => setAsOf(event.target.value)} className="w-44" />
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Assets</div>
            <div className="text-2xl font-bold">{money(totalAssets)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Liabilities</div>
            <div className="text-2xl font-bold text-destructive">{money(totalLiabilities)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Equity</div>
            <div className="text-2xl font-bold text-primary">{money(totalEquity)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>ASSETS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading balance sheet...</div>
            ) : (
              <>
                <BalanceSection title="Current Assets" totalLabel="Total Current Assets" lines={assets.current} />
                <BalanceSection title="Fixed Assets" totalLabel="Total Fixed Assets (Net)" lines={assets.fixed} />
                <BalanceSection title="Other Assets" totalLabel="Total Other Assets" lines={assets.other} />
              </>
            )}
            <div className="flex justify-between gap-4 rounded bg-muted px-3 py-3 text-lg font-bold">
              <span>TOTAL ASSETS</span>
              <span>{money(totalAssets)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>LIABILITIES & EQUITY</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading balance sheet...</div>
            ) : (
              <>
                <BalanceSection title="Current Liabilities" totalLabel="Total Current Liabilities" lines={liabilities.current} />
                <BalanceSection title="Long-term Liabilities" totalLabel="Total Long-term Liabilities" lines={liabilities.longTerm} />

                <div className="flex justify-between gap-4 py-2 font-bold text-destructive">
                  <span>TOTAL LIABILITIES</span>
                  <span>{money(totalLiabilities)}</span>
                </div>

                <div className="border-t pt-4">
                  <BalanceSection title="Owner's Equity" totalLabel="TOTAL EQUITY" lines={equity} />
                </div>
              </>
            )}

            <div className="flex justify-between gap-4 rounded bg-muted px-3 py-3 text-lg font-bold">
              <span>TOTAL LIABILITIES & EQUITY</span>
              <span>{money(liabilitiesAndEquity)}</span>
            </div>

            {!loading && (
              <div className={`rounded p-3 text-center ${difference < 1 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                {difference < 1 ? "Balance Sheet is balanced" : `Difference: ${money(difference)}`}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
