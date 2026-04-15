"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Download,
  Printer,
  Calendar,
  BedDouble,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  BarChart3,
  PieChart,
  Filter,
  RefreshCw,
} from "lucide-react"

// Report categories based on hotel front office requirements
const REPORT_CATEGORIES = {
  occupancy: [
    { id: "daily-occupancy", name: "Daily Occupancy Report", description: "Room occupancy status for selected date" },
    { id: "monthly-occupancy", name: "Monthly Occupancy Summary", description: "Month-wise occupancy statistics" },
    { id: "room-availability", name: "Room Availability Report", description: "Available rooms by type and floor" },
    { id: "forecast", name: "Occupancy Forecast", description: "Predicted occupancy for upcoming days" },
  ],
  guest: [
    { id: "guest-list", name: "In-House Guest List", description: "Currently staying guests with details" },
    { id: "arrivals", name: "Expected Arrivals", description: "Guests arriving on selected date" },
    { id: "departures", name: "Expected Departures", description: "Guests departing on selected date" },
    { id: "guest-history", name: "Guest History Report", description: "Past stay records of guests" },
    { id: "vip-guests", name: "VIP Guest Report", description: "List of VIP guests with preferences" },
    { id: "nationality-wise", name: "Nationality Wise Report", description: "Guest distribution by nationality" },
  ],
  revenue: [
    { id: "daily-revenue", name: "Daily Revenue Report", description: "Day-wise revenue breakdown" },
    { id: "room-revenue", name: "Room Revenue Report", description: "Revenue by room type" },
    { id: "collection", name: "Collection Report", description: "Payment collections summary" },
    { id: "outstanding", name: "Outstanding Report", description: "Pending payments and dues" },
    { id: "advance", name: "Advance Collection Report", description: "Advance payments received" },
    { id: "refund", name: "Refund Report", description: "Refunds processed" },
  ],
  operational: [
    { id: "checkin", name: "Check-In Report", description: "Guest check-ins for selected period" },
    { id: "checkout", name: "Check-Out Report", description: "Guest check-outs for selected period" },
    { id: "no-show", name: "No Show Report", description: "Reservations marked as no-show" },
    { id: "cancellation", name: "Cancellation Report", description: "Cancelled reservations" },
    { id: "room-shift", name: "Room Shift Report", description: "Room changes/transfers" },
    { id: "early-checkout", name: "Early Check-Out Report", description: "Guests who checked out early" },
    { id: "extended-stay", name: "Extended Stay Report", description: "Checkout date extensions" },
  ],
  audit: [
    { id: "night-audit", name: "Night Audit Report", description: "Daily audit summary" },
    { id: "cashier", name: "Cashier Report", description: "Cashier-wise transactions" },
    { id: "shift-report", name: "Shift Handover Report", description: "Shift-wise activity summary" },
    { id: "void-transactions", name: "Void Transactions", description: "Voided/cancelled transactions" },
    { id: "user-activity", name: "User Activity Log", description: "Staff activity audit trail" },
  ],
}

// Mock data for preview
const MOCK_OCCUPANCY_DATA = [
  { floor: "Ground Floor", total: 10, occupied: 8, available: 2, maintenance: 0, occupancy: "80%" },
  { floor: "First Floor", total: 15, occupied: 12, available: 2, maintenance: 1, occupancy: "80%" },
  { floor: "Second Floor", total: 15, occupied: 10, available: 4, maintenance: 1, occupancy: "67%" },
  { floor: "Third Floor", total: 10, occupied: 8, available: 2, maintenance: 0, occupancy: "80%" },
  { floor: "Top Floor", total: 5, occupied: 3, available: 2, maintenance: 0, occupancy: "60%" },
]

const MOCK_GUEST_LIST = [
  { room: "101", guest: "James Wilson", checkIn: "2024-12-18", checkOut: "2024-12-22", pax: 2, status: "In-House" },
  { room: "103", guest: "Emma Davis", checkIn: "2024-12-19", checkOut: "2024-12-21", pax: 1, status: "In-House" },
  { room: "202", guest: "Robert Brown", checkIn: "2024-12-21", checkOut: "2024-12-25", pax: 3, status: "In-House" },
  { room: "301", guest: "Sarah Miller", checkIn: "2024-12-20", checkOut: "2024-12-23", pax: 2, status: "In-House" },
  { room: "401", guest: "Michael Johnson", checkIn: "2024-12-17", checkOut: "2024-12-20", pax: 4, status: "Due Out" },
]

