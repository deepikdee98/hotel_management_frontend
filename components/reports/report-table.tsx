"use client"
import { Button } from "@/components/ui/button"
import type { ReportColumn, ReportResult } from "@/services/api/reports.service"
import { formatReportValue, rowReportTimezone } from "./report-format"
export function ReportTable({ data, sort, order, onSort, onPage }: { data: ReportResult; sort?: string; order?: string; onSort: (key: string) => void; onPage: (page: number) => void }) {
  const columns: ReportColumn[] = data.report.columns
  const pages = Math.max(1, Math.ceil(data.total / data.limit))
  return <section className="overflow-hidden rounded-lg border bg-card" aria-label="Report results">
    <div className="max-h-[600px] overflow-auto"><table className="w-full text-sm"><thead className="sticky top-0 z-10 bg-muted"><tr>{columns.map(column => <th key={column.key} scope="col" aria-sort={sort === column.key ? order === "desc" ? "descending" : "ascending" : "none"} className={`whitespace-nowrap border-b px-4 py-3 ${["money", "number"].includes(column.type || "") ? "text-right" : "text-left"}`}><button className="rounded font-medium hover:text-primary focus-visible:outline focus-visible:outline-2" onClick={() => onSort(column.key)}>{column.label}{sort === column.key ? order === "desc" ? " ↓" : " ↑" : " ↕"}</button></th>)}</tr></thead><tbody>{data.rows.map((row, index) => <tr key={index} className="border-b last:border-0 hover:bg-muted/40">{columns.map(column => <td key={column.key} className={`px-4 py-3 ${["money", "number"].includes(column.type || "") ? "text-right tabular-nums whitespace-nowrap" : "min-w-28"}`}>{formatReportValue(row[column.key], column.type, data.meta.currency || (typeof row.currency === "string" ? row.currency : null), rowReportTimezone(row, data.meta))}</td>)}</tr>)}</tbody></table>
    {!data.rows.length && <div className="px-6 py-16 text-center"><p className="font-medium">No matching records</p><p className="mt-1 text-sm text-muted-foreground">Try another date range or clear the filters.</p></div>}</div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm"><span className="text-muted-foreground">{data.total.toLocaleString()} records · Page {data.page} of {pages}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={data.page <= 1} onClick={() => onPage(data.page - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={data.page >= pages} onClick={() => onPage(data.page + 1)}>Next</Button></div></div>
  </section>
}
