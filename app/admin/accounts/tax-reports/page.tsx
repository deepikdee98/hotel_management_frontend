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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, FileText, Calculator } from "lucide-react"

const gstSummary = {
  period: "January 2024",
  outputGST: [
    { description: "Room Revenue", taxableValue: 185200.00, cgst: 8334.00, sgst: 8334.00, igst: 0, totalGST: 16668.00 },
    { description: "F&B Revenue", taxableValue: 42800.00, cgst: 2140.00, sgst: 2140.00, igst: 0, totalGST: 4280.00 },
    { description: "Other Services", taxableValue: 20500.00, cgst: 922.50, sgst: 922.50, igst: 0, totalGST: 1845.00 },
  ],
  inputGST: [
    { description: "Supplies & Materials", taxableValue: 15000.00, cgst: 1350.00, sgst: 1350.00, igst: 0, totalGST: 2700.00 },
    { description: "Utilities", taxableValue: 8500.00, cgst: 765.00, sgst: 765.00, igst: 0, totalGST: 1530.00 },
    { description: "Maintenance Services", taxableValue: 6500.00, cgst: 585.00, sgst: 585.00, igst: 0, totalGST: 1170.00 },
  ]
}

const tdsReport = [
  { section: "194C", payee: "ABC Maintenance", nature: "Contractor Payment", amount: 50000.00, tdsRate: 1, tdsAmount: 500.00, status: "Deposited" },
  { section: "194J", payee: "Tech Solutions", nature: "Professional Fees", amount: 25000.00, tdsRate: 10, tdsAmount: 2500.00, status: "Deposited" },
  { section: "194I", payee: "Property Owner", nature: "Rent", amount: 100000.00, tdsRate: 10, tdsAmount: 10000.00, status: "Pending" },
  { section: "194C", payee: "Clean Pro Services", nature: "Contractor Payment", amount: 30000.00, tdsRate: 1, tdsAmount: 300.00, status: "Deposited" },
]

export default function TaxReportsPage() {
  const [period, setPeriod] = useState("01-2024")

  const totalOutputGST = gstSummary.outputGST.reduce((sum, item) => sum + item.totalGST, 0)
  const totalInputGST = gstSummary.inputGST.reduce((sum, item) => sum + item.totalGST, 0)
  const netGSTPayable = totalOutputGST - totalInputGST

  const totalTDS = tdsReport.reduce((sum, item) => sum + item.tdsAmount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tax Reports</h1>
          <p className="text-muted-foreground">GST, TDS and other tax reports</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="01-2024">January 2024</SelectItem>
              <SelectItem value="12-2023">December 2023</SelectItem>
              <SelectItem value="11-2023">November 2023</SelectItem>
              <SelectItem value="Q3-2023">Q3 2023</SelectItem>
              <SelectItem value="FY-2023">FY 2023-24</SelectItem>
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
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Output GST</span>
            </div>
            <div className="text-2xl font-bold">${totalOutputGST.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Input GST (Credit)</div>
            <div className="text-2xl font-bold text-primary">${totalInputGST.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Net GST Payable</div>
            <div className="text-2xl font-bold text-destructive">${netGSTPayable.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">TDS Deducted</div>
            <div className="text-2xl font-bold">${totalTDS.toFixed(2)}</div>
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
              <CardDescription>GST collected on sales - {gstSummary.period}</CardDescription>
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
                  {gstSummary.outputGST.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">${item.taxableValue.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${item.cgst.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${item.sgst.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${item.igst.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">${item.totalGST.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted font-bold">
                    <TableCell>TOTAL OUTPUT GST</TableCell>
                    <TableCell className="text-right">${gstSummary.outputGST.reduce((s, i) => s + i.taxableValue, 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">${gstSummary.outputGST.reduce((s, i) => s + i.cgst, 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">${gstSummary.outputGST.reduce((s, i) => s + i.sgst, 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">$0.00</TableCell>
                    <TableCell className="text-right">${totalOutputGST.toFixed(2)}</TableCell>
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
                  {gstSummary.inputGST.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">${item.taxableValue.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${item.cgst.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${item.sgst.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${item.igst.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium text-primary">${item.totalGST.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted font-bold">
                    <TableCell>TOTAL INPUT GST (Credit)</TableCell>
                    <TableCell className="text-right">${gstSummary.inputGST.reduce((s, i) => s + i.taxableValue, 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">${gstSummary.inputGST.reduce((s, i) => s + i.cgst, 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">${gstSummary.inputGST.reduce((s, i) => s + i.sgst, 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">$0.00</TableCell>
                    <TableCell className="text-right text-primary">${totalInputGST.toFixed(2)}</TableCell>
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
                  <span className="font-medium">${totalOutputGST.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Less: Input Tax Credit</span>
                  <span className="font-medium text-primary">-${totalInputGST.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 font-bold text-lg">
                  <span>Net GST Payable</span>
                  <span className="text-destructive">${netGSTPayable.toFixed(2)}</span>
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
                  <CardDescription>Tax Deducted at Source - {gstSummary.period}</CardDescription>
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
                  {tdsReport.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.section}</TableCell>
                      <TableCell>{item.payee}</TableCell>
                      <TableCell>{item.nature}</TableCell>
                      <TableCell className="text-right">${item.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{item.tdsRate}%</TableCell>
                      <TableCell className="text-right font-medium">${item.tdsAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${item.status === "Deposited" ? "bg-primary/20 text-primary" : "bg-warning/20 text-warning"}`}>
                          {item.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted font-bold">
                    <TableCell colSpan={5}>TOTAL TDS</TableCell>
                    <TableCell className="text-right">${totalTDS.toFixed(2)}</TableCell>
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
