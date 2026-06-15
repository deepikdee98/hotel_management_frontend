"use client"

import { useEffect, useState } from "react"
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
import { useToast } from "@/hooks/use-toast"
import { getChartOfAccounts, getLedgerEntries } from "@/services/api/accounts.service"

// data comes from API

function formatCurrency(value: unknown) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function LedgerPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>("all")
  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [accounts, setAccounts] = useState<any[]>([])
  const [entries, setEntries] = useState<any[]>([])
  const [openingBalance, setOpeningBalance] = useState<number>(0)
  const [closingBalance, setClosingBalance] = useState<number>(0)
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [loadingEntries, setLoadingEntries] = useState(false)

  const loadAccounts = async () => {
    setLoadingAccounts(true)
    try {
      const data = await getChartOfAccounts()
      setAccounts(data)
      if (data.length) {
        setSelectedAccount(data[0].id)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load accounts"
      toast({ title: "Accounts unavailable", description: message, variant: "destructive" })
      setAccounts([])
    } finally {
      setLoadingAccounts(false)
    }
  }

  const loadEntries = async (accountId?: string) => {
    if (!accountId) return
    setLoadingEntries(true)
    try {
      const res = await getLedgerEntries(accountId)
      setEntries(res.entries || [])
      setOpeningBalance(Number(res.openingBalance || 0))
      setClosingBalance(Number(res.closingBalance || 0))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load ledger entries"
      toast({ title: "Ledger entries unavailable", description: message, variant: "destructive" })
      setEntries([])
      setOpeningBalance(0)
      setClosingBalance(0)
    } finally {
      setLoadingEntries(false)
    }
  }

  useEffect(() => { loadAccounts() }, [])
  useEffect(() => { if (selectedAccount) loadEntries(selectedAccount) }, [selectedAccount])

  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch = (String(acc.name || "").toLowerCase().includes(searchQuery.toLowerCase())) ||
      String(acc.code || "").includes(searchQuery)
    const matchesType = accountTypeFilter === "all" || acc.type === accountTypeFilter
    return matchesSearch && matchesType
  })

  const totalDebits = accounts.filter(a => String(a.normalBalance || "").toLowerCase() === "dr").reduce((sum, a) => sum + Number(a.balance || 0), 0)
  const totalCredits = accounts.filter(a => String(a.normalBalance || "").toLowerCase() === "cr").reduce((sum, a) => sum + Number(a.balance || 0), 0)

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
            <div className="text-2xl font-bold">{formatCurrency(totalDebits)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Credits</div>
            <div className="text-2xl font-bold">{formatCurrency(totalCredits)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Difference</div>
            <div className={`text-2xl font-bold ${Math.abs(totalDebits - totalCredits) < 0.01 ? "text-primary" : "text-destructive"}`}>
              {formatCurrency(Math.abs(totalDebits - totalCredits))}
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
                    <TableRow key={account.code} className="cursor-pointer hover:bg-muted" onClick={() => setSelectedAccount(account.id)}>
                      <TableCell className="font-medium">{account.code}</TableCell>
                      <TableCell>{account.name}</TableCell>
                      <TableCell>{account.type}</TableCell>
                      <TableCell className="text-right">
                        {account.normalBalance === "Dr" ? formatCurrency(account.balance) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {account.normalBalance === "Cr" ? formatCurrency(account.balance) : "-"}
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
                <CardTitle>Ledger Entries - {accounts.find(a => a.id === selectedAccount)?.name || "Select Account"}</CardTitle>
                <div className="flex gap-2">
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>
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
                    <TableCell className="text-right font-medium">{formatCurrency(openingBalance)}</TableCell>
                  </TableRow>
                  {entries.map((entry: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.particulars || entry.description || "-"}</TableCell>
                      <TableCell>{entry.voucherNo || "-"}</TableCell>
                      <TableCell className="text-right">
                        {Number(entry.debit || 0) > 0 ? formatCurrency(entry.debit) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(entry.credit || 0) > 0 ? formatCurrency(entry.credit) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(entry.balance)}</TableCell>
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
