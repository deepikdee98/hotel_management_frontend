"use client"

import { useEffect, useState } from "react"
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
import { getAccountsReceipts, type AccountsPayment } from "@/services/api/accounts.service"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Receipts loaded from API

function formatCurrency(value: unknown) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function sourceLabel(sourceModule?: string) {
  return sourceModule === "front-office" ? "Front Office" : "Manual"
}

export default function ReceiptsPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [receipts, setReceipts] = useState<AccountsPayment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)

    getAccountsReceipts({ search: searchQuery, fromDate: dateFrom, toDate: dateTo, sourceModule: sourceFilter, limit: 100 })
      .then((result) => {
        if (!active) return
        setReceipts(result.receipts)
      })
      .catch((err) => {
        if (!active) return
        const message = err instanceof Error ? err.message : "Failed to load receipts"
        toast({ title: "Receipts unavailable", description: message, variant: "destructive" })
        setReceipts([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [searchQuery, dateFrom, dateTo, sourceFilter, toast])

  const sourceReceipts = receipts.map((receipt) => ({
    id: receipt.id,
    receiptNumber: receipt.receiptNumber || receipt.id,
    date: receipt.date.slice(0, 10),
    time: receipt.date.includes("T") ? receipt.date.slice(11, 16) : "",
    guest: receipt.payer || receipt.payee,
    invoiceId: receipt.invoiceNumber || receipt.reference || "-",
    amount: receipt.amount,
    paymentMode: receipt.mode,
    reference: receipt.reference || "-",
    receivedBy: "-",
    sourceModule: receipt.sourceModule,
  }))

  const filteredReceipts = sourceReceipts.filter((receipt) => {
    const matchesSearch = receipt.guest.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Today's Collection</div>
            <div className="text-2xl font-bold">{formatCurrency(receipts.filter((receipt) => receipt.date.slice(0, 10) === new Date().toISOString().slice(0, 10)).reduce((sum, receipt) => sum + receipt.amount, 0))}</div>
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
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="front-office">Front Office</SelectItem>
                </SelectContent>
              </Select>
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
                <TableHead>Source</TableHead>
                <TableHead>Received By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">Loading receipts...</TableCell>
                </TableRow>
              )}
              {!loading && filteredReceipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell className="font-medium">{receipt.receiptNumber}</TableCell>
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
                  <TableCell className="font-medium text-primary">{formatCurrency(receipt.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={receipt.sourceModule === "front-office" ? "secondary" : "outline"}>
                      {sourceLabel(receipt.sourceModule)}
                    </Badge>
                  </TableCell>
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
              {!loading && filteredReceipts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">No receipts found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
