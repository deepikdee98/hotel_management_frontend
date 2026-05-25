"use client"

import { memo } from "react"
import { CheckCircle, Edit, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/common/status-badge"
import type { Reservation } from "@/lib/types"

type ReservationRow = Reservation & {
  bookingNumber?: string
  registerNo?: string
}

interface ReservationsTableProps {
  reservations: ReservationRow[]
  totalCount: number
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onStatusChange: (id: string, status: Reservation["status"]) => void
  onEdit: (reservation: ReservationRow) => void
  onCancel: (id: string) => void
}

export const ReservationsTable = memo(function ReservationsTable({
  reservations,
  totalCount,
  page,
  totalPages,
  onPageChange,
  onStatusChange,
  onEdit,
  onCancel,
}: ReservationsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Reservations</CardTitle>
        <CardDescription>{totalCount} reservations found</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reservation ID</TableHead>
              <TableHead>Guest</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.map((reservation) => (
              <TableRow key={reservation.id}>
                <TableCell className="font-medium">
                  {reservation.bookingNumber || reservation.registerNo || reservation.reservationId || "N/A"}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{reservation.guestName}</p>
                    <p className="text-sm text-muted-foreground">{reservation.guestPhone}</p>
                  </div>
                </TableCell>
                <TableCell>{reservation.roomNumber}</TableCell>
                <TableCell>{reservation.checkIn}</TableCell>
                <TableCell>{reservation.checkOut}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">${reservation.totalAmount}</p>
                    <p className="text-xs text-muted-foreground">Paid: ${reservation.paidAmount}</p>
                  </div>
                </TableCell>
                <TableCell><StatusBadge status={reservation.status} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {reservation.status === "confirmed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onStatusChange(reservation.id, "checked-in")}
                        className="gap-1 bg-transparent"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Check In
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => onEdit(reservation)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    {reservation.status === "confirmed" && (
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onCancel(reservation.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})
