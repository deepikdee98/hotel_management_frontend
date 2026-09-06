"use client"

import { useEffect, useRef, useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Download, FileBarChart2, Loader2, Printer, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { getReportsCatalog, runReport, exportReport, type ReportCatalog, type ReportQuery, type ReportResult } from "@/services/api/reports.service"
import { ReportFilters, selectClass } from "./report-filters"
import { ReportTable } from "./report-table"
import { formatReportValue, validReportTimezone } from "./report-format"

const categoryNames: Record<string, string> = { dashboard: "Management", "front-office": "Front office", accounts: "Accounts", housekeeping: "Housekeeping", inventory: "Inventory", audit: "Staff & audit", "multi-property": "Multi-property" }
const initialQuery: ReportQuery = { preset: "today", propertyIds: [], page: 1, limit: 25, search: "", filters: {} }
const message = (error: unknown) => error instanceof Error ? error.message : "Unable to load reports"

export function ReportsWorkspace({ initialCategory = "dashboard" }: { initialCategory?: string }) {
 const { user } = useAuth()
 const [catalog, setCatalog] = useState<ReportCatalog | null>(null)
 const [category, setCategory] = useState(initialCategory)
 const [reportId, setReportId] = useState("")
 const [query, setQuery] = useState<ReportQuery>(initialQuery)
 const [search, setSearch] = useState("")
 const [result, setResult] = useState<{ key: string; data: ReportResult } | null>(null)
 const [error, setError] = useState("")
 const [catalogError, setCatalogError] = useState("")
 const [revision, setRevision] = useState(0)
 const [scope, setScope] = useState(0)
 const [exporting, setExporting] = useState(false)
 const generation = useRef(0)
 const currentKey = useRef("")
 const report = catalog?.reports.find(item => item.id === reportId)
 const key = JSON.stringify([scope, reportId, query, search, revision])
 currentKey.current = key
 const data = result?.key === key ? result.data : null
 const invalidRange = query.preset === "custom" && (!query.startDate || !query.endDate || query.startDate > query.endDate)
 const ready = !!report && report.status === "available" && query.propertyIds.length > 0 && !invalidRange && query.search === search

 useEffect(() => {
  const changed = () => { generation.current++; currentKey.current = ""; setCatalog(null); setResult(null); setError(""); setCatalogError(""); setScope(value => value + 1) }
  window.addEventListener("hotel:property-changed", changed)
  return () => window.removeEventListener("hotel:property-changed", changed)
 }, [])
 useEffect(() => {
  let active = true
  setCatalog(null); setCatalogError(""); setResult(null)
  getReportsCatalog().then(value => {
   if (!active) return
   const selectedCategory = value.reports.some(item => item.category === initialCategory) ? initialCategory : value.reports[0]?.category || ""
   setCatalog(value); setCategory(selectedCategory)
   setReportId(value.reports.find(item => item.category === selectedCategory && item.status === "available")?.id || value.reports.find(item => item.category === selectedCategory)?.id || "")
   const activeId = localStorage.getItem("activePropertyId") || user?.hotelId
   setQuery({ ...initialQuery, propertyIds: [value.properties.find(item => item.id === activeId)?.id || value.properties[0]?.id].filter((id): id is string => !!id) }); setSearch("")
  }).catch(cause => { if (active) setCatalogError(message(cause)) })
  return () => { active = false; generation.current++ }
 }, [scope, initialCategory, user?.id, user?.hotelId])
 useEffect(() => { const timer = setTimeout(() => setQuery(value => value.search === search ? value : { ...value, search, page: 1 }), 350); return () => clearTimeout(timer) }, [search])
 useEffect(() => {
  const request = ++generation.current
  setError("")
  if (!ready || !report) return
  runReport(report, query).then(value => { if (generation.current === request) setResult({ key, data: value }) }).catch(cause => { if (generation.current === request) setError(message(cause)) })
  return () => { generation.current++ }
 }, [key, ready, report])

 const changeReport = (id: string) => { setReportId(id); setSearch(""); setQuery(value => ({ ...value, filters: {}, search: "", sort: undefined, order: undefined, page: 1 })) }
 const download = async (format: "csv" | "xlsx" | "pdf", print = false) => {
  if (!report || !ready) return
  const requestKey = key
  // Open synchronously to keep the browser's user gesture for the print preview.
  const preview = print ? window.open("about:blank", "_blank") : null
  if (print && !preview) { setError("Allow pop-ups to open the printable PDF, or use PDF download."); return }
  setExporting(true); setError("")
  try {
   const blob = await exportReport(report, query, format)
   if (currentKey.current !== requestKey) { preview?.close(); return }
   const url = URL.createObjectURL(blob)
   if (preview) { preview.location.href = url } else { const link = document.createElement("a"); link.href = url; link.download = `${report.id}.${format}`; link.click() }
   setTimeout(() => URL.revokeObjectURL(url), 60000)
  } catch (cause) { preview?.close(); if (currentKey.current === requestKey) setError(message(cause)) } finally { setExporting(false) }
 }
 const categories = [...new Set(catalog?.reports.map(item => item.category) || [])]
 return <main className="space-y-5 pb-8">
  <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs font-medium uppercase tracking-wider text-foreground/75">Hotel operations / Intelligence</p><h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight"><FileBarChart2 className="h-6 w-6 text-primary" />Reports & analytics</h1><p className="mt-1 text-sm text-foreground/75">Operational records and performance, scoped to your properties.</p></div><Button variant="outline" onClick={() => catalog ? setRevision(value => value + 1) : setScope(value => value + 1)}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button></header>
  {catalogError && <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">{catalogError}</div>}
  {!catalog && !catalogError && <div role="status" className="flex items-center gap-2 py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Loading authorized reports…</div>}
  {catalog && <>
   <nav aria-label="Report categories" className="flex flex-wrap gap-1 border-b pb-2">{categories.map(item => <Button key={item} variant={category === item ? "default" : "ghost"} className={category === item ? "bg-foreground text-background hover:bg-foreground/90" : ""} size="sm" aria-pressed={category === item} onClick={() => { setCategory(item); changeReport(catalog.reports.find(value => value.category === item && value.status === "available")?.id || catalog.reports.find(value => value.category === item)?.id || "") }}>{categoryNames[item] || item}</Button>)}</nav>
   {!catalog.reports.length && <p className="rounded-lg border p-8 text-center text-muted-foreground">No reports are available for your permissions.</p>}
   {report && <>
    <div className="flex flex-wrap items-end justify-between gap-4"><label className="w-full space-y-1.5 text-sm font-medium sm:max-w-md">Report<select className={selectClass} value={reportId} onChange={e => changeReport(e.target.value)}>{catalog.reports.filter(item => item.category === category).map(item => <option key={item.id} value={item.id}>{item.title}{item.status === "blocked" ? " · Requires additional data" : ""}</option>)}</select></label><div className="flex flex-wrap gap-2">{catalog.canExport && <>{(["csv", "xlsx", "pdf"] as const).map(format => <Button key={format} size="sm" variant="outline" disabled={!ready || exporting || !data} onClick={() => download(format)}><Download className="mr-1.5 h-3.5 w-3.5" />{format === "xlsx" ? "Excel" : format.toUpperCase()}</Button>)}<Button size="sm" variant="outline" disabled={!ready || exporting || !data} onClick={() => download("pdf", true)}><Printer className="mr-1.5 h-3.5 w-3.5" />Print PDF</Button></>}{exporting && <span role="status" className="text-sm text-muted-foreground">Preparing all records…</span>}</div></div>
    {report.status === "blocked" ? <div className="rounded-lg border bg-muted/40 p-6"><h2 className="font-semibold">Requires data model enhancement</h2><p className="mt-2 text-sm text-muted-foreground">{report.reason || "The source records needed for this report are not available."}</p></div> : <>
     {report.snapshot && <p className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm">Current snapshot · This report reflects current state, not a historical reconstruction.</p>}
     <ReportFilters catalog={catalog} report={report} query={query} onChange={setQuery} search={search} onSearch={setSearch} />
     {invalidRange && <p role="status" className="text-sm text-muted-foreground">Choose a valid start and end date to run this report.</p>}
     {!query.propertyIds.length && <p role="status" className="text-sm text-muted-foreground">Select at least one property.</p>}
     {error && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}
     {ready && !data && !error && <div role="status" className="flex items-center justify-center gap-2 py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Building report…</div>}
     {data && <>
      {!!data.kpis?.length && <div className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 xl:grid-cols-4">{data.kpis.map(item => <div key={item.label} className="bg-card p-5"><p className="text-sm text-muted-foreground">{item.label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{formatReportValue(item.value, item.type, data.meta.currency)}</p>{item.note && <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>}</div>)}</div>}
      {!!data.charts?.length && <div className="grid gap-4 lg:grid-cols-2">{data.charts.map(chart => <section key={chart.key} className="min-w-0 rounded-lg border bg-card p-4" aria-label={chart.title}><h2 className="mb-4 font-medium">{chart.title}</h2>{chart.data.length ? <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart.data}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey={chart.labelKey} tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend />{chart.series.map((series, index) => <Bar key={series.key} dataKey={series.key} name={series.label} fill={`var(--chart-${index % 5 + 1})`} radius={[3, 3, 0, 0]} />)}</BarChart></ResponsiveContainer></div> : <div className="flex h-64 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">No records for the selected date range.</div>}</section>)}</div>}
      <ReportTable data={data} sort={query.sort} order={query.order} onSort={sort => setQuery(value => ({ ...value, sort, order: value.sort === sort && value.order === "asc" ? "desc" : "asc", page: 1 }))} onPage={page => setQuery(value => ({ ...value, page }))} />
      <footer className="space-y-1 text-xs text-foreground/75"><p>{data.meta.properties.map(item => item.name).join(" · ")} · {data.meta.startDate} — {data.meta.endDate} · {data.meta.timezone}</p><p>Generated {formatReportValue(data.meta.generatedAt, "date", null, data.meta.timezone)} ({validReportTimezone(data.meta.timezone)}) by {data.meta.generatedBy}. Exports include all matching records.</p>{data.meta.notes.map((note, index) => <p key={index}>{note}</p>)}</footer>
     </>}
    </>}
   </>}
  </>}
 </main>
}
