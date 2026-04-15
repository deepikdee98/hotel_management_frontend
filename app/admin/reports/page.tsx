"use client"

import { useState } from "react"
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
} from "lucide-react"

// Mock report data
const monthlyRevenue = [
  { month: "Jan", revenue: 45000, occupancy: 72 },
  { month: "Feb", revenue: 52000, occupancy: 78 },
  { month: "Mar", revenue: 48000, occupancy: 74 },
  { month: "Apr", revenue: 61000, occupancy: 85 },
  { month: "May", revenue: 58000, occupancy: 82 },
  { month: "Jun", revenue: 67000, occupancy: 89 },
]

const revenueBySource = [
  { source: "Room Revenue", amount: 156000, percentage: 65 },
  { source: "F&B", amount: 48000, percentage: 20 },
  { source: "Spa & Wellness", amount: 24000, percentage: 10 },
  { source: "Other Services", amount: 12000, percentage: 5 },
]

const savedReports = [
  { id: 1, name: "Monthly Revenue Report", type: "Financial", date: "Jan 15, 2024", status: "ready" },
  { id: 2, name: "Occupancy Analysis Q4", type: "Operations", date: "Jan 10, 2024", status: "ready" },
  { id: 3, name: "Guest Satisfaction Survey", type: "Customer", date: "Jan 08, 2024", status: "processing" },
  { id: 4, name: "Staff Performance Review", type: "HR", date: "Jan 05, 2024", status: "ready" },
]

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("this-month")

  return (
    <DashboardLayout requiredRole="admin">
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
                <SelectItem value="this-quarter">This Quarter</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Export All
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
              <div className="text-2xl font-bold text-foreground">$240,000</div>
              <div className="flex items-center text-xs text-primary">
                <TrendingUp className="mr-1 h-3 w-3" />
                +15% vs last period
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Occupancy</CardTitle>
              <BedDouble className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">78%</div>
              <div className="flex items-center text-xs text-primary">
                <TrendingUp className="mr-1 h-3 w-3" />
                +5% vs last period
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Guests</CardTitle>
              <Users className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">1,284</div>
              <div className="flex items-center text-xs text-primary">
                <TrendingUp className="mr-1 h-3 w-3" />
                +12% vs last period
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">RevPAR</CardTitle>
              <Activity className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">$142</div>
              <div className="flex items-center text-xs text-primary">
                <TrendingUp className="mr-1 h-3 w-3" />
                +8% vs last period
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue Chart */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <BarChart className="h-5 w-5 text-primary" />
                Monthly Revenue
              </CardTitle>
              <CardDescription>Revenue trends over the past 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyRevenue.map((month) => (
                  <div key={month.month} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground font-medium">{month.month}</span>
                      <span className="text-muted-foreground">${(month.revenue / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${(month.revenue / 70000) * 100}%` }}
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
                      <div className={`w-3 h-3 rounded-full ${colors[index]}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-foreground">{item.source}</span>
                          <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${colors[index]}`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-foreground w-20 text-right">
                        ${(item.amount / 1000).toFixed(0)}K
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Saved Reports */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Saved Reports
                </CardTitle>
                <CardDescription>Previously generated reports</CardDescription>
              </div>
              <Button variant="outline">
                Generate New Report
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {savedReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{report.name}</p>
                      <p className="text-xs text-muted-foreground">{report.type} • {report.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {report.status === "ready" ? (
                      <Badge className="bg-primary/20 text-primary border-0">Ready</Badge>
                    ) : (
                      <Badge className="bg-warning/20 text-warning border-0">Processing</Badge>
                    )}
                    <Button variant="ghost" size="sm" disabled={report.status !== "ready"}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Report Buttons */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="h-auto py-4 flex-col gap-2 bg-transparent">
            <DollarSign className="h-6 w-6 text-primary" />
            <span>Financial Report</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2 bg-transparent">
            <BedDouble className="h-6 w-6 text-chart-2" />
            <span>Occupancy Report</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2 bg-transparent">
            <Users className="h-6 w-6 text-chart-3" />
            <span>Guest Report</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2 bg-transparent">
            <Activity className="h-6 w-6 text-chart-4" />
            <span>Performance Report</span>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
