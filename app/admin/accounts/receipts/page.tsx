"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, Download, Printer, Eye } from "lucide-react"

const mockReceipts = [
  { id: "RCP-001", date: "2024-01-15", time: "14:30", guest: "John Smith", invoiceId: "INV-001", amount: 450.00, paymentMode: "Credit Card", reference: "CC-4521", receivedBy: "John Doe" },
  { id: "RCP-002", date: "2024-01-15", time: "13:15", guest: "Emma Wilson", invoiceId: "INV-002", amount: 200.00, paymentMode: "Cash", reference: "CASH-112", receivedBy: "Jane Smith" },
  { id: "RCP-003", date: "2024-01-14", time: "16:45", guest: "Michael Brown", invoiceId: "INV-003", amount: 1169.00, paymentMode: "UPI", reference: "UPI-9982", receivedBy: "John Doe" },
  { id: "RCP-004", date: "2024-01-14", time: "15:30", guest: "Robert Chen", invoiceId: "INV-005", amount: 500.00, paymentMode: "Credit Card", reference: "CC-4519", receivedBy: "Sarah Lee" },
  { id: "RCP-005", date: "2024-01-13", time: "12:00", guest: "Walk-in Guest", invoiceId: "INV-006", amount: 350.00, paymentMode: "Cash", reference: "CASH-108", receivedBy: "John Doe" },
]

export default function ReceiptsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const filteredReceipts = mockReceipts.filter((receipt) => {
    const matchesSearch = receipt.guest.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.invoiceId.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const totalAmount = filteredReceipts.reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Receipts</h1>
          <p className="text-muted-foreground">View all payment receipts</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export All
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Receipts</div>
            <div className="text-2xl font-bold">{filteredReceipts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Amount Collected</div>
            <div className="text-2xl font-bold text-primary">${totalAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Today's Collection</div>
            <div className="text-2xl font-bold">$650.00</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Receipts</CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-8 w-48"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Input
                type="date"
                className="w-36"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="From"
              />
              <Input
                type="date"
                className="w-36"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="To"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Invoice #</TableHead>
                <TableHead>Payment Mode</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Received By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell className="font-medium">{receipt.id}</TableCell>
                  <TableCell>
                    <div>{receipt.date}</div>
                    <div className="text-xs text-muted-foreground">{receipt.time}</div>
                  </TableCell>
                  <TableCell>{receipt.guest}</TableCell>
                  <TableCell>{receipt.invoiceId}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{receipt.paymentMode}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{receipt.reference}</TableCell>
                  <TableCell className="font-medium text-primary">${receipt.amount.toFixed(2)}</TableCell>
                  <TableCell>{receipt.receivedBy}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
