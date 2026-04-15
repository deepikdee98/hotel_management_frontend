"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Moon, CheckCircle, AlertTriangle, Clock, ArrowRight } from "lucide-react"

const DAY_END_TASKS = [
  { id: "post-tariff", label: "Post Room Tariff", description: "Post daily room tariff for all occupied rooms", status: "pending" },
  { id: "post-services", label: "Post Other Services", description: "Ensure all extra service charges are posted", status: "completed" },
  { id: "verify-billing", label: "Verify Guest Billing", description: "Verify all guest folios are up to date", status: "pending" },
  { id: "cashier-close", label: "Cashier Closure", description: "Close cashier shift and reconcile cash", status: "pending" },
  { id: "room-status", label: "Update Room Status", description: "Confirm all room statuses are accurate", status: "completed" },
  { id: "hk-report", label: "Housekeeping Report", description: "Review housekeeping report for the day", status: "completed" },
  { id: "no-show", label: "Process No-Shows", description: "Mark reservations with no check-in as no-show", status: "pending" },
  { id: "backup", label: "Data Backup", description: "Initiate daily data backup", status: "pending" },
]

export default function DayEndPage() {
  const [tasks, setTasks] = useState(DAY_END_TASKS)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const completedCount = tasks.filter((t) => t.status === "completed").length
  const totalCount = tasks.length
  const allComplete = completedCount === totalCount

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: t.status === "completed" ? "pending" : "completed" } : t
      )
    )
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Day End Process</h1>
            <p className="text-sm text-muted-foreground">Complete all daily closing activities before running night audit</p>
          </div>
          <Button onClick={() => setIsConfirmOpen(true)} disabled={!allComplete}>
            <Moon className="h-4 w-4 mr-2" />
            Run Day End
          </Button>
        </div>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Progress: {completedCount} of {totalCount} tasks completed</p>
                <p className="text-sm text-muted-foreground">{allComplete ? "All tasks complete. Ready to run day end." : "Complete all tasks before running day end."}</p>
              </div>
            </div>
            <div className="w-48 bg-muted rounded-full h-2.5">
              <div className="bg-primary h-2.5 rounded-full transition-all" style={{ width: `${(completedCount / totalCount) * 100}%` }} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {tasks.map((task, index) => (
            <Card key={task.id} className={task.status === "completed" ? "opacity-70" : ""}>
              <CardContent className="py-3 flex items-center gap-4">
                <Checkbox
                  checked={task.status === "completed"}
                  onCheckedChange={() => toggleTask(task.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                    <p className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {task.label}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">{task.description}</p>
                </div>
                {task.status === "completed" ? (
                  <Badge className="bg-primary/10 text-primary border-primary/20"><CheckCircle className="h-3 w-3 mr-1" />Done</Badge>
                ) : (
                  <Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" />Pending</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Day End Process</DialogTitle>
              <DialogDescription>
                This will close the current business day. All pending transactions will be finalized. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Business Date</span>
                <span className="font-medium">December 22, 2024</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tasks Completed</span>
                <span className="font-medium">{completedCount}/{totalCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Next Business Date</span>
                <span className="font-medium">December 23, 2024</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
              <Button>
                Confirm Day End
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
