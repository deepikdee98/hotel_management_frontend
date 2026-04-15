"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function EditDetailsModal({
  open,
  onOpenChange,
  title,
  formData,
  setFormData,
  fields,
  onSubmit,
  children,
}: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-h-[80vh] overflow-hidden">
    
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
    </DialogHeader>

    <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
      {fields.map((field: any) => (
        <div key={field.name}>
          <label className="text-sm">{field.label}</label>

          <Input
            type={field.type || "text"}
            value={formData[field.name] || ""}
            disabled={field.disabled}
            onChange={(e) =>
              setFormData({
                ...formData,
                [field.name]:
                  field.type === "number"
                    ? Number(e.target.value)
                    : e.target.value,
              })
            }
          />
        </div>
      ))}

      {children}
    </div>

    <div className="flex justify-end gap-2 mt-4 border-t pt-3">
      <Button variant="outline" onClick={() => onOpenChange(false)}>
        Cancel
      </Button>

      <Button onClick={onSubmit}>Save</Button>
    </div>

  </DialogContent>
</Dialog>
  )
}