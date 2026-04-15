"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Plus,
  Search,
  BedDouble,
  Loader2,
} from "lucide-react"

// Mock housekeeping data
const mockTasks = [
  { id: "HK-001", room: "101", type: "checkout", priority: "high", assignee: "Maria Garcia", status: "in-progress", time: "09:00 AM" },
  { id: "HK-002", room: "205", type: "stayover", priority: "medium", assignee: "Juan Rodriguez", status: "pending", time: "10:00 AM" },
  { id: "HK-003", room: "302", type: "checkout", priority: "high", assignee: "Maria Garcia", status: "completed", time: "08:30 AM" },
  { id: "HK-004", room: "118", type: "deep-clean", priority: "low", assignee: "Ana Martinez", status: "pending", time: "02:00 PM" },
  { id: "HK-005", room: "401", type: "turndown", priority: "medium", assignee: "Juan Rodriguez", status: "pending", time: "06:00 PM" },
  { id: "HK-006", room: "215", type: "stayover", priority: "medium", assignee: "Ana Martinez", status: "in-progress", time: "11:00 AM" },
]

const mockStaff = [
  { id: "1", name: "Maria Garcia", tasksToday: 8, completed: 5, avgTime: "32 min" },
  { id: "2", name: "Juan Rodriguez", tasksToday: 6, completed: 3, avgTime: "28 min" },
  { id: "3", name: "Ana Martinez", tasksToday: 7, completed: 4, avgTime: "35 min" },
]

const cleaningChecklist = [
  "Make bed with fresh linens",
  "Vacuum carpets and rugs",
  "Clean and sanitize bathroom",
  "Restock toiletries and amenities",
  "Dust all surfaces",
  "Empty trash bins",
  "Clean mirrors and windows",
  "Check minibar and restock",
]

export default function HousekeepingPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false)

  const filteredTasks = mockTasks.filter((task) => {
    const matchesSearch =
      task.room.includes(searchQuery) ||
      task.assignee.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === "all" || task.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-primary/20 text-primary border-0">Completed</Badge>
      case "pending":
        return <Badge className="bg-warning/20 text-warning border-0">Pending</Badge>
      case "in-progress":
        return <Badge className="bg-chart-2/20 text-chart-2 border-0">In Progress</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>
      case "medium":
        return <Badge className="bg-warning/20 text-warning border-0">Medium</Badge>
      case "low":
        return <Badge variant="secondary">Low</Badge>
      default:
        return <Badge variant="secondary">{priority}</Badge>
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "checkout":
        return "Checkout Clean"
      case "stayover":
        return "Stayover Service"
      case "deep-clean":
        return "Deep Clean"
      case "turndown":
        return "Turndown Service"
      default:
        return type
    }
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Housekeeping</h1>
            <p className="text-muted-foreground">Manage room cleaning tasks and staff assignments</p>
          </div>
          <Dialog open={isAssignTaskOpen} onOpenChange={setIsAssignTaskOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Assign Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Housekeeping Task</DialogTitle>
                <DialogDescription>Create a new cleaning task and assign to staff</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Room Number</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="101">Room 101</SelectItem>
                      <SelectItem value="102">Room 102</SelectItem>
                      <SelectItem value="103">Room 103</SelectItem>
                      <SelectItem value="201">Room 201</SelectItem>
                      <SelectItem value="202">Room 202</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Task Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checkout">Checkout Clean</SelectItem>
                      <SelectItem value="stayover">Stayover Service</SelectItem>
                      <SelectItem value="deep-clean">Deep Clean</SelectItem>
                      <SelectItem value="turndown">Turndown Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Priority</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Assign To</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockStaff.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Scheduled Time</Label>
                  <Input type="time" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAssignTaskOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAssignTaskOpen(false)}>Assign Task</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
              <Sparkles className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">21</div>
              <p className="text-xs text-muted-foreground">For today</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">12</div>
              <p className="text-xs text-primary">57% completion rate</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
              <Loader2 className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">4</div>
              <p className="text-xs text-muted-foreground">Being cleaned now</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">High Priority</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">3</div>
              <p className="text-xs text-destructive">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Tasks Table */}
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-foreground">Tasks</CardTitle>
                  <CardDescription>Today's housekeeping tasks</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative w-full sm:w-48">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      className="pl-8 bg-background"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Room</TableHead>
                    <TableHead className="text-muted-foreground">Type</TableHead>
                    <TableHead className="text-muted-foreground">Priority</TableHead>
                    <TableHead className="text-muted-foreground">Assignee</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => (
                    <TableRow key={task.id} className="border-border">
                      <TableCell className="font-medium text-foreground">{task.room}</TableCell>
                      <TableCell className="text-foreground">{getTypeLabel(task.type)}</TableCell>
                      <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                      <TableCell className="text-foreground">{task.assignee}</TableCell>
                      <TableCell>{getStatusBadge(task.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Staff Performance */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Staff Performance
              </CardTitle>
              <CardDescription>Today's cleaning staff</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockStaff.map((staff) => (
                <div key={staff.id} className="p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-foreground">{staff.name}</p>
                    <Badge variant="secondary">{staff.avgTime}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Tasks: {staff.completed}/{staff.tasksToday}</span>
                    <span>{Math.round((staff.completed / staff.tasksToday) * 100)}% done</span>
                  </div>
                  <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(staff.completed / staff.tasksToday) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Cleaning Checklist */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <BedDouble className="h-5 w-5 text-primary" />
              Standard Cleaning Checklist
            </CardTitle>
            <CardDescription>Required tasks for each room cleaning</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {cleaningChecklist.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox id={`check-${index}`} />
                  <label
                    htmlFor={`check-${index}`}
                    className="text-sm text-foreground cursor-pointer"
                  >
                    {item}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
