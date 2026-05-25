import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const statusStyles: Record<string, string> = {
  confirmed: "bg-primary/10 text-primary border-primary/20",
  "checked-in": "bg-success/10 text-success border-success/20",
  "checked-out": "bg-muted text-muted-foreground border-muted",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  available: "bg-success/10 text-success border-success/20",
  occupied: "bg-amber-100 text-amber-700 border-amber-200",
  maintenance: "bg-destructive/10 text-destructive border-destructive/20",
}

function normalizeStatus(status: string) {
  return status.trim().toLowerCase().replace(/[\s_]+/g, "-")
}

function formatStatus(status: string) {
  return normalizeStatus(status)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const normalizedStatus = normalizeStatus(status)

  return (
    <Badge variant="outline" className={cn(statusStyles[normalizedStatus] || "", className)}>
      {formatStatus(status)}
    </Badge>
  )
}
