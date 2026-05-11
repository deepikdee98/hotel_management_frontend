"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BedDouble, ArrowUpRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"
import { getFrontOfficeRooms } from "@/lib/backend-api"
import { Room } from "@/lib/types"

const statusLabels: Record<Room["status"], string> = {
  available: "Available",
  occupied: "Occupied",
  reserved: "Reserved",
  maintenance: "Maintenance",
  cleaning: "Cleaning",
}

const statusColors: Record<Room["status"], string> = {
  available: "#10B981",
  occupied: "#3B82F6",
  reserved: "#F59E0B",
  maintenance: "#6B7280",
  cleaning: "#8B5CF6",
}

const getStatusImage = (status: Room["status"], roomNumber: string) => {
  const color = statusColors[status] || "#9CA3AF"
  const label = statusLabels[status] || status
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='160' viewBox='0 0 240 160'>
    <rect x='8' y='8' width='224' height='144' rx='20' fill='${color}' fill-opacity='0.15' stroke='${color}' stroke-width='4' />
    <rect x='24' y='32' width='80' height='48' rx='12' fill='${color}' />
    <rect x='118' y='32' width='98' height='48' rx='12' fill='#FFFFFF' fill-opacity='0.92' />
    <text x='64' y='26' text-anchor='middle' font-family='Inter, sans-serif' font-size='24' fill='${color}' font-weight='700'>Room</text>
    <text x='64' y='60' text-anchor='middle' font-family='Inter, sans-serif' font-size='36' fill='#FFFFFF' font-weight='700'>${roomNumber}</text>
    <text x='175' y='80' text-anchor='middle' font-family='Inter, sans-serif' font-size='18' fill='${color}' font-weight='700'>${label}</text>
    <circle cx='175' cy='115' r='16' fill='${color}' />
    <text x='175' y='120' text-anchor='middle' font-family='Inter, sans-serif' font-size='12' fill='#FFFFFF' font-weight='700'>${label[0]}</text>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export default function RoomDashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const data = await getFrontOfficeRooms()
        setRooms(data)
      } catch (error) {
        console.error("Failed to load room dashboard", error)
        setRooms([])
      } finally {
        setLoading(false)
      }
    }

    loadRooms()
  }, [])

  const roomCounts = rooms.reduce(
    (acc, room) => {
      acc[room.status] = (acc[room.status] || 0) + 1
      return acc
    },
    {} as Record<Room["status"], number>
  )

  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Room Dashboard</h1>
            <p className="text-muted-foreground">
              Visual room status overview with a status image for every room.
            </p>
          </div>
          <Button variant="outline" className="w-full md:w-auto" asChild>
            <Link href="/admin/front-office">
              <span className="flex items-center gap-2">
                <BedDouble className="h-4 w-4" />
                Back to Front Office
              </span>
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(statusLabels).map(([status, label]) => (
            <Card key={status} className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase">{label}</p>
                    <p className="text-3xl font-semibold text-foreground">{roomCounts[status as Room["status"]] || 0}</p>
                  </div>
                  <div
                    className="h-10 w-10 rounded-xl"
                    style={{ backgroundColor: statusColors[status as Room["status"]] }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {loading ? (
            <Card className="col-span-full bg-card border-border">
              <CardContent className="text-center text-muted-foreground">Loading rooms...</CardContent>
            </Card>
          ) : rooms.length === 0 ? (
            <Card className="col-span-full bg-card border-border">
              <CardContent className="text-center text-muted-foreground">
                No rooms available to display.
              </CardContent>
            </Card>
          ) : (
            rooms.map((room) => (
              <Card key={room.id} className="bg-card border-border">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">Room {room.number}</CardTitle>
                      <p className="text-sm text-muted-foreground">{room.type}</p>
                    </div>
                    <Badge className="capitalize" style={{ backgroundColor: statusColors[room.status], color: "white" }}>
                      {statusLabels[room.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* <img
                    src={getStatusImage(room.status, room.number)}
                    alt={`${statusLabels[room.status]} room status image`}
                    className="w-full rounded-3xl border border-border bg-muted object-cover"
                  /> */}
                  <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                    <div className="rounded-xl border border-border p-3">
                      <p className="text-xs uppercase tracking-[0.12em]">Status</p>
                      <p className="mt-1 font-medium text-foreground capitalize">{room.status}</p>
                    </div>
                    <div className="rounded-xl border border-border p-3">
                      <p className="text-xs uppercase tracking-[0.12em]">Housekeeping</p>
                      <p className="mt-1 font-medium text-foreground capitalize">{room.hkStatus || "N/A"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
