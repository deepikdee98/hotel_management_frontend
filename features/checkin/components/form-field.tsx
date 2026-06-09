import type { ReactNode } from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type FormFieldProps = {
  label: string
  required?: boolean
  children: ReactNode
  className?: string
}

export function FormField({ label, required, children, className }: FormFieldProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}
