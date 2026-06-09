"use client"

import { useEffect, useState } from "react"
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
import { getAccountsSettings, updateAccountsSettings, type AccountSettings } from "@/services/api/accounts.service"
import { useToast } from "@/hooks/use-toast"

type SettingsRow = {
  id?: string | number
  name?: string
  rate?: number
  type?: string
  cgst?: number
  sgst?: number
  code?: string
  ledgerAccount?: string
  active?: boolean
}

function rows(value: unknown): SettingsRow[] {
  return Array.isArray(value) ? value as SettingsRow[] : []
}

export default function AccountsSettingsPage() {
  const { toast } = useToast()
  const [isAddTaxOpen, setIsAddTaxOpen] = useState(false)
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false)
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [settings, setSettings] = useState<AccountSettings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)

    getAccountsSettings()
      .then((data) => {
        if (active) setSettings(data || {})
      })
      .catch((err) => {
        if (!active) return
        const message = err instanceof Error ? err.message : "Failed to load accounts settings"
        toast({ title: "Settings unavailable", description: message, variant: "destructive" })
        setSettings({})
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [toast])

  const updateSetting = <K extends keyof AccountSettings>(key: K, value: AccountSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }))
  }

  const updateAutomation = (key: keyof NonNullable<AccountSettings["automation"]>, value: boolean) => {
    setSettings((current) => ({
      ...current,
      automation: { ...current.automation, [key]: value },
    }))
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const updated = await updateAccountsSettings(settings)
      setSettings(updated || settings)
      toast({ title: "Settings saved" })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save accounts settings"
      toast({ title: "Save failed", description: message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const taxRates = rows(settings.taxRates)
  const paymentMethods = rows(settings.paymentMethods)
  const expenseCategories = rows(settings.expenseCategories)

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
                  <Select value={settings.financialYearStart || ""} onValueChange={(value) => updateSetting("financialYearStart", value)}>
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
                  <Select value={settings.currency || ""} onValueChange={(value) => updateSetting("currency", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inr">INR (₹)</SelectItem>
                      <SelectItem value="eur">EUR (Euro)</SelectItem>
                      <SelectItem value="gbp">GBP (Pound)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Invoice Prefix</Label>
                  <Input value={settings.invoicePrefix || ""} onChange={(event) => updateSetting("invoicePrefix", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Receipt Prefix</Label>
                  <Input value={settings.receiptPrefix || ""} onChange={(event) => updateSetting("receiptPrefix", event.target.value)} />
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
                    <Switch checked={Boolean(settings.automation?.autoGenerateInvoiceOnCheckout)} onCheckedChange={(checked) => updateAutomation("autoGenerateInvoiceOnCheckout", checked)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Send Invoice via Email</Label>
                      <p className="text-sm text-muted-foreground">Email invoice to guest after checkout</p>
                    </div>
                    <Switch checked={Boolean(settings.automation?.sendInvoiceViaEmail)} onCheckedChange={(checked) => updateAutomation("sendInvoiceViaEmail", checked)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Round Off Amounts</Label>
                      <p className="text-sm text-muted-foreground">Round invoice totals to nearest whole number</p>
                    </div>
                    <Switch checked={Boolean(settings.automation?.roundOffAmounts)} onCheckedChange={(checked) => updateAutomation("roundOffAmounts", checked)} />
                  </div>
                </div>
              </div>

              <Button onClick={saveSettings} disabled={saving || loading}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Settings"}
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
                  <Input value={settings.gstNumber || ""} onChange={(event) => updateSetting("gstNumber", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>PAN Number</Label>
                  <Input value={settings.panNumber || ""} onChange={(event) => updateSetting("panNumber", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>TAN Number</Label>
                  <Input value={settings.tanNumber || ""} onChange={(event) => updateSetting("tanNumber", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>State Code</Label>
                  <Input value={settings.stateCode || ""} onChange={(event) => updateSetting("stateCode", event.target.value)} />
                </div>
              </div>
              <Button onClick={saveSettings} disabled={saving || loading}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Tax Details"}
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
                  {taxRates.map((tax, index) => (
                    <TableRow key={tax.id || tax.name || index}>
                      <TableCell className="font-medium">{tax.name || "-"}</TableCell>
                      <TableCell>{tax.type || "-"}</TableCell>
                      <TableCell>{Number(tax.cgst || 0)}%</TableCell>
                      <TableCell>{Number(tax.sgst || 0)}%</TableCell>
                      <TableCell>{Number(tax.rate || 0)}%</TableCell>
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
                  {!loading && taxRates.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No tax rates configured.</TableCell>
                    </TableRow>
                  )}
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
                          <SelectContent />
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
                  {paymentMethods.map((method, index) => (
                    <TableRow key={method.id || method.code || method.name || index}>
                      <TableCell className="font-medium">{method.name || "-"}</TableCell>
                      <TableCell>{method.code || "-"}</TableCell>
                      <TableCell>{method.ledgerAccount || "-"}</TableCell>
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
                  {!loading && paymentMethods.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No payment methods configured.</TableCell>
                    </TableRow>
                  )}
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
                          <SelectContent />
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
                  {expenseCategories.map((category, index) => (
                    <TableRow key={category.id || category.code || category.name || index}>
                      <TableCell className="font-medium">{category.name || "-"}</TableCell>
                      <TableCell>{category.code || "-"}</TableCell>
                      <TableCell>{category.ledgerAccount || "-"}</TableCell>
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
                  {!loading && expenseCategories.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No expense categories configured.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
