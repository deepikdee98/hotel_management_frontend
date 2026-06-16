"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { SelectItem } from "@/components/ui/select"
import { createFrontOfficeReservation, getBookingNumberPreview, getFrontOfficeReservations, getFrontOfficeRooms, getSetupRoomTypes, getSetupRatePlans, updateFrontOfficeReservationStatus, updateFrontOfficeReservation } from "@/lib/backend-api"
import type { Reservation, Room } from "@/lib/types"
import EditDetailsModal from "@/components/common/EditDetailsModal"
import { useSetupOptions } from "@/hooks/use-setup-options"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { usePagination } from "@/hooks/use-pagination"
import { CreateReservationDialog } from "@/features/reservations/components/create-reservation-dialog"
import { ReservationFilters } from "@/features/reservations/components/reservation-filters"
import { ReservationsTable } from "@/features/reservations/components/reservations-table"

export default function ReservationPage() {
  const paymentModeOptions = useSetupOptions("paymentMode")
  const idProofOptions = useSetupOptions("idProof")
  const businessSourceOptions = useSetupOptions("businessSource")
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 250)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false)
  const [bookingPreview, setBookingPreview] = useState("Loading...")

  useEffect(() => {
    let cancelled = false
    getBookingNumberPreview()
      .then((preview) => {
        if (!cancelled) setBookingPreview(preview)
      })
      .catch(() => {
        if (!cancelled) setBookingPreview("Pending")
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (isNewReservationOpen) {
      setFormData(prev => ({ ...prev, adults: "", children: "", ratePlan: "" }));
    }
  }, [isNewReservationOpen]);

  const [reservations, setReservations] = useState<any[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomTypes, setRoomTypes] = useState<any[]>([])
  const [ratePlans, setRatePlans] = useState<any[]>([])
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editData, setEditData] = useState<any>({})

  const renderSetupItems = useCallback((options: { data: Array<{ _id: string; value: string }>; loading: boolean }) => {
    if (options.loading) return <SelectItem value="__loading__" disabled>Loading...</SelectItem>
    if (!options.data.length) return <SelectItem value="__empty__" disabled>No data available</SelectItem>
    return options.data.map((option) => <SelectItem key={option._id} value={option.value}>{option.value}</SelectItem>)
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const [reservationData, roomData, roomTypeData, ratePlanData] = await Promise.all([
          getFrontOfficeReservations(),
          getFrontOfficeRooms(),
          getSetupRoomTypes(),
          getSetupRatePlans(),
        ])
        const formatted = reservationData.map((r: Reservation) => ({
          id: r.id,
          reservationId: r.reservationId,
          bookingNumber: r.bookingNumber,
          guestName: r.guestName,
          guestPhone: r.guestPhone,
          guestEmail: r.guestEmail,
          roomNumber: r.roomNumber,
          checkIn: r.checkIn,
          checkOut: r.checkOut,
          totalAmount: r.totalAmount,
          paidAmount: r.paidAmount,
          status: r.status,
          extraBeds: r.extraBeds || 0,
        }))

        setReservations(formatted)
        setRooms(roomData)
        setRoomTypes(roomTypeData)
        setRatePlans(ratePlanData)
      } catch {
        setReservations([])
        setRooms([])
        setRoomTypes([])
        setRatePlans([])
      }
    }

    load()
  }, [])

  // Form state for new reservation
  const [formData, setFormData] = useState({
    guestName: "",
    phone: "",
    email: "",
    idProofType: "",
    idProofNumber: "",
    checkInDate: "",
    checkOutDate: "",
    adults: "",
    children: "",
    roomType: "",
    roomNumber: "",
    ratePlan: "",
    bookingSource: "",
    advanceAmount: "",
    paymentMode: "",
    specialRequests: "",
    extraBeds: "0",
  })

  type TabType = "guest" | "booking" | "payment";
  const [activeTab, setActiveTab] = useState<TabType>("guest");
  const tabOrder = ["guest", "booking", "payment"] as const;
  const currentTabIndex = tabOrder.indexOf(activeTab);

  const validateGuestTab = () => formData.guestName.trim() && formData.phone.trim();
  const validateBookingTab = () => formData.checkInDate && formData.checkOutDate && formData.roomNumber !== "";
  const validatePaymentTab = () => true;

  const validateCurrentTab = () => {
    switch (activeTab) {
      case "guest": return validateGuestTab();
      case "booking": return validateBookingTab();
      case "payment": return validatePaymentTab();
      default: return false;
    }
  };

  const handleNextTab = () => {
    if (validateCurrentTab()) {
      const nextIndex = Math.min(currentTabIndex + 1, tabOrder.length - 1);
      setActiveTab(tabOrder[nextIndex]);
    } else {
      toast({
        title: "Validation Error",
        description: "Please fill required fields before continuing",
        variant: "destructive",
      });
    }
  };

  const handlePrevTab = () => {
    const prevIndex = Math.max(currentTabIndex - 1, 0);
    setActiveTab(tabOrder[prevIndex]);
  };

  const filteredReservations = useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase()
    return reservations.filter((reservation) => {
      const matchesSearch =
        !query ||
        reservation.guestName.toLowerCase().includes(query) ||
        reservation.roomNumber.toLowerCase().includes(query) ||
        (reservation.reservationId || "").toLowerCase().includes(query)
      const matchesStatus = statusFilter === "all" || reservation.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [debouncedSearchQuery, reservations, statusFilter])

  const reservationPagination = usePagination(filteredReservations, 10)

  const availableRooms = useMemo(() => rooms.filter((room) => room.status === "available"), [rooms])
  const paginatedReservations = reservationPagination.paginatedItems

  const estimates = useMemo(() => {
    if (!formData.checkInDate || !formData.checkOutDate) return { roomCharges: 0, taxes: 0, total: 0 }

    const checkIn = new Date(formData.checkInDate)
    const checkOut = new Date(formData.checkOutDate)
    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)))

    let baseRate = 0
    const selectedRoomType = roomTypes.find(t => (t._id || t.id) === formData.roomType)
    if (selectedRoomType) {
      const room = rooms.find(r => r.number === formData.roomNumber || r.id === formData.roomNumber)
      const acType = room?.acType || "NON_AC"
      let roomRate = 0
      let extraBedRate = 0
      if (acType === "AC") {
        roomRate = typeof selectedRoomType.acRate === "number" && selectedRoomType.acRate > 0 ? selectedRoomType.acRate : (room?.price || selectedRoomType.baseRate || 0)
        extraBedRate = typeof selectedRoomType.extraBedAcRate === "number" ? selectedRoomType.extraBedAcRate : 0
      } else {
        roomRate = typeof selectedRoomType.nonAcRate === "number" && selectedRoomType.nonAcRate > 0 ? selectedRoomType.nonAcRate : (room?.price || selectedRoomType.baseRate || 0)
        extraBedRate = typeof selectedRoomType.extraBedNonAcRate === "number" ? selectedRoomType.extraBedNonAcRate : 0
      }
      baseRate = roomRate + (Number(formData.extraBeds || 0) * extraBedRate)
    }

    // Apply rate plan logic if applicable
    const selectedRatePlan = ratePlans.find(p => (p._id || p.id) === formData.ratePlan)
    let rateModifier = 1
    if (selectedRatePlan) {
      if (selectedRatePlan.type === "percentage") {
        rateModifier = 1 + (selectedRatePlan.value / 100)
      } else if (selectedRatePlan.type === "fixed") {
        baseRate = selectedRatePlan.value
      }
    }

    const roomCharges = nights * baseRate * rateModifier
    const taxes = roomCharges * 0.12 // 12% tax
    const total = roomCharges + taxes

    return { roomCharges, taxes, total }
  }, [formData.checkInDate, formData.checkOutDate, formData.ratePlan, formData.roomType, formData.roomNumber, formData.extraBeds, ratePlans, roomTypes, rooms])

  const handleFormChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleSaveReservation = async () => {
    try {
      let selectedRoomId = ""

      if (formData.roomNumber === "auto") {
        const autoRoom = availableRooms.find(r => r.roomTypeId === formData.roomType)
        if (autoRoom) {
          selectedRoomId = autoRoom.id
        } else {
          const roomTypeObj = roomTypes.find(t => (t._id || t.id) === formData.roomType)
          toast({
            title: "No Rooms Available",
            description: `No available rooms found for type: ${roomTypeObj?.name || formData.roomType}`,
            variant: "destructive",
          })
          return
        }
      } else {
        const manualRoom = rooms.find((room) => room.number === formData.roomNumber)
        if (manualRoom) {
          selectedRoomId = manualRoom.id
        }
      }

      if (selectedRoomId) {
        await createFrontOfficeReservation({
          guestName: formData.guestName,
          phone: formData.phone,
          email: formData.email,
          idProofType: formData.idProofType,
          idProofNumber: formData.idProofNumber,
          checkInDate: formData.checkInDate,
          checkOutDate: formData.checkOutDate,
          adults: Number(formData.adults),
          children: Number(formData.children),
          roomType: formData.roomType,
          room: selectedRoomId,
          ratePlan: formData.ratePlan,
          bookingSource: formData.bookingSource,
          advanceAmount: Number(formData.advanceAmount || 0),
          paymentMode: formData.paymentMode,
          totalAmount: estimates.total,
          extraBeds: Number(formData.extraBeds || 0),
        })

        const refreshed = await getFrontOfficeReservations()
        const formatted = refreshed.map((r: Reservation) => ({
          id: r.id,
          reservationId: r.reservationId,
          bookingNumber: r.bookingNumber,
          guestName: r.guestName,
          guestPhone: r.guestPhone,
          guestEmail: r.guestEmail,
          roomNumber: r.roomNumber,
          checkIn: r.checkIn,
          checkOut: r.checkOut,
          totalAmount: r.totalAmount,
          paidAmount: r.paidAmount,
          status: r.status,
          extraBeds: r.extraBeds || 0,
        }))

        setReservations(formatted)

        toast({
          title: "Success",
          description: "Reservation created successfully",
        })

        setIsNewReservationOpen(false)
        setFormData({
          guestName: "",
          phone: "",
          email: "",
          idProofType: "",
          idProofNumber: "",
          checkInDate: "",
          checkOutDate: "",
          adults: "",
          children: "",
          roomType: "",
          roomNumber: "",
          ratePlan: "",
          bookingSource: "",
          advanceAmount: "",
          paymentMode: "",
          specialRequests: "",
          extraBeds: "0",
        })
      } else {
        toast({
          title: "Selection Error",
          description: "Please select a room or use auto-assign",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: error.message || "An error occurred while creating the reservation",
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = async (id: string, newStatus: Reservation["status"]) => {
    try {
      const reservation = reservations.find(r => String(r.id) === String(id))
      if (newStatus === "checked-out") {
        if (reservation && reservation.paidAmount < reservation.totalAmount) {
          alert("Please clear pending payment before checkout")
          return
        }
      }
      await updateFrontOfficeReservationStatus(id, newStatus)
      const refreshed = await getFrontOfficeReservations()
      setReservations(refreshed)
      alert(`Reservation ${newStatus} successfully`)

    } catch (error) {
      console.error("Status update failed:", error)
    }
  }

  const handleDeleteReservation = async (id: string) => {
    try {
      const confirmDelete = confirm("Are you sure you want to cancel this reservation?")
      if (!confirmDelete) return

      await updateFrontOfficeReservationStatus(id, "cancelled")

      const refreshed = await getFrontOfficeReservations()
      setReservations(refreshed)

      alert("Reservation cancelled successfully")

    } catch (error) {
      console.error("Delete failed:", error)
    }
  }

  const handleUpdateReservation = async () => {
    try {
      if (!editData?.id) return

      // Map back to backend field names
      const payload = {
        guestName: editData.guestName,
        phone: editData.guestPhone,
        email: editData.guestEmail,
        roomNumber: editData.roomNumber,
        checkInDate: editData.checkIn,
        checkOutDate: editData.checkOut,
        totalAmount: editData.totalAmount,
        advanceAmount: editData.paidAmount,
        extraBeds: Number(editData.extraBeds || 0),
      }

      await updateFrontOfficeReservation(editData.id, payload)

      const refreshed = await getFrontOfficeReservations()
      const formatted = refreshed.map((r: Reservation) => ({
        id: r.id,
        reservationId: r.reservationId,
        bookingNumber: r.bookingNumber,
        guestName: r.guestName,
        guestPhone: r.guestPhone,
        guestEmail: r.guestEmail,
        roomNumber: r.roomNumber,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        totalAmount: r.totalAmount,
        paidAmount: r.paidAmount,
        status: r.status,
        extraBeds: r.extraBeds || 0,
      }))

      setReservations(formatted)
      setIsEditOpen(false)

      toast({
        title: "Success",
        description: "Reservation updated successfully",
      })
    } catch (error: any) {
      console.error("Update failed:", error)
      toast({
        title: "Update Failed",
        description: error.message || "An error occurred while updating the reservation",
        variant: "destructive",
      })
    }
  }

  const editFields = [
    { name: "guestName", label: "Guest Name" },
    { name: "guestPhone", label: "Phone" },
    { name: "guestEmail", label: "Email" },
    { name: "roomNumber", label: "Room Number" },
    { name: "checkIn", label: "Check-in", type: "date" },
    { name: "checkOut", label: "Check-out", type: "date" },
    { name: "extraBeds", label: "Extra Beds", type: "number" },
  ]

  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reservations</h1>
            <p className="text-muted-foreground">Create and manage hotel bookings</p>
          </div>
          <Badge variant="outline" className="w-fit text-xs font-semibold">Booking ID: {bookingPreview}</Badge>
          <CreateReservationDialog
            open={isNewReservationOpen}
            bookingPreview={bookingPreview}
            activeTab={activeTab}
            currentTabIndex={currentTabIndex}
            formData={formData}
            idProofOptions={idProofOptions}
            businessSourceOptions={businessSourceOptions}
            paymentModeOptions={paymentModeOptions}
            roomTypes={roomTypes}
            ratePlans={ratePlans}
            availableRooms={availableRooms}
            estimates={estimates}
            onOpenChange={setIsNewReservationOpen}
            onTabChange={setActiveTab}
            onFormChange={handleFormChange}
            onPrevious={handlePrevTab}
            onNext={handleNextTab}
            onSave={handleSaveReservation}
            canContinue={Boolean(validateCurrentTab())}
            renderSetupItems={renderSetupItems}
          />
        </div>

        <ReservationFilters
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          onSearchChange={setSearchQuery}
          onStatusChange={setStatusFilter}
        />

        <ReservationsTable
          reservations={paginatedReservations}
          totalCount={filteredReservations.length}
          page={reservationPagination.page}
          totalPages={reservationPagination.totalPages}
          onPageChange={reservationPagination.setPage}
          onStatusChange={handleStatusChange}
          onEdit={(reservation) => {
            setEditData(reservation)
            setIsEditOpen(true)
          }}
          onCancel={handleDeleteReservation}
        />
        <EditDetailsModal
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          title="Edit Reservation"
          formData={editData}
          setFormData={setEditData}
          fields={editFields}
          onSubmit={handleUpdateReservation}
        />
      </div>
    </DashboardLayout>
  )
}
