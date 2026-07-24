"use client"

import { useEffect, useState } from "react"
import { Building, ChevronDown } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { apiRequest } from "@/services/api/core"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Property {
  _id: string
  name: string
  city: string
}

export function PropertySwitcher() {
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [activeProperty, setActiveProperty] = useState<Property | null>(null)

  useEffect(() => {
    if (!user) return

    const canSwitch = user.role === "company-admin" && (user.propertyIds?.length || 0) > 1

    if (!canSwitch) {
      window.localStorage.removeItem("activePropertyId")
      setProperties([])
      setActiveProperty(null)
      return
    }

    async function loadProperties() {
      try {
        const res = await apiRequest<{ success: boolean; data: Property[] }>("/front-office/properties/list")
        if (res.success && res.data) {
          setProperties(res.data)
          
          const activeId = window.localStorage.getItem("activePropertyId") || user?.hotelId
          const active = res.data.find(p => String(p._id) === String(activeId)) || res.data[0]
          
          if (active) {
            setActiveProperty(active)
            if (!window.localStorage.getItem("activePropertyId")) {
              window.localStorage.setItem("activePropertyId", active._id)
            }
          }
        }
      } catch (err) {
        setProperties([])
        setActiveProperty(null)
      }
    }

    loadProperties()
  }, [user])

  const handleSwitch = (property: Property) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("activePropertyId", property._id)
      setActiveProperty(property)
      window.dispatchEvent(new CustomEvent("hotel:property-changed", {
        detail: { propertyId: property._id },
      }))
    }
  }

  if (!user || properties.length <= 1) return null

  return (
    <div className="px-3 py-2 border-b border-border bg-muted/40">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold rounded-md border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none">
          <div className="flex items-center gap-2 truncate">
            <Building className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-foreground">
              {activeProperty ? activeProperty.name : "Select Property"}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground ml-1" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 align-start bg-popover text-popover-foreground border border-border">
          {properties.map((prop) => (
            <DropdownMenuItem
              key={prop._id}
              onClick={() => handleSwitch(prop)}
              className={`flex items-center justify-between cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${
                activeProperty?._id === prop._id ? "font-bold text-primary" : ""
              }`}
            >
              <div className="flex flex-col truncate">
                <span className="truncate">{prop.name}</span>
                <span className="text-xs text-muted-foreground truncate">{prop.city}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
