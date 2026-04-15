"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function ViewDetailsModal({
  open,
  onOpenChange,
  title,
  data,
}: {
  open: boolean
  onOpenChange: (val: boolean) => void
  title: string
  data: { label: string; value: any }[]
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {data.map((item, index) => (
            <div key={index}>
              <p className="text-muted-foreground">{item.label}</p>

              {Array.isArray(item.value) ? (
                <div className="flex flex-wrap gap-2 mt-1">
                  {item.value.map((v, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-muted rounded"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="font-medium">{item.value}</p>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}