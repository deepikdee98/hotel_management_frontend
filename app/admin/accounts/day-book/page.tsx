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

const mockDayBook = {
  date: "2024-01-15",
  openingCash: 5000.00,
  openingBank: 180000.00,
  entries: [
    { time: "08:30", type: "income", description: "Room 101 - Checkout (John Smith)", category: "Room Revenue", mode: "Cash", amount: 450.00 },
    { time: "09:15", type: "income", description: "Restaurant - Breakfast Orders", category: "F&B Revenue", mode: "Cash", amount: 120.00 },
    { time: "10:00", type: "expense", description: "Daily Newspaper Delivery", category: "Supplies", mode: "Cash", amount: 25.00 },
    { time: "11:30", type: "income", description: "Room 205 - Extension Payment", category: "Room Revenue", mode: "Credit Card", amount: 200.00 },
    { time: "12:00", type: "income", description: "Restaurant - Lunch Orders", category: "F&B Revenue", mode: "Cash", amount: 380.00 },
    { time: "13:00", type: "expense", description: "Kitchen Supplies - Urgent", category: "Supplies", mode: "Cash", amount: 150.00 },
    { time: "14:30", type: "income", description: "Room 302 - Checkout (Michael Brown)", category: "Room Revenue", mode: "UPI", amount: 1169.00 },
    { time: "15:00", type: "income", description: "Spa Services - Guest 401", category: "Other Services", mode: "Credit Card", amount: 200.00 },
    { time: "16:00", type: "expense", description: "AC Repair - Emergency", category: "Maintenance", mode: "Cash", amount: 350.00 },
    { time: "17:30", type: "income", description: "Room 118 - Advance Payment", category: "Room Revenue", mode: "Cash", amount: 500.00 },
    { time: "18:00", type: "income", description: "Restaurant - Dinner Orders", category: "F&B Revenue", mode: "Cash", amount: 450.00 },
    { time: "19:00", type: "income", description: "Bar Sales", category: "F&B Revenue", mode: "Cash", amount: 280.00 },
  ]
}

export default function DayBookPage() {
  const [selectedDate, setSelectedDate] = useState(mockDayBook.date)

  const incomeEntries = mockDayBook.entries.filter(e => e.type === "income")
  const expenseEntries = mockDayBook.entries.filter(e => e.type === "expense")
  
  const totalCashIncome = incomeEntries.filter(e => e.mode === "Cash").reduce((sum, e) => sum + e.amount, 0)
  const totalCardIncome = incomeEntries.filter(e => e.mode === "Credit Card").reduce((sum, e) => sum + e.amount, 0)
  const totalUPIIncome = incomeEntries.filter(e => e.mode === "UPI").reduce((sum, e) => sum + e.amount, 0)
  const totalCashExpense = expenseEntries.filter(e => e.mode === "Cash").reduce((sum, e) => sum + e.amount, 0)
  
  const totalIncome = incomeEntries.reduce((sum, e) => sum + e.amount, 0)
  const totalExpense = expenseEntries.reduce((sum, e) => sum + e.amount, 0)
  
  const closingCash = mockDayBook.openingCash + totalCashIncome - totalCashExpense
  const closingBank = mockDayBook.openingBank + totalCardIncome + totalUPIIncome

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
            <div className="text-2xl font-bold">${mockDayBook.openingCash.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Opening Bank</div>
            <div className="text-2xl font-bold">${mockDayBook.openingBank.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Day's Income</div>
            <div className="text-2xl font-bold text-primary">${totalIncome.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Day's Expense</div>
            <div className="text-2xl font-bold text-destructive">${totalExpense.toFixed(2)}</div>
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
              {mockDayBook.entries.map((entry, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{entry.time}</TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell>{entry.category}</TableCell>
                  <TableCell>{entry.mode}</TableCell>
                  <TableCell className="text-right text-primary">
                    {entry.type === "income" ? `$${entry.amount.toFixed(2)}` : "-"}
                  </TableCell>
                  <TableCell className="text-right text-destructive">
                    {entry.type === "expense" ? `$${entry.amount.toFixed(2)}` : "-"}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted font-bold">
                <TableCell colSpan={4}>TOTAL</TableCell>
                <TableCell className="text-right text-primary">${totalIncome.toFixed(2)}</TableCell>
                <TableCell className="text-right text-destructive">${totalExpense.toFixed(2)}</TableCell>
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
                <span className="font-bold">${totalCashIncome.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span>Credit/Debit Card</span>
                <span className="font-bold">${totalCardIncome.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span>UPI</span>
                <span className="font-bold">${totalUPIIncome.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 font-bold text-lg">
                <span>Total Income</span>
                <span className="text-primary">${totalIncome.toFixed(2)}</span>
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
                    Opening: ${mockDayBook.openingCash.toFixed(2)} + Income: ${totalCashIncome.toFixed(2)} - Expense: ${totalCashExpense.toFixed(2)}
                  </div>
                </div>
                <span className="font-bold text-lg">${closingCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <div className="font-medium">Closing Bank</div>
                  <div className="text-xs text-muted-foreground">
                    Opening: ${mockDayBook.openingBank.toFixed(2)} + Card: ${totalCardIncome.toFixed(2)} + UPI: ${totalUPIIncome.toFixed(2)}
                  </div>
                </div>
                <span className="font-bold text-lg">${closingBank.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 font-bold text-lg bg-muted p-3 rounded-lg">
                <span>Total Closing Balance</span>
                <span className="text-primary">${(closingCash + closingBank).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
