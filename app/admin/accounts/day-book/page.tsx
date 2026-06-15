"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Download, Printer, ChevronLeft, ChevronRight, Calendar } from "lucide-react"

// Day Book: load from API
import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { getAccountsDayBook } from "@/services/api/accounts.service"

function formatCurrency(value: unknown) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function DayBookPage() {
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [dayBook, setDayBook] = useState<any>({ date: selectedDate, openingCash: 0, openingBank: 0, entries: [] })
  const [loading, setLoading] = useState(true)

  const loadDayBook = async (date: string) => {
    setLoading(true)
    try {
      const data = await getAccountsDayBook({ date })
      setDayBook(data || { date, openingCash: 0, openingBank: 0, entries: [] })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load day book"
      toast({ title: "Day book unavailable", description: message, variant: "destructive" })
      setDayBook({ date, openingCash: 0, openingBank: 0, entries: [] })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDayBook(selectedDate) }, [selectedDate])

  const incomeEntries = (dayBook.entries || []).filter((e: any) => e.type === "income")
  const expenseEntries = (dayBook.entries || []).filter((e: any) => e.type === "expense")

  const totalCashIncome = incomeEntries.filter((e: any) => e.mode === "Cash").reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0)
  const totalCardIncome = incomeEntries.filter((e: any) => e.mode === "Credit Card").reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0)
  const totalUPIIncome = incomeEntries.filter((e: any) => e.mode === "UPI").reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0)
  const totalCashExpense = expenseEntries.filter((e: any) => e.mode === "Cash").reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0)

  const totalIncome = incomeEntries.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0)
  const totalExpense = expenseEntries.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0)

  const closingCash = Number(dayBook.openingCash || 0) + totalCashIncome - totalCashExpense
  const closingBank = Number(dayBook.openingBank || 0) + totalCardIncome + totalUPIIncome

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Day Book</h1>
          <p className="text-muted-foreground">Daily cash and transaction register</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              className="pl-8 w-40"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Opening Balance */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Opening Cash</div>
            <div className="text-2xl font-bold">{formatCurrency(dayBook.openingCash)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Opening Bank</div>
            <div className="text-2xl font-bold">{formatCurrency(dayBook.openingBank)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Day's Income</div>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Day's Expense</div>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalExpense)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Day's Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Day's Transactions - {selectedDate}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Time</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Payment Mode</TableHead>
                <TableHead className="text-right">Income</TableHead>
                <TableHead className="text-right">Expense</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(dayBook.entries || []).map((entry: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{entry.time}</TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell>{entry.category}</TableCell>
                  <TableCell>{entry.mode}</TableCell>
                  <TableCell className="text-right text-primary">
                    {entry.type === "income" ? formatCurrency(entry.amount) : "-"}
                  </TableCell>
                  <TableCell className="text-right text-destructive">
                    {entry.type === "expense" ? formatCurrency(entry.amount) : "-"}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted font-bold">
                <TableCell colSpan={4}>TOTAL</TableCell>
                <TableCell className="text-right text-primary">{formatCurrency(totalIncome)}</TableCell>
                <TableCell className="text-right text-destructive">{formatCurrency(totalExpense)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary by Payment Mode */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Income by Payment Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span>Cash</span>
                <span className="font-bold">{formatCurrency(totalCashIncome)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span>Credit/Debit Card</span>
                <span className="font-bold">{formatCurrency(totalCardIncome)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span>UPI</span>
                <span className="font-bold">{formatCurrency(totalUPIIncome)}</span>
              </div>
              <div className="flex justify-between items-center py-2 font-bold text-lg">
                <span>Total Income</span>
                <span className="text-primary">{formatCurrency(totalIncome)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Closing Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <div className="font-medium">Closing Cash</div>
                  <div className="text-xs text-muted-foreground">
                    Opening: {formatCurrency(dayBook.openingCash)} + Income: {formatCurrency(totalCashIncome)} - Expense: {formatCurrency(totalCashExpense)}
                  </div>
                </div>
                <span className="font-bold text-lg">{formatCurrency(closingCash)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <div className="font-medium">Closing Bank</div>
                  <div className="text-xs text-muted-foreground">
                    Opening: {formatCurrency(dayBook.openingBank)} + Card: {formatCurrency(totalCardIncome)} + UPI: {formatCurrency(totalUPIIncome)}
                  </div>
                </div>
                <span className="font-bold text-lg">{formatCurrency(closingBank)}</span>
              </div>
              <div className="flex justify-between items-center py-2 font-bold text-lg bg-muted p-3 rounded-lg">
                <span>Total Closing Balance</span>
                <span className="text-primary">{formatCurrency(closingCash + closingBank)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
