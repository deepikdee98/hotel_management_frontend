"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, FileText, Calculator } from "lucide-react"

// Tax reports are loaded from API
import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { getAccountsGstReport, getAccountsTdsReport } from "@/services/api/accounts.service"

type GstLine = {
  description?: string
  taxableValue?: number
  cgst?: number
  sgst?: number
  igst?: number
  totalGST?: number
  total?: number
}

type TdsLine = {
  section?: string
  payee?: string
  nature?: string
  amount?: number
  tdsRate?: number
  tdsAmount?: number
  tds?: number
  status?: string
}

function formatCurrency(value: unknown) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatPeriod(value: unknown, fallback: string) {
  if (!value) return fallback
  if (typeof value === "string") return value
  if (typeof value === "object") {
    const period = value as { month?: string | number; year?: string | number }
    if (period.month && period.year) return `${period.month}-${period.year}`
  }
  return fallback
}

export default function TaxReportsPage() {
  const { toast } = useToast()
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7))
  const [gstSummary, setGstSummary] = useState<any>({ period: "", outputGST: [], inputGST: [] })
  const [tdsReport, setTdsReport] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadReports = async (periodStr: string) => {
    setLoading(true)
    try {
      let month: number | undefined
      let year: number | undefined
      const parts = String(periodStr || "").split("-")
      if (parts.length === 2) {
        year = Number(parts[0])
        month = Number(parts[1])
      }
      const gst = await getAccountsGstReport({ month, year })
      const tds = await getAccountsTdsReport({ month, year })
      setGstSummary(gst || { period: periodStr, outputGST: [], inputGST: [] })
      const tdsItems = Array.isArray(tds?.tds) ? tds.tds : Array.isArray(tds) ? tds : []
      setTdsReport(tdsItems)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load tax reports"
      toast({ title: "Tax reports unavailable", description: message, variant: "destructive" })
      setGstSummary({ period: period, outputGST: [], inputGST: [] })
      setTdsReport([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadReports(period) }, [period])

  const outputGST: GstLine[] = Array.isArray(gstSummary.outputGST) ? gstSummary.outputGST : []
  const inputGST: GstLine[] = Array.isArray(gstSummary.inputGST) ? gstSummary.inputGST : []
  const totalOutputGST = outputGST.reduce((sum, item) => sum + Number(item.totalGST || item.total || 0), 0)
  const totalInputGST = inputGST.reduce((sum, item) => sum + Number(item.totalGST || item.total || 0), 0)
  const netGSTPayable = totalOutputGST - totalInputGST

  const totalTDS = tdsReport.reduce((sum, item: TdsLine) => sum + Number(item.tdsAmount || item.tds || 0), 0)
  const displayPeriod = formatPeriod(gstSummary.period, period)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tax Reports</h1>
          <p className="text-muted-foreground">GST, TDS and other tax reports</p>
        </div>
        <div className="flex gap-2">
          <Input type="month" value={period} onChange={(event) => setPeriod(event.target.value)} className="w-40" />
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
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Output GST</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(totalOutputGST)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Input GST (Credit)</div>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalInputGST)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Net GST Payable</div>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(netGSTPayable)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">TDS Deducted</div>
            <div className="text-2xl font-bold">{formatCurrency(totalTDS)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="gst">
        <TabsList>
          <TabsTrigger value="gst">GST Report</TabsTrigger>
          <TabsTrigger value="tds">TDS Report</TabsTrigger>
        </TabsList>

        <TabsContent value="gst" className="mt-4 space-y-6">
          {/* Output GST */}
          <Card>
            <CardHeader>
              <CardTitle>Output GST (Sales)</CardTitle>
              <CardDescription>GST collected on sales - {displayPeriod}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Taxable Value</TableHead>
                    <TableHead className="text-right">CGST (9%)</TableHead>
                    <TableHead className="text-right">SGST (9%)</TableHead>
                    <TableHead className="text-right">IGST</TableHead>
                    <TableHead className="text-right">Total GST</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outputGST.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.description || "-"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.taxableValue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.cgst)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.sgst)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.igst)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.totalGST || item.total)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted font-bold">
                    <TableCell>TOTAL OUTPUT GST</TableCell>
                    <TableCell className="text-right">{formatCurrency(outputGST.reduce((s, i) => s + Number(i.taxableValue || 0), 0))}</TableCell>
                    <TableCell className="text-right">{formatCurrency(outputGST.reduce((s, i) => s + Number(i.cgst || 0), 0))}</TableCell>
                    <TableCell className="text-right">{formatCurrency(outputGST.reduce((s, i) => s + Number(i.sgst || 0), 0))}</TableCell>
                    <TableCell className="text-right">{formatCurrency(0)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalOutputGST)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Input GST */}
          <Card>
            <CardHeader>
              <CardTitle>Input GST (Purchases)</CardTitle>
              <CardDescription>GST paid on purchases - eligible for credit</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Taxable Value</TableHead>
                    <TableHead className="text-right">CGST</TableHead>
                    <TableHead className="text-right">SGST</TableHead>
                    <TableHead className="text-right">IGST</TableHead>
                    <TableHead className="text-right">Total GST</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inputGST.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.description || "-"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.taxableValue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.cgst)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.sgst)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.igst)}</TableCell>
                      <TableCell className="text-right font-medium text-primary">{formatCurrency(item.totalGST || item.total)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted font-bold">
                    <TableCell>TOTAL INPUT GST (Credit)</TableCell>
                    <TableCell className="text-right">{formatCurrency(inputGST.reduce((s, i) => s + Number(i.taxableValue || 0), 0))}</TableCell>
                    <TableCell className="text-right">{formatCurrency(inputGST.reduce((s, i) => s + Number(i.cgst || 0), 0))}</TableCell>
                    <TableCell className="text-right">{formatCurrency(inputGST.reduce((s, i) => s + Number(i.sgst || 0), 0))}</TableCell>
                    <TableCell className="text-right">{formatCurrency(0)}</TableCell>
                    <TableCell className="text-right text-primary">{formatCurrency(totalInputGST)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* GST Summary */}
          <Card>
            <CardHeader>
              <CardTitle>GST Liability Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-w-md">
                <div className="flex justify-between py-2 border-b">
                  <span>Total Output GST</span>
                  <span className="font-medium">{formatCurrency(totalOutputGST)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Less: Input Tax Credit</span>
                  <span className="font-medium text-primary">-{formatCurrency(totalInputGST)}</span>
                </div>
                <div className="flex justify-between py-2 font-bold text-lg">
                  <span>Net GST Payable</span>
                  <span className="text-destructive">{formatCurrency(netGSTPayable)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tds" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>TDS Deductions</CardTitle>
                  <CardDescription>Tax Deducted at Source - {displayPeriod}</CardDescription>
                </div>
                <Button variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Form 26Q
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Section</TableHead>
                    <TableHead>Payee</TableHead>
                    <TableHead>Nature of Payment</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">TDS Rate</TableHead>
                    <TableHead className="text-right">TDS Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tdsReport.map((item: TdsLine, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.section || "-"}</TableCell>
                      <TableCell>{item.payee || "-"}</TableCell>
                      <TableCell>{item.nature || "-"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                      <TableCell className="text-right">{Number(item.tdsRate || 0)}%</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.tdsAmount || item.tds)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${item.status === "Deposited" ? "bg-primary/20 text-primary" : "bg-warning/20 text-warning"}`}>
                          {item.status || "-"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted font-bold">
                    <TableCell colSpan={5}>TOTAL TDS</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalTDS)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
