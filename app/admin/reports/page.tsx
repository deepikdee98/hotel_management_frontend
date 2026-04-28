"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BarChart,
  TrendingUp,
  DollarSign,
  Users,
  BedDouble,
  Download,
  Calendar,
  FileText,
  PieChart,
  Activity,
  Loader2,
} from "lucide-react"
import { getReportDashboard, getReportRevenue, getReportOccupancy, getReportGuests } from "@/lib/backend-api"
import { useToast } from "@/hooks/use-toast"

export default function ReportsPage() {
  const { toast } = useToast()
  const [dateRange, setDateRange] = useState("today")
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<any>(null)
  const [revenueData, setRevenueData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [dashboardRes, revenueRes] = await Promise.all([
          getReportDashboard(),
          getReportRevenue(),
        ])

        if (dashboardRes.success) setReportData(dashboardRes.data)
        if (revenueRes.success) setRevenueData(revenueRes.data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch report data",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <DashboardLayout requiredModule="reports">
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg font-medium">Loading reports...</span>
        </div>
      </DashboardLayout>
    )
  }

  const revenueBySource = [
    { source: "Room Revenue", amount: revenueData?.roomRevenue || 0, percentage: revenueData?.totalRevenue ? Math.round((revenueData.roomRevenue / revenueData.totalRevenue) * 100) : 0 },
    { source: "Other Services", amount: revenueData?.otherRevenue || 0, percentage: revenueData?.totalRevenue ? Math.round((revenueData.otherRevenue / revenueData.totalRevenue) * 100) : 0 },
  ]

  return (
    <DashboardLayout requiredModule="reports">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground">Analytics and insights for your hotel</p>
          </div>
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => window.print()}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* KPI Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">₹{reportData?.revenue?.todayTotal?.toLocaleString() || 0}</div>
              <div className="flex items-center text-xs text-primary">
                <TrendingUp className="mr-1 h-3 w-3" />
                Live data
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Occupancy</CardTitle>
              <BedDouble className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{reportData?.occupancy?.occupancyRate || 0}%</div>
              <div className="flex items-center text-xs text-primary">
                <TrendingUp className="mr-1 h-3 w-3" />
                {reportData?.occupancy?.occupied} / {reportData?.occupancy?.totalRooms} Rooms
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Arrivals</CardTitle>
              <Users className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{reportData?.arrivals?.expected || 0}</div>
              <div className="flex items-center text-xs text-primary">
                <Activity className="mr-1 h-3 w-3" />
                {reportData?.arrivals?.checkedIn} Checked In
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Collections</CardTitle>
              <Activity className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">₹{reportData?.collections?.todayTotal?.toLocaleString() || 0}</div>
              <div className="flex items-center text-xs text-primary">
                <TrendingUp className="mr-1 h-3 w-3" />
                Today's Payments
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Occupancy Status Chart */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <BarChart className="h-5 w-5 text-primary" />
                Occupancy Breakdown
              </CardTitle>
              <CardDescription>Current room status distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: "Occupied", value: reportData?.occupancy?.occupied || 0, color: "bg-primary" },
                  { label: "Available", value: reportData?.occupancy?.available || 0, color: "bg-success" },
                  { label: "Maintenance", value: reportData?.occupancy?.outOfOrder || 0, color: "bg-destructive" },
                  { label: "Blocked", value: reportData?.occupancy?.blocked || 0, color: "bg-warning" },
                ].map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground font-medium">{item.label}</span>
                      <span className="text-muted-foreground">{item.value} Rooms</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all`}
                        style={{ width: `${(item.value / (reportData?.occupancy?.totalRooms || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Revenue by Source */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                Revenue by Source
              </CardTitle>
              <CardDescription>Breakdown of revenue streams</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueBySource.map((item, index) => {
                  const colors = ["bg-primary", "bg-chart-2", "bg-chart-3", "bg-chart-4"]
                  return (
                    <div key={item.source} className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-foreground">{item.source}</span>
                          <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${colors[index % colors.length]}`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-foreground w-24 text-right">
                        ₹{item.amount.toLocaleString()}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Report Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="h-auto py-4 flex-col gap-2 bg-transparent" onClick={() => window.open(`${process.env.NEXT_PUBLIC_BACKEND_URL}/reports/revenue`, '_blank')}>
            <DollarSign className="h-6 w-6 text-primary" />
            <span>Financial Report</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2 bg-transparent" onClick={() => window.open(`${process.env.NEXT_PUBLIC_BACKEND_URL}/reports/occupancy`, '_blank')}>
            <BedDouble className="h-6 w-6 text-chart-2" />
            <span>Occupancy Report</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2 bg-transparent" onClick={() => window.open(`${process.env.NEXT_PUBLIC_BACKEND_URL}/reports/guests`, '_blank')}>
            <Users className="h-6 w-6 text-chart-3" />
            <span>Guest Report</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2 bg-transparent" onClick={() => window.print()}>
            <FileText className="h-6 w-6 text-chart-4" />
            <span>Management Report</span>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
