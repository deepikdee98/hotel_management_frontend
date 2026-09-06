"use client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { ReportCatalog, ReportDefinition, ReportQuery } from "@/services/api/reports.service"
export const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
import { reportFilterLabel } from "./report-format"
import { ReportFilterOptions } from "./report-filter-options"
export function ReportFilters({ catalog, report, query, onChange, search, onSearch }: { catalog: ReportCatalog; report: ReportDefinition; query: ReportQuery; onChange: (query: ReportQuery) => void; search: string; onSearch: (value: string) => void }) {
 const change = (patch: Partial<ReportQuery>) => onChange({ ...query, ...patch, page: 1 })
 return <section aria-label="Report filters" className="space-y-4 rounded-lg border bg-card p-4">
  <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold">Filters</h2><Button size="sm" variant="ghost" onClick={() => { onSearch(""); change({ filters: {}, search: "" }) }} disabled={!search && !Object.values(query.filters).some(Boolean)}>Clear search & filters</Button></div>
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
   <label className="space-y-1.5 text-sm font-medium">Date range<select className={selectClass} value={query.preset} onChange={e => change({ preset: e.target.value })}>{[["today", "Today"], ["yesterday", "Yesterday"], ["this-week", "This week"], ["this-month", "This month"], ["last-month", "Last month"], ["custom", "Custom range"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
   {query.preset === "custom" && <><label className="space-y-1.5 text-sm font-medium">From<Input type="date" value={query.startDate || ""} max={query.endDate} onChange={e => change({ startDate: e.target.value })} /></label><label className="space-y-1.5 text-sm font-medium">Through<Input type="date" value={query.endDate || ""} min={query.startDate} onChange={e => change({ endDate: e.target.value })} /></label></>}
   <label className="space-y-1.5 text-sm font-medium">Search records<Input type="search" value={search} placeholder="Search this report…" onChange={e => onSearch(e.target.value)} /></label>
   <label className="space-y-1.5 text-sm font-medium">Rows per page<select className={selectClass} value={query.limit} onChange={e => change({ limit: Number(e.target.value) })}>{[25, 50, 100].map(value => <option key={value}>{value}</option>)}</select></label>
  </div>
  {catalog.properties.length > 0 && <fieldset><legend className="mb-2 text-sm font-medium">Properties{catalog.canMultiProperty ? " · Select one or more" : ""}</legend><div className="flex flex-wrap gap-2">{catalog.properties.map(property => <label key={property.id} className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${query.propertyIds.includes(property.id) ? "border-primary bg-primary/5" : ""}`}><input type={catalog.canMultiProperty ? "checkbox" : "radio"} name="report-property" checked={query.propertyIds.includes(property.id)} onChange={e => change({ propertyIds: catalog.canMultiProperty ? e.target.checked ? [...query.propertyIds, property.id] : query.propertyIds.filter(id => id !== property.id) : [property.id] })} />{property.name}</label>)}</div></fieldset>}
  {!!report.filters.length && <div className="grid gap-3 border-t pt-4 sm:grid-cols-2 xl:grid-cols-4">{report.filters.map(key => key === "bookingId"
    ? <label key={key} className="space-y-1.5 text-sm font-medium">{reportFilterLabel(report.id, key)}<Input value={query.filters[key] || ""} placeholder="All" onChange={e => change({ filters: { ...query.filters, [key]: e.target.value } })} /></label>
    : <ReportFilterOptions key={key} report={report} filter={key} propertyIds={query.propertyIds} value={query.filters[key] || ""} onChange={value => change({ filters: { ...query.filters, [key]: value } })} />)}</div>}
 </section>
}
