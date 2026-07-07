"use client"

import { Fragment, useState, useEffect } from "react"
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
import {
  getHousekeepingTasks,
  getHousekeepingRooms,
  getHousekeepingStaff,
  createHousekeepingTask,
  updateHousekeepingTask,
  updateRoomHkStatus
} from "@/lib/backend-api"
import type { HousekeepingTask, Room, Staff } from "@/lib/types"
import { toast } from "sonner"

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
  const [isLoading, setIsLoading] = useState(true)
  const [tasks, setTasks] = useState<HousekeepingTask[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [staff, setStaff] = useState<Staff[]>([])

  // Form state
  const [newTask, setNewTask] = useState({
    roomId: "",
    taskType: "checkout",
    priority: "medium",
    assignedTo: "",
    notes: ""
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [tasksData, roomsData, staffData] = await Promise.all([
        getHousekeepingTasks(),
        getHousekeepingRooms(),
        getHousekeepingStaff()
      ])
      setTasks(tasksData)
      setRooms(roomsData)
      setStaff(staffData)
    } catch (error) {
      console.error("Failed to fetch housekeeping data:", error)
      toast.error("Failed to load housekeeping data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTask = async () => {
    if (!newTask.roomId) {
      toast.error("Please select a room")
      return
    }
    try {
      await createHousekeepingTask(newTask)
      toast.success("Task assigned successfully")
      setIsAssignTaskOpen(false)
      setNewTask({
        roomId: "",
        taskType: "checkout",
        priority: "medium",
        assignedTo: "",
        notes: ""
      })
      fetchData()
    } catch (error) {
      toast.error("Failed to assign task")
    }
  }

  const handleUpdateStatus = async (taskId: string, status: string) => {
    try {
      await updateHousekeepingTask(taskId, { status })
      toast.success(`Task marked as ${status}`)
      fetchData()
    } catch (error) {
      toast.error("Failed to update task status")
    }
  }

  const handleUpdateRoomHkStatus = async (roomId: string, hkStatus: string) => {
    try {
      await updateRoomHkStatus(roomId, { hkStatus })
      toast.success(`Room marked as ${hkStatus}`)
      fetchData()
    } catch (error) {
      toast.error("Failed to update room status")
    }
  }

  const activeHousekeepingTasks = tasks.filter((task) => {
    if (task.status === "cancelled") return false
    if (task.taskType === "checkout" && task.room?.status === "occupied") return false
    return true
  })

  const filteredTasks = activeHousekeepingTasks.filter((task) => {
    const matchesSearch =
      task.room.roomNumber.includes(searchQuery) ||
      (task.assignedToName || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === "all" || task.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const dirtyRooms = rooms.filter((room) => room.hkStatus === "dirty")

  const stats = {
    total: activeHousekeepingTasks.length,
    completed: activeHousekeepingTasks.filter(t => t.status === "completed").length,
    inProgress: activeHousekeepingTasks.filter(t => t.status === "in-progress").length,
    highPriority: activeHousekeepingTasks.filter(t => t.priority === "high" || t.priority === "urgent").length,
    dirtyRooms: dirtyRooms.length,
  }

  const handleAssignDirtyRoom = (room: Room) => {
    setNewTask({
      roomId: room.id,
      taskType: "checkout",
      priority: "medium",
      assignedTo: "",
      notes: "Room marked dirty after guest checkout",
    })
    setIsAssignTaskOpen(true)
  }

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
      case "urgent":
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
      case "inspection":
        return "Inspection"
      case "maintenance":
        return "Maintenance"
      default:
        return type
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
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
                  <Select
                    value={newTask.roomId}
                    onValueChange={(v) => setNewTask({ ...newTask, roomId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map(room => (
                        <SelectItem key={room.id} value={room.id}>
                          Room {room.number} ({room.hkStatus || 'dirty'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Task Type</Label>
                  <Select
                    value={newTask.taskType}
                    onValueChange={(v) => setNewTask({ ...newTask, taskType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checkout">Checkout Clean</SelectItem>
                      <SelectItem value="stayover">Stayover Service</SelectItem>
                      <SelectItem value="deep-clean">Deep Clean</SelectItem>
                      <SelectItem value="turndown">Turndown Service</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Priority</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(v) => setNewTask({ ...newTask, priority: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Assign To</Label>
                  <Select
                    value={newTask.assignedTo}
                    onValueChange={(v) => setNewTask({ ...newTask, assignedTo: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Notes</Label>
                  <Input
                    placeholder="Optional notes"
                    value={newTask.notes}
                    onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAssignTaskOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTask}>Assign Task</Button>
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
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              <p className="text-xs text-muted-foreground">For today</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.completed}</div>
              <p className="text-xs text-primary">
                {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% completion rate
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
              <Loader2 className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">Being cleaned now</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Dirty Rooms</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.dirtyRooms}</div>
              <p className="text-xs text-destructive">Needs cleaning</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Dirty Rooms
            </CardTitle>
            <CardDescription>Rooms marked dirty after guest checkout</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Room</TableHead>
                  <TableHead className="text-muted-foreground">Type</TableHead>
                  <TableHead className="text-muted-foreground">Floor</TableHead>
                  <TableHead className="text-muted-foreground">Front Office Status</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dirtyRooms.map((room) => (
                  <TableRow key={room.id} className="border-border">
                    <TableCell className="font-medium text-foreground">Room {room.number}</TableCell>
                    <TableCell className="text-foreground">{room.type}</TableCell>
                    <TableCell className="text-foreground">{room.floor}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{room.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleAssignDirtyRoom(room)}>
                          Assign
                        </Button>
                        <Button size="sm" onClick={() => handleUpdateRoomHkStatus(room.id, "clean")}>
                          Mark Clean
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {dirtyRooms.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No dirty rooms found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

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
                    <Fragment key={task.id}>
                      <TableRow className="border-border">
                        <TableCell className="font-medium text-foreground">{task.room.roomNumber}</TableCell>
                        <TableCell className="text-foreground">{getTypeLabel(task.taskType)}</TableCell>
                        <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                        <TableCell className="text-foreground">{task.assignedToName || 'Unassigned'}</TableCell>
                        <TableCell>{getStatusBadge(task.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {task.status === 'pending' && (
                              <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(task.id, 'in-progress')}>
                                Start
                              </Button>
                            )}
                            {task.status === 'in-progress' && (
                              <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(task.id, 'completed')}>
                                Complete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {task.notes?.trim() && (
                        <TableRow className="border-border hover:bg-transparent">
                          <TableCell colSpan={6} className="pt-0">
                            <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
                              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                Notes
                              </p>
                              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                                {task.notes}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                  {filteredTasks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No tasks found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Staff Workload */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Staff Workload
              </CardTitle>
              <CardDescription>Today's cleaning staff</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {staff.map((s) => {
                const staffTasks = tasks.filter(t => t.assignedTo === s.id)
                const completed = staffTasks.filter(t => t.status === 'completed').length
                const total = staffTasks.length
                const percent = total > 0 ? Math.round((completed / total) * 100) : 0

                return (
                  <div key={s.id} className="p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-foreground">{s.name}</p>
                      <Badge variant="secondary">{s.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Tasks: {completed}/{total}</span>
                      <span>{percent}% done</span>
                    </div>
                    <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
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
                  <Label
                    htmlFor={`check-${index}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {item}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
  )
}
