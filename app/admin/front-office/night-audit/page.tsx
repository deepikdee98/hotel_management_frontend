"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { ClipboardList, CheckCircle, AlertTriangle, Play, FileText, DollarSign, BedDouble, Users, Loader2 } from "lucide-react"
import { runNightAudit, getAdminDashboard, getNightAuditStatus } from "@/lib/backend-api"
import { useToast } from "@/hooks/use-toast"

export default function NightAuditPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isRunning, setIsRunning] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [auditComplete, setAuditComplete] = useState(false)
  const [auditData, setAuditData] = useState<any>(null)
  const [stats, setStats] = useState({
    occupiedRooms: 0,
    inHouseGuests: 0,
    todayRevenue: 0,
    totalRooms: 0
  })

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true)
      try {
        const today = new Date().toISOString().slice(0, 10)
        const [dashboardRes, auditStatusRes] = await Promise.all([
          getAdminDashboard(),
          getNightAuditStatus(today)
        ])

        if (dashboardRes.success && dashboardRes.data) {
          const s = dashboardRes.data.stats as any
          const rs = dashboardRes.data.roomStatus as any
          setStats({
            occupiedRooms: Number(rs?.occupied || 0),
            inHouseGuests: Number(s?.todayCheckIns || 0),
            todayRevenue: Number(s?.totalRevenue || 0),
            totalRooms: Number(rs?.available || 0) + Number(rs?.occupied || 0) + Number(rs?.reserved || 0) + Number(rs?.maintenance || 0)
          })
        }

        if (auditStatusRes.success && auditStatusRes.data) {
          if (auditStatusRes.data.status === "Completed") {
            setAuditData(auditStatusRes.data)
            setAuditComplete(true)
          }
        }
      } catch (error) {
        console.error("Failed to load night audit data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadInitialData()
  }, [])

  const auditSteps = [
    { label: "Post pending room tariffs", status: auditComplete ? "done" : "pending" },
    { label: "Post pending service charges", status: auditComplete ? "done" : "pending" },
    { label: "Process no-show reservations", status: auditComplete ? "done" : "pending" },
    { label: "Update room availability", status: auditComplete ? "done" : "pending" },
    { label: "Generate daily revenue report", status: auditComplete ? "done" : "pending" },
    { label: "Reconcile cashier accounts", status: auditComplete ? "done" : "pending" },
    { label: "Roll business date forward", status: auditComplete ? "done" : "pending" },
  ]

  const handleRunAudit = async () => {
    setIsConfirmOpen(false)
    setIsRunning(true)
    try {
      const auditDate = new Date().toISOString().slice(0, 10)
      const res = await runNightAudit({ 
        auditDate,
        tasks: {
          postTariffs: true,
          postServices: true,
          processNoShows: true,
          updateAvailability: true
        }
      })
      
      if (res.success) {
        setAuditData(res.data)
        setAuditComplete(true)
        toast({
          title: "Night Audit Completed",
          description: `Audit for ${auditDate} has been finalized successfully.`,
        })
      } else {
        toast({
          title: "Night Audit Failed",
          description: "There was an error running the night audit process.",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "A network error occurred while running the night audit.",
        variant: "destructive"
      })
    } finally {
      setIsRunning(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Night Audit</h1>
          <p className="text-sm text-muted-foreground">Run nightly audit process to close the business day</p>
        </div>
        <Button onClick={() => setIsConfirmOpen(true)} disabled={isRunning || auditComplete}>
          {isRunning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
          {isRunning ? "Running..." : auditComplete ? "Completed" : "Run Night Audit"}
        </Button>
      </div>

        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Occupied Rooms", value: stats.occupiedRooms.toString(), icon: BedDouble },
            { label: "In-House Guests", value: stats.inHouseGuests.toString(), icon: Users },
            { label: "Today's Revenue", value: `₹${stats.todayRevenue.toLocaleString()}`, icon: DollarSign },
            { label: "Pending Postings", value: auditComplete ? "0" : "...", icon: FileText },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="py-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Audit Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {auditSteps.map((step, i) => (
                <div key={step.label} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <span className="text-xs font-mono text-muted-foreground w-6">{String(i + 1).padStart(2, "0")}</span>
                  {step.status === "done" ? (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  ) : isRunning ? (
                    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                  )}
                  <span className={`flex-1 text-sm ${step.status === "done" ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {step.label}
                  </span>
                  {step.status === "done" ? (
                    <Badge className="bg-primary/10 text-primary border-primary/20">Done</Badge>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {auditComplete && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-4 flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium text-foreground">Night Audit Completed Successfully</p>
                <p className="text-sm text-muted-foreground">
                  Business date rolled to {auditData?.auditDate || new Date().toLocaleDateString()}. 
                  Total revenue finalized: ₹{auditData?.summary?.totalRevenue?.toLocaleString() || "0"}
                </p>
              </div>
              <Button 
                variant="outline" 
                className="ml-auto"
                onClick={() => router.push(`/admin/reports?date=${auditData?.auditDate}`)}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Report
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Run Night Audit</DialogTitle>
              <DialogDescription>
                This will process all pending transactions, post room tariffs, and roll the business date forward. Ensure Day End Process is completed first.
              </DialogDescription>
            </DialogHeader>
            <div className="py-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Current Business Date</span><span className="font-medium">{new Date().toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Rooms to Post</span><span className="font-medium">{stats.occupiedRooms} rooms</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Current Occupancy</span><span className="font-medium">{stats.occupiedRooms} / {stats.totalRooms}</span></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
              <Button onClick={handleRunAudit}>Confirm & Run</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  )
}
