"use client"

import { useEffect, useState } from "react"
import { apiRequest } from "@/services/api/client"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface Activity { id: string; actorName: string; action: string; message: string; createdAt: string }
export default function StaffActivityPage() {
  const { user } = useAuth()
  const enabled = user?.role === "admin" || user?.role === "company-admin"
  const [items, setItems] = useState<Activity[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [action, setAction] = useState("")
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  useEffect(() => {
    let cancelled = false
    if (!enabled) return
    setLoading(true)
    setError("")
    apiRequest<{ data: Activity[]; total: number }>(`/admin/staff-activity?page=${page}&limit=25&action=${encodeURIComponent(action)}`)
      .then(result => { if (!cancelled) { setItems(result.data); setTotal(result.total) } })
      .catch(() => { if (!cancelled) setError("Unable to load staff activity. Please retry.") })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [enabled, user?.id, page, action, revision])
  if (!enabled) return <p>Staff activity is available to hotel administrators.</p>
  return <div className="space-y-5">
    <div><h1 className="text-2xl font-bold">Staff Activity</h1><p className="text-muted-foreground">Recorded hotel actions, including who completed them and when.</p></div>
    <div className="flex flex-wrap gap-2"><select aria-label="Filter by action" className="rounded-md border bg-background p-2" value={action} onChange={event => { setAction(event.target.value); setPage(1) }}>
      <option value="">All actions</option><option value="check-in">Check-in</option><option value="check-out">Check-out</option><option value="undo-checkout">Undo checkout</option><option value="housekeeping-completed">Housekeeping completed</option><option value="pax-check-in">Additional guests</option>
    </select><Button variant="outline" disabled={loading} onClick={() => setRevision(value => value + 1)}>Refresh</Button></div>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {loading ? <p>Loading staff activity…</p> : !error && !items.length ? <p>No recorded activity.</p> : !error && items.map(item => <Card key={item.id}><CardContent className="space-y-2 p-4"><h2 className="font-semibold">{item.actorName} · {item.action.replace(/-/g, " ")}</h2><p>{item.message}</p><time className="text-xs text-muted-foreground" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time></CardContent></Card>)}
    <div className="flex items-center gap-3"><Button variant="outline" disabled={loading || page === 1} onClick={() => setPage(value => value - 1)}>Previous</Button><span>Page {page}</span><Button variant="outline" disabled={loading || page * 25 >= total} onClick={() => setPage(value => value + 1)}>Next</Button></div>
  </div>
}
