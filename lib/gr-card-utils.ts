import type { GRCardData } from "./types"

export const GR_CARD_PRINT_STORAGE_KEY = "hotel_gr_card_print_data"

export interface GRCardPrintPayload extends GRCardData {
    roomNo?: string
    passportNo?: string
    visaDetails?: string
    idProofType?: string
    idProofNumber?: string
    noOfNights?: number
    totalPax?: number
    netAmount?: number
    planTypeLabel?: string
}

export function mapCheckinToGRCard(form: Record<string, any>): GRCardPrintPayload {
    const formattedCheckIn = form.checkInDate
        ? `${form.checkInDate}T${form.checkInTime || "00:00"}`
        : ""
    const formattedCheckOut = form.checkOutDate
        ? `${form.checkOutDate}T${form.checkOutTime || "00:00"}`
        : ""

    return {
        bookingNo: form.bookingNo || form.reservationId || "",
        registerNo: form.registerNo || "",
        guestName: form.guestName || "",
        roomNumber: form.roomNumber || form.roomNo || "",
        roomNo: form.roomNo || form.roomNumber || "",
        roomType: form.roomType || "",
        planType: form.planTypeLabel || form.planType || "",
        tariff: Number(form.netAmount || form.planCharge || 0),
        totalAmount: Number(form.netAmount || 0),
        checkIn: formattedCheckIn,
        checkOut: formattedCheckOut,
        noOfPax: Number(form.totalPax || form.paxAdultMale || form.paxAdultFemale || form.paxChildren || 0),
        guestType: form.guestType || "",
        idProof: form.idProofType || "",
        idProofType: form.idProofType || "",
        idProofNumber: form.idProofNumber || "",
        nationality: form.nationality || "",
        address: form.address || "",
        email: form.email || "",
        mobileNo: form.mobile || "",
        company: form.company || "",
        dob: form.dob || "",
        arrivalFrom: form.arrivalFrom || "",
        departureTo: form.departureTo || "",
        purposeOfVisit: form.purposeOfVisit || "",
        adultMale: Number(form.paxAdultMale || 0),
        adultFemale: Number(form.paxAdultFemale || 0),
        children: Number(form.paxChildren || 0),
        noOfNights: Number(form.noOfNights || 0),
        totalPax: Number(form.totalPax || 0),
        netAmount: Number(form.netAmount || 0),
        passportNo: form.passportNo || "",
        visaDetails: form.visaDetails || "",
        hotel: {
            name: "",
            address: "",
            city: "",
            country: "",
            phone: "",
        },
    }
}

export function saveGRCardPrintData(form: Record<string, any>): void {
    const data = mapCheckinToGRCard(form)
    sessionStorage.setItem(GR_CARD_PRINT_STORAGE_KEY, JSON.stringify(data))
}

export function loadGRCardPrintData(): GRCardPrintPayload | null {
    if (typeof window === "undefined") return null
    const raw = sessionStorage.getItem(GR_CARD_PRINT_STORAGE_KEY)
    if (!raw) return null

    try {
        const data = JSON.parse(raw) as GRCardPrintPayload
        const roomNumber = data.roomNumber || data.roomNo || ""
        const roomNo = data.roomNo || data.roomNumber || ""
        return {
            ...data,
            roomNumber,
            roomNo,
            planType: data.planType || data.planTypeLabel || "",
        }
    } catch {
        return null
    }
}

export function clearGRCardPrintData(): void {
    if (typeof window === "undefined") return
    sessionStorage.removeItem(GR_CARD_PRINT_STORAGE_KEY)
}
