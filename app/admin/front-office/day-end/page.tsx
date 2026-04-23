"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Moon, CheckCircle, AlertTriangle, Clock, ArrowRight, Loader2 } from "lucide-react"
import { getNightAuditStatus, runNightAudit } from "@/lib/backend-api"
import { toast } from "@/hooks/use-toast"

const DAY_END_TASKS = [
  { id: "post-tariff", label: "Post Room Tariff", description: "Post daily room tariff for all occupied rooms", status: "pending" },
  { id: "post-services", label: "Post Other Services", description: "Ensure all extra service charges are posted", status: "pending" },
  { id: "verify-billing", label: "Verify Guest Billing", description: "Verify all guest folios are up to date", status: "pending" },
  { id: "cashier-close", label: "Cashier Closure", description: "Close cashier shift and reconcile cash", status: "pending" },
  { id: "room-status", label: "Update Room Status", description: "Confirm all room statuses are accurate", status: "pending" },
  { id: "hk-report", label: "Housekeeping Report", description: "Review housekeeping report for the day", status: "pending" },
  { id: "no-show", label: "Process No-Shows", description: "Mark reservations with no check-in as no-show", status: "pending" },
  { id: "backup", label: "Data Backup", description: "Initiate daily data backup", status: "pending" },
]

export default function DayEndPage() {
  const [tasks, setTasks] = useState(DAY_END_TASKS)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [auditStatus, setAuditStatus] = useState<any>(null)

  const today = new Date().toISOString().slice(0, 10)
  const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().slice(0, 10)

  useEffect(() => {
    const fetchStatus = async () => {
      setIsLoading(true)
      try {
        const response = await getNightAuditStatus(today)
        if (response.success && response.data) {
          setAuditStatus(response.data)
          // If audit completed, mark all tasks as completed
          if (response.data.status === "Completed") {
            setTasks(prev => prev.map(t => ({ ...t, status: "completed" })))
          }
        }
      } catch (error) {
        console.error("Failed to fetch audit status:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStatus()
  }, [today])

  const completedCount = tasks.filter((t) => t.status === "completed").length
  const totalCount = tasks.length
  const allComplete = completedCount === totalCount

  const toggleTask = (id: string) => {
    if (auditStatus?.status === "Completed") return
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: t.status === "completed" ? "pending" : "completed" } : t
      )
    )
  }

  const handleRunDayEnd = async () => {
    setIsProcessing(true)
    try {
      const taskObject: Record<string, boolean> = {}
      tasks.forEach(t => {
        taskObject[t.id] = t.status === "completed"
      })

      const response = await runNightAudit({
        auditDate: today,
        tasks: taskObject
      })

      if (response.success) {
        setAuditStatus(response.data)
        toast({
          title: "Day End Process Completed",
          description: "Night audit has been successfully processed for today.",
        })
        setIsConfirmOpen(false)
      }
    } catch (error: any) {
      toast({
        title: "Process Failed",
        description: error.message || "Failed to run day end process",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout requiredRole="admin">
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
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
          <Button 
            onClick={() => setIsConfirmOpen(true)} 
            disabled={!allComplete || auditStatus?.status === "Completed"}
          >
            <Moon className="h-4 w-4 mr-2" />
            {auditStatus?.status === "Completed" ? "Process Completed" : "Run Day End"}
          </Button>
        </div>

        {auditStatus?.status === "Completed" && (
          <Card className="border-success/30 bg-success/5">
            <CardContent className="py-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <p className="font-medium text-foreground">Day End Processed</p>
                <p className="text-sm text-muted-foreground">
                  Processed on {new Date(auditStatus.completedAt).toLocaleString()} by {auditStatus.completedBy?.name || auditStatus.completedBy?.username || "Admin"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Progress: {completedCount} of {totalCount} tasks completed</p>
                <p className="text-sm text-muted-foreground">
                  {auditStatus?.status === "Completed" 
                    ? "Day end process has been finalized for today." 
                    : allComplete ? "All tasks complete. Ready to run day end." : "Complete all tasks before running day end."}
                </p>
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
                  disabled={auditStatus?.status === "Completed"}
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
                <span className="font-medium">{new Date(today).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tasks Completed</span>
                <span className="font-medium">{completedCount}/{totalCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Next Business Date</span>
                <span className="font-medium">{new Date(tomorrow).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfirmOpen(false)} disabled={isProcessing}>Cancel</Button>
              <Button onClick={handleRunDayEnd} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Confirm Day End
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
