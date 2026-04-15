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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Search } from "lucide-react"

const ledgerAccounts = [
  { code: "1001", name: "Cash in Hand", type: "Asset", balance: 15000.00, balanceType: "Dr" },
  { code: "1002", name: "Bank Account - Main", type: "Asset", balance: 185000.00, balanceType: "Dr" },
  { code: "1003", name: "Accounts Receivable", type: "Asset", balance: 24500.00, balanceType: "Dr" },
  { code: "2001", name: "Accounts Payable", type: "Liability", balance: 12800.00, balanceType: "Cr" },
  { code: "2002", name: "Advance Deposits", type: "Liability", balance: 35000.00, balanceType: "Cr" },
  { code: "3001", name: "Capital", type: "Equity", balance: 500000.00, balanceType: "Cr" },
  { code: "4001", name: "Room Revenue", type: "Income", balance: 185200.00, balanceType: "Cr" },
  { code: "4002", name: "F&B Revenue", type: "Income", balance: 42800.00, balanceType: "Cr" },
  { code: "4003", name: "Other Services Revenue", type: "Income", balance: 20500.00, balanceType: "Cr" },
  { code: "5001", name: "Salaries & Wages", type: "Expense", balance: 45000.00, balanceType: "Dr" },
  { code: "5002", name: "Utilities", type: "Expense", balance: 8500.00, balanceType: "Dr" },
  { code: "5003", name: "Supplies", type: "Expense", balance: 12400.00, balanceType: "Dr" },
  { code: "5004", name: "Maintenance", type: "Expense", balance: 6500.00, balanceType: "Dr" },
]

const ledgerEntries = [
  { date: "2024-01-15", particulars: "Room 101 Checkout - John Smith", voucherNo: "RCP-001", debit: 450.00, credit: 0, balance: 185450.00 },
  { date: "2024-01-15", particulars: "Restaurant Sales - Table 5", voucherNo: "RCP-002", debit: 85.50, credit: 0, balance: 185535.50 },
  { date: "2024-01-15", particulars: "Electricity Bill Payment", voucherNo: "PAY-001", debit: 0, credit: 850.00, balance: 184685.50 },
  { date: "2024-01-14", particulars: "Room 205 Checkout - Emma Wilson", voucherNo: "RCP-003", debit: 380.00, credit: 0, balance: 185065.50 },
  { date: "2024-01-14", particulars: "Kitchen Supplies Purchase", voucherNo: "PAY-002", debit: 0, credit: 1200.00, balance: 183865.50 },
  { date: "2024-01-13", particulars: "Spa Services - Guest 302", voucherNo: "RCP-004", debit: 200.00, credit: 0, balance: 184065.50 },
  { date: "2024-01-13", particulars: "Staff Salary - Partial", voucherNo: "PAY-003", debit: 0, credit: 5000.00, balance: 179065.50 },
]

export default function LedgerPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>("all")
  const [selectedAccount, setSelectedAccount] = useState<string>("")

  const filteredAccounts = ledgerAccounts.filter((acc) => {
    const matchesSearch = acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.code.includes(searchQuery)
    const matchesType = accountTypeFilter === "all" || acc.type === accountTypeFilter
    return matchesSearch && matchesType
  })

  const totalDebits = ledgerAccounts.filter(a => a.balanceType === "Dr").reduce((sum, a) => sum + a.balance, 0)
  const totalCredits = ledgerAccounts.filter(a => a.balanceType === "Cr").reduce((sum, a) => sum + a.balance, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">General Ledger</h1>
          <p className="text-muted-foreground">Chart of accounts and ledger entries</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Debits</div>
            <div className="text-2xl font-bold">${totalDebits.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Credits</div>
            <div className="text-2xl font-bold">${totalCredits.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Difference</div>
            <div className={`text-2xl font-bold ${Math.abs(totalDebits - totalCredits) < 0.01 ? "text-primary" : "text-destructive"}`}>
              ${Math.abs(totalDebits - totalCredits).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="chart">
        <TabsList>
          <TabsTrigger value="chart">Chart of Accounts</TabsTrigger>
          <TabsTrigger value="entries">Ledger Entries</TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>All Accounts</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search account..."
                      className="pl-8 w-48"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Asset">Assets</SelectItem>
                      <SelectItem value="Liability">Liabilities</SelectItem>
                      <SelectItem value="Equity">Equity</SelectItem>
                      <SelectItem value="Income">Income</SelectItem>
                      <SelectItem value="Expense">Expenses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((account) => (
                    <TableRow key={account.code} className="cursor-pointer hover:bg-muted" onClick={() => setSelectedAccount(account.code)}>
                      <TableCell className="font-medium">{account.code}</TableCell>
                      <TableCell>{account.name}</TableCell>
                      <TableCell>{account.type}</TableCell>
                      <TableCell className="text-right">
                        {account.balanceType === "Dr" ? `$${account.balance.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {account.balanceType === "Cr" ? `$${account.balance.toFixed(2)}` : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entries" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Ledger Entries - Bank Account (1002)</CardTitle>
                <div className="flex gap-2">
                  <Select defaultValue="1002">
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {ledgerAccounts.map(acc => (
                        <SelectItem key={acc.code} value={acc.code}>{acc.code} - {acc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="date" className="w-36" />
                  <Input type="date" className="w-36" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Particulars</TableHead>
                    <TableHead>Voucher No.</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-muted">
                    <TableCell colSpan={5} className="font-medium">Opening Balance</TableCell>
                    <TableCell className="text-right font-medium">$185,000.00</TableCell>
                  </TableRow>
                  {ledgerEntries.map((entry, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.particulars}</TableCell>
                      <TableCell>{entry.voucherNo}</TableCell>
                      <TableCell className="text-right">
                        {entry.debit > 0 ? `$${entry.debit.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.credit > 0 ? `$${entry.credit.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">${entry.balance.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
