"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Pencil, Trash2, Save } from "lucide-react"

const taxRates = [
  { id: 1, name: "GST 18%", rate: 18, type: "GST", cgst: 9, sgst: 9, active: true },
  { id: 2, name: "GST 12%", rate: 12, type: "GST", cgst: 6, sgst: 6, active: true },
  { id: 3, name: "GST 5%", rate: 5, type: "GST", cgst: 2.5, sgst: 2.5, active: true },
  { id: 4, name: "Service Tax", rate: 10, type: "Service", cgst: 0, sgst: 0, active: false },
]

const paymentMethods = [
  { id: 1, name: "Cash", code: "CASH", ledgerAccount: "1001 - Cash in Hand", active: true },
  { id: 2, name: "Credit Card", code: "CC", ledgerAccount: "1002 - Bank Account", active: true },
  { id: 3, name: "Debit Card", code: "DC", ledgerAccount: "1002 - Bank Account", active: true },
  { id: 4, name: "UPI", code: "UPI", ledgerAccount: "1002 - Bank Account", active: true },
  { id: 5, name: "Bank Transfer", code: "BT", ledgerAccount: "1002 - Bank Account", active: true },
  { id: 6, name: "Cheque", code: "CHQ", ledgerAccount: "1002 - Bank Account", active: true },
]

const expenseCategories = [
  { id: 1, name: "Utilities", code: "UTL", ledgerAccount: "5002 - Utilities", active: true },
  { id: 2, name: "Supplies", code: "SUP", ledgerAccount: "5003 - Supplies", active: true },
  { id: 3, name: "Maintenance", code: "MNT", ledgerAccount: "5004 - Maintenance", active: true },
  { id: 4, name: "Payroll", code: "PAY", ledgerAccount: "5001 - Salaries", active: true },
  { id: 5, name: "Marketing", code: "MKT", ledgerAccount: "5005 - Marketing", active: true },
  { id: 6, name: "Insurance", code: "INS", ledgerAccount: "5006 - Insurance", active: true },
]

export default function AccountsSettingsPage() {
  const [isAddTaxOpen, setIsAddTaxOpen] = useState(false)
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false)
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Accounts Settings</h1>
        <p className="text-muted-foreground">Configure accounting preferences, tax rates, and payment methods</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="tax">Tax Rates</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          <TabsTrigger value="categories">Expense Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure basic accounting preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Financial Year Start</Label>
                  <Select defaultValue="april">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="january">January</SelectItem>
                      <SelectItem value="april">April</SelectItem>
                      <SelectItem value="july">July</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select defaultValue="usd">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="inr">INR (Rs)</SelectItem>
                      <SelectItem value="eur">EUR (Euro)</SelectItem>
                      <SelectItem value="gbp">GBP (Pound)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Invoice Prefix</Label>
                  <Input defaultValue="INV-" />
                </div>
                <div className="space-y-2">
                  <Label>Receipt Prefix</Label>
                  <Input defaultValue="RCP-" />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium">Automation Settings</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-generate Invoice on Checkout</Label>
                      <p className="text-sm text-muted-foreground">Automatically create invoice when guest checks out</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Send Invoice via Email</Label>
                      <p className="text-sm text-muted-foreground">Email invoice to guest after checkout</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Round Off Amounts</Label>
                      <p className="text-sm text-muted-foreground">Round invoice totals to nearest whole number</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tax Registration</CardTitle>
              <CardDescription>Your business tax registration details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>GST Number</Label>
                  <Input defaultValue="22AAAAA0000A1Z5" />
                </div>
                <div className="space-y-2">
                  <Label>PAN Number</Label>
                  <Input defaultValue="AAAAA0000A" />
                </div>
                <div className="space-y-2">
                  <Label>TAN Number</Label>
                  <Input defaultValue="AAAA00000A" />
                </div>
                <div className="space-y-2">
                  <Label>State Code</Label>
                  <Input defaultValue="22" />
                </div>
              </div>
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Tax Details
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tax Rates</CardTitle>
                  <CardDescription>Configure tax rates for invoicing</CardDescription>
                </div>
                <Dialog open={isAddTaxOpen} onOpenChange={setIsAddTaxOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Tax Rate
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Tax Rate</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Tax Name</Label>
                        <Input placeholder="e.g., GST 18%" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gst">GST</SelectItem>
                              <SelectItem value="service">Service Tax</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Total Rate (%)</Label>
                          <Input type="number" placeholder="18" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>CGST (%)</Label>
                          <Input type="number" placeholder="9" />
                        </div>
                        <div className="space-y-2">
                          <Label>SGST (%)</Label>
                          <Input type="number" placeholder="9" />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddTaxOpen(false)}>Cancel</Button>
                      <Button onClick={() => setIsAddTaxOpen(false)}>Save</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tax Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>CGST</TableHead>
                    <TableHead>SGST</TableHead>
                    <TableHead>Total Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxRates.map((tax) => (
                    <TableRow key={tax.id}>
                      <TableCell className="font-medium">{tax.name}</TableCell>
                      <TableCell>{tax.type}</TableCell>
                      <TableCell>{tax.cgst}%</TableCell>
                      <TableCell>{tax.sgst}%</TableCell>
                      <TableCell>{tax.rate}%</TableCell>
                      <TableCell>
                        <Badge variant={tax.active ? "default" : "secondary"}>
                          {tax.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Configure accepted payment methods</CardDescription>
                </div>
                <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Payment Method
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Payment Method</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Method Name</Label>
                        <Input placeholder="e.g., PayPal" />
                      </div>
                      <div className="space-y-2">
                        <Label>Code</Label>
                        <Input placeholder="e.g., PP" />
                      </div>
                      <div className="space-y-2">
                        <Label>Linked Ledger Account</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1001">1001 - Cash in Hand</SelectItem>
                            <SelectItem value="1002">1002 - Bank Account</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddPaymentOpen(false)}>Cancel</Button>
                      <Button onClick={() => setIsAddPaymentOpen(false)}>Save</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Linked Ledger Account</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentMethods.map((method) => (
                    <TableRow key={method.id}>
                      <TableCell className="font-medium">{method.name}</TableCell>
                      <TableCell>{method.code}</TableCell>
                      <TableCell>{method.ledgerAccount}</TableCell>
                      <TableCell>
                        <Badge variant={method.active ? "default" : "secondary"}>
                          {method.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Expense Categories</CardTitle>
                  <CardDescription>Configure expense categories for tracking</CardDescription>
                </div>
                <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Expense Category</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Category Name</Label>
                        <Input placeholder="e.g., Travel" />
                      </div>
                      <div className="space-y-2">
                        <Label>Code</Label>
                        <Input placeholder="e.g., TRV" />
                      </div>
                      <div className="space-y-2">
                        <Label>Linked Ledger Account</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5001">5001 - Salaries</SelectItem>
                            <SelectItem value="5002">5002 - Utilities</SelectItem>
                            <SelectItem value="5003">5003 - Supplies</SelectItem>
                            <SelectItem value="5004">5004 - Maintenance</SelectItem>
                            <SelectItem value="5005">5005 - Marketing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>Cancel</Button>
                      <Button onClick={() => setIsAddCategoryOpen(false)}>Save</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Linked Ledger Account</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.code}</TableCell>
                      <TableCell>{category.ledgerAccount}</TableCell>
                      <TableCell>
                        <Badge variant={category.active ? "default" : "secondary"}>
                          {category.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
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