const MOCK_REVENUE_DATA = [
  { category: "Room Charges", today: 45600, mtd: 892000, ytd: 10450000 },
  { category: "Food & Beverage", today: 12400, mtd: 245000, ytd: 2890000 },
  { category: "Laundry", today: 2100, mtd: 45000, ytd: 520000 },
  { category: "Other Services", today: 3500, mtd: 78000, ytd: 890000 },
  { category: "Taxes", today: 8200, mtd: 168000, ytd: 1960000 },
]

export default function FOReportsPage() {
  const [activeCategory, setActiveCategory] = useState("occupancy")
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split("T")[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0])
  const [roomType, setRoomType] = useState("all")
  const [floor, setFloor] = useState("all")

  const handleGenerateReport = () => {
    // In real app, this would fetch report data
    console.log("Generating report:", selectedReport, { dateFrom, dateTo, roomType, floor })
  }

  const renderReportPreview = () => {
    if (!selectedReport) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <FileText className="h-12 w-12 mb-4" />
          <p>Select a report to preview</p>
        </div>
      )
    }

    // Render different previews based on selected report
    if (selectedReport.includes("occupancy") || selectedReport === "room-availability") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-4">
            <Card className="bg-primary/10 border-primary/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">55</p>
                <p className="text-xs text-muted-foreground">Total Rooms</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">41</p>
                <p className="text-xs text-muted-foreground">Occupied</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">12</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/10 border-yellow-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">2</p>
                <p className="text-xs text-muted-foreground">Maintenance</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-500/10 border-purple-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">74.5%</p>
                <p className="text-xs text-muted-foreground">Occupancy</p>
              </CardContent>
            </Card>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Floor</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Occupied</TableHead>
                <TableHead className="text-center">Available</TableHead>
                <TableHead className="text-center">Maintenance</TableHead>
                <TableHead className="text-center">Occupancy %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_OCCUPANCY_DATA.map((row) => (
                <TableRow key={row.floor}>
                  <TableCell className="font-medium">{row.floor}</TableCell>
                  <TableCell className="text-center">{row.total}</TableCell>
                  <TableCell className="text-center">{row.occupied}</TableCell>
                  <TableCell className="text-center">{row.available}</TableCell>
                  <TableCell className="text-center">{row.maintenance}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{row.occupancy}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )
    }

    if (selectedReport.includes("guest") || selectedReport === "arrivals" || selectedReport === "departures") {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room</TableHead>
              <TableHead>Guest Name</TableHead>
              <TableHead>Check-In</TableHead>
              <TableHead>Check-Out</TableHead>
              <TableHead className="text-center">PAX</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_GUEST_LIST.map((guest) => (
              <TableRow key={guest.room}>
                <TableCell className="font-medium">{guest.room}</TableCell>
                <TableCell>{guest.guest}</TableCell>
                <TableCell>{guest.checkIn}</TableCell>
                <TableCell>{guest.checkOut}</TableCell>
                <TableCell className="text-center">{guest.pax}</TableCell>
                <TableCell>
                  <Badge variant={guest.status === "Due Out" ? "destructive" : "default"}>
                    {guest.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )
    }

    if (selectedReport.includes("revenue") || selectedReport === "collection" || selectedReport === "outstanding") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Today's Revenue</p>
                <p className="text-2xl font-bold text-green-600">Rs. 71,800</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">MTD Revenue</p>
                <p className="text-2xl font-bold text-blue-600">Rs. 14,28,000</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-500/10 border-purple-500/20">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">YTD Revenue</p>
                <p className="text-2xl font-bold text-purple-600">Rs. 1,67,10,000</p>
              </CardContent>
            </Card>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Today</TableHead>
                <TableHead className="text-right">MTD</TableHead>
                <TableHead className="text-right">YTD</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_REVENUE_DATA.map((row) => (
                <TableRow key={row.category}>
                  <TableCell className="font-medium">{row.category}</TableCell>
                  <TableCell className="text-right">Rs. {row.today.toLocaleString()}</TableCell>
                  <TableCell className="text-right">Rs. {row.mtd.toLocaleString()}</TableCell>
                  <TableCell className="text-right">Rs. {row.ytd.toLocaleString()}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold bg-muted/50">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">Rs. 71,800</TableCell>
                <TableCell className="text-right">Rs. 14,28,000</TableCell>
                <TableCell className="text-right">Rs. 1,67,10,000</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )
    }

    // Default operational/audit report preview
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">12</p>
              <p className="text-xs text-muted-foreground">Total Records</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">8</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">3</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">1</p>
              <p className="text-xs text-muted-foreground">Issues</p>
            </CardContent>
          </Card>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>Report data will be displayed here</p>
          <p className="text-sm">Click Generate to load full report</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Front Office Reports</h1>
          <p className="text-muted-foreground">Generate and export operational reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Report Selection Panel */}
        <div className="col-span-3">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Report Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={activeCategory} onValueChange={setActiveCategory} orientation="vertical" className="w-full">
                <TabsList className="flex flex-col h-auto w-full bg-transparent p-2 gap-1">
                  <TabsTrigger value="occupancy" className="w-full justify-start gap-2 px-3">
                    <BedDouble className="h-4 w-4" />
                    Occupancy
                  </TabsTrigger>
                  <TabsTrigger value="guest" className="w-full justify-start gap-2 px-3">
                    <Users className="h-4 w-4" />
                    Guest
                  </TabsTrigger>
                  <TabsTrigger value="revenue" className="w-full justify-start gap-2 px-3">
                    <DollarSign className="h-4 w-4" />
                    Revenue
                  </TabsTrigger>
                  <TabsTrigger value="operational" className="w-full justify-start gap-2 px-3">
                    <Clock className="h-4 w-4" />
                    Operational
                  </TabsTrigger>
                  <TabsTrigger value="audit" className="w-full justify-start gap-2 px-3">
                    <FileText className="h-4 w-4" />
                    Audit
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="p-2 border-t max-h-64 overflow-y-auto">
                {REPORT_CATEGORIES[activeCategory as keyof typeof REPORT_CATEGORIES].map((report) => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                      selectedReport === report.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <p className="font-medium">{report.name}</p>
                    <p className={`text-xs ${selectedReport === report.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {report.description}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Content */}
        <div className="col-span-9 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-end gap-4 flex-wrap">
                <div className="space-y-1">
                  <Label className="text-xs">From Date</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-36"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">To Date</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-36"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Room Type</Label>
                  <Select value={roomType} onValueChange={setRoomType}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="deluxe">Deluxe</SelectItem>
                      <SelectItem value="super-luxury">Super Luxury</SelectItem>
                      <SelectItem value="premium-suite">Premium Suite</SelectItem>
                      <SelectItem value="guest-house">Guest House</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Floor</Label>
                  <Select value={floor} onValueChange={setFloor}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Floors</SelectItem>
                      <SelectItem value="ground">Ground Floor</SelectItem>
                      <SelectItem value="first">First Floor</SelectItem>
                      <SelectItem value="second">Second Floor</SelectItem>
                      <SelectItem value="third">Third Floor</SelectItem>
                      <SelectItem value="top">Top Floor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleGenerateReport} disabled={!selectedReport}>
                  <Filter className="h-4 w-4 mr-2" />
                  Generate
                </Button>
                <Button variant="outline" disabled={!selectedReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" disabled={!selectedReport}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Report Preview */}
          <Card className="min-h-[400px]">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {selectedReport
                      ? REPORT_CATEGORIES[activeCategory as keyof typeof REPORT_CATEGORIES].find(
                          (r) => r.id === selectedReport
                        )?.name
                      : "Report Preview"}
                  </CardTitle>
                  {selectedReport && (
                    <CardDescription>
                      {dateFrom} to {dateTo}
                    </CardDescription>
                  )}
                </div>
                {selectedReport && (
                  <Badge variant="outline">
                    <Calendar className="h-3 w-3 mr-1" />
                    Generated: {new Date().toLocaleString()}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {renderReportPreview()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
