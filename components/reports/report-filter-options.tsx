"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { getReportFilterOptions, type ReportDefinition } from "@/services/api/reports.service"
import { reportFilterLabel } from "./report-format"

const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

export function ReportFilterOptions({ report, filter, propertyIds, value, onChange }: {
  report: ReportDefinition
  filter: string
  propertyIds: string[]
  value: string
  onChange: (value: string) => void
}) {
  const [search, setSearch] = useState("")
  const [result, setResult] = useState<{ options: { value: string; label: string }[]; hasMore: boolean }>({ options: [], hasMore: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const request = useRef(0)
  const searchable = ["room", "roomCategory", "staff"].includes(filter) || result.hasMore

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const id = ++request.current
      setLoading(true); setError("")
      getReportFilterOptions(report, filter, propertyIds, search)
        .then(data => { if (request.current === id) setResult(data) })
        .catch(cause => { if (request.current === id) setError(cause instanceof Error ? cause.message : "Options unavailable") })
        .finally(() => { if (request.current === id) setLoading(false) })
    }, 250)
    return () => { window.clearTimeout(timer); request.current++ }
  }, [report.id, filter, propertyIds.join(","), search])

  const options = value && !result.options.some(option => option.value === value)
    ? [{ value, label: value }, ...result.options]
    : result.options

  return <div className="space-y-1.5">
    <label className="text-sm font-medium" htmlFor={`report-filter-${filter}`}>{reportFilterLabel(report.id, filter)}</label>
    {searchable && <Input aria-label={`Search ${reportFilterLabel(report.id, filter)}`} value={search} placeholder="Find an option…" onChange={event => setSearch(event.target.value)} />}
    <select id={`report-filter-${filter}`} className={selectClass} value={value} onChange={event => onChange(event.target.value)} disabled={loading && !options.length}>
      <option value="">All</option>
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
    {loading && <p className="text-xs text-muted-foreground">Loading options…</p>}
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    {result.hasMore && <p className="text-xs text-muted-foreground">Type to narrow the first 25 matches.</p>}
  </div>
}
