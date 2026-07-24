"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { DoorOpen, Printer, Pencil, Loader2, Star, CheckCircle2, X, AlertCircle, ArrowRight } from "lucide-react"
import { getInHouseGuests, getFolioDetails, createCheckOut, getSetupRoomTypes, getSetupRatePlans, getSetupOptions, downloadCheckoutInvoice, undoCheckOut } from "@/lib/backend-api"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RotateCcw } from "lucide-react"

const CHECKOUT_SUCCESS_STORAGE_KEY = "front_office_checkout_success"
const CHECKOUT_SUCCESS_EVENT = "front-office:checkout-success"

const getStoredCheckoutResult = () => {
  if (typeof window === "undefined") return null
  const storedResult = window.sessionStorage.getItem(CHECKOUT_SUCCESS_STORAGE_KEY)
  if (!storedResult) return null

  try {
    return JSON.parse(storedResult)
  } catch {
    window.sessionStorage.removeItem(CHECKOUT_SUCCESS_STORAGE_KEY)
    return null
  }
}

export default function CheckOutPage() {
  const router = useRouter()
  const GST_PERCENT = 12
  const toNum = (value: any) => {
    const numericValue = Number(value)
    return Number.isFinite(numericValue) ? numericValue : 0
  }
  const toNonNegativeNum = (value: any) => Math.max(0, toNum(value))
  const numberInputValue = (value: number) => value === 0 || isNaN(value) ? "" : value
  const money = (value: number) => `₹${toNum(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const roundMoney = (value: number) => Math.round(toNum(value) * 100) / 100
  const moneyEquals = (a: number, b: number) => Math.round(toNum(a) * 100) === Math.round(toNum(b) * 100)
  const MS_PER_DAY = 1000 * 60 * 60 * 24
  const parseDate = (value: any) => {
    if (!value) return null
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }
  const toDateOnly = (value: any) => {
    const date = parseDate(value)
    if (!date) return null
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
  }
  const calculateStayedNights = (checkInValue: any, checkoutValue: any = new Date()) => {
    const checkInDate = toDateOnly(checkInValue)
    const checkoutDate = toDateOnly(checkoutValue)
    if (!checkInDate || !checkoutDate) return 0
    return Math.max(1, Math.ceil(Math.max(0, checkoutDate.getTime() - checkInDate.getTime()) / MS_PER_DAY))
  }
  const [selectedRoom, setSelectedRoom] = useState("")
  const [billingType, setBillingType] = useState("full")
  const [inHouseGuests, setInHouseGuests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [folioData, setFolioData] = useState<any>(null)
  const [fetchingFolio, setFetchingFolio] = useState(false)
  const [processingCheckout, setProcessingCheckout] = useState(false)
  const [roomTypes, setRoomTypes] = useState<any[]>([])
  const [ratePlans, setRatePlans] = useState<any[]>([])
  const [checkoutResult, setCheckoutResult] = useState<any>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [downloadingBills, setDownloadingBills] = useState(false)
  const [isUndoDialogOpen, setIsUndoDialogOpen] = useState(false)
  const [undoing, setUndoing] = useState(false)

  const getGuestRoomNumber = (guest: any) => {
    return String(guest?.roomNumber ?? guest?.room?.roomNumber ?? guest?.room?.number ?? guest?.room?.roomNo ?? "").trim()
  }

  const getGuestDisplayName = (guest: any) => {
    return String(guest?.guestName ?? guest?.name ?? "").trim()
  }

  const getGuestFolioNumber = (guest: any) => {
    return String(guest?.folioNumber ?? guest?.folio?.folioNumber ?? "").trim()
  }

  const getGuestCheckinId = (guest: any) => {
    return String(guest?.checkinId ?? guest?.checkInId ?? guest?.id ?? "").trim()
  }

  const getGuestFolioId = (guest: any) => {
    return String(guest?.folioId ?? guest?.folio?._id ?? guest?.folio?.id ?? "").trim()
  }

  const getGuestBookingId = (guest: any) => {
    return String(guest?.bookingNumber ?? guest?.bookingNo ?? guest?.bookingId ?? guest?.reservationId ?? "").trim()
  }

  const isPaxGuest = (guest: any) => {
    return String(guest?.guestType || guest?.type || "").toLowerCase().includes("pax") || Boolean(guest?.isPax)
  }

  const buildSplitRowsForRoom = (roomNumber: string) => {
    const roomGuests = inHouseGuests
      .filter((guest) => getGuestRoomNumber(guest) === String(roomNumber).trim())
      .sort((a, b) => Number(isPaxGuest(a)) - Number(isPaxGuest(b)))

    const names = Array.from(
      new Set(roomGuests.map(getGuestDisplayName).filter(Boolean))
    )

    return (names.length ? names : ["Guest 1"]).map((name) => ({ name, amount: 0, mode: "cash" }))
  }

  // Extra checkout fields
  const [keyCardsReturned, setKeyCardsReturned] = useState(1)
  const [minibarChecked, setMinibarChecked] = useState(true)
  const [minibarCharges, setMinibarCharges] = useState(0)
  const [roomInspected, setRoomInspected] = useState(true)
  const [damageCharges, setDamageCharges] = useState(0)
  const [rating, setRating] = useState(5)
  const [comments, setComments] = useState("")
  const [paymentMode, setPaymentMode] = useState("cash")
  const [amountPaid, setAmountPaid] = useState(0)
  const [amountPaidEdited, setAmountPaidEdited] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [extraManualCharges, setExtraManualCharges] = useState(0)
  const [lateCheckoutHours, setLateCheckoutHours] = useState(0)
  const [lateCheckoutCharges, setLateCheckoutCharges] = useState(0)
  const [roomStatus, setRoomStatus] = useState("dirty")
  const [splitAllocations, setSplitAllocations] = useState([{ name: "Guest 1", amount: 0, mode: "cash" }])
  const [companyOptions, setCompanyOptions] = useState<any[]>([])
  const [companyId, setCompanyId] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [companyGstin, setCompanyGstin] = useState("")
  const [companyBillingAddress, setCompanyBillingAddress] = useState("")

  const [settlementMethod, setSettlementMethod] = useState("cash")
  const [isSettled, setIsSettled] = useState(false)
  const [refundSettled, setRefundSettled] = useState(false)
  const [isSettling, setIsSettling] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    const restoreCheckoutSuccess = () => {
      const storedResult = getStoredCheckoutResult()
      if (!storedResult) return
      setCheckoutResult(storedResult)
      setShowSuccess(true)
    }

    restoreCheckoutSuccess()
    window.addEventListener(CHECKOUT_SUCCESS_EVENT, restoreCheckoutSuccess)
    return () => window.removeEventListener(CHECKOUT_SUCCESS_EVENT, restoreCheckoutSuccess)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const roomNumber = params.get("room")?.trim() || ""
    const checkinId = params.get("checkinId")?.trim() || ""
    const folioId = params.get("folioId")?.trim() || ""
    const bookingId = params.get("bookingId")?.trim() || ""
    if ((!roomNumber && !checkinId && !folioId && !bookingId) || loading || !inHouseGuests.length || selectedRoom) return

    const guest = inHouseGuests.find((g) =>
      (checkinId && getGuestCheckinId(g) === checkinId) ||
      (folioId && getGuestFolioId(g) === folioId) ||
      (bookingId && getGuestBookingId(g) === bookingId) ||
      (roomNumber && getGuestRoomNumber(g) === roomNumber)
    )
    if (guest) {
      handleRoomChange(getGuestRoomNumber(guest), guest)
    }
  }, [loading, inHouseGuests, selectedRoom])

  const handleEditCheckIn = () => {
    if (!room) return
    const bookingId = room.id || room.reservationId || room.folioId
    if (!bookingId) return
    router.push(`/admin/front-office/reception/check-in?id=${encodeURIComponent(String(bookingId))}&mode=edit`)
  }

  const addSplitPayer = () => {
    setSplitAllocations((prev) => [...prev, { name: `Guest ${prev.length + 1}`, amount: 0, mode: "cash" }])
  }

  const removeSplitPayer = (index: number) => {
    setSplitAllocations((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== index)))
  }

  const updateSplitPayer = (index: number, key: "name" | "amount" | "mode", value: string | number) => {
    setSplitAllocations((prev) => prev.map((row, idx) => (idx === index ? { ...row, [key]: value } : row)))
  }

  const distributeEvenly = () => {
    if (splitAllocations.length === 0) return
    const share = roundMoney(finalAmount / splitAllocations.length)
    setSplitAllocations((prev) => prev.map((a, i) => ({
      ...a,
      amount: i === prev.length - 1 
        ? roundMoney(finalAmount - (share * (prev.length - 1)))
        : share
    })))
  }

  const autoFillLast = () => {
    if (splitAllocations.length === 0) return
    setSplitAllocations((prev) => {
      const currentTotalExceptLast = prev
        .slice(0, -1)
        .reduce((sum, row) => sum + toNonNegativeNum(row.amount), 0)
      
      return prev.map((a, i) => i === prev.length - 1 
        ? { ...a, amount: roundMoney(finalAmount - currentTotalExceptLast) }
        : a
      )
    })
  }

  const isSplitBillingValid = () => {
    if (billingType !== "split") return true
    if (splitAllocations.length === 0) return false
    const hasInvalidRow = splitAllocations.some((row) => !row.name?.trim() || toNonNegativeNum(row.amount) <= 0 || !row.mode)
    if (hasInvalidRow) return false
    // Use a small tolerance of 1.0 for manual split calculation
    return Math.abs(totalSplit - finalAmount) <= 1.0
  }

  const handleCompanyChange = (value: string) => {
    setCompanyId(value)
    const selected = companyOptions.find((item) => String(item._id || item.id || item.value || "") === value)
    if (!selected) return
    setCompanyName(String(selected.value || selected.name || ""))
    setCompanyGstin(String(selected.gstin || selected.taxId || ""))
    setCompanyBillingAddress(String(selected.address || selected.billingAddress || ""))
  }

  async function fetchInitialData() {
    setLoading(true)
    try {
      const [guestsRes, roomTypesRes, ratePlansRes, companyRes] = await Promise.all([
        getInHouseGuests(),
        getSetupRoomTypes(),
        getSetupRatePlans(),
        getSetupOptions("company").catch(() => [])
      ])

      if (guestsRes.success) {
        setInHouseGuests(guestsRes.data.guests || [])
      }
      setRoomTypes(roomTypesRes)
      setRatePlans(ratePlansRes)
      setCompanyOptions(Array.isArray(companyRes) ? companyRes : [])
    } catch (error) {
      console.error("Failed to fetch initial data:", error)
      toast.error("Failed to load initial data")
    } finally {
      setLoading(false)
    }
  }

  async function fetchInHouseGuests() {
    try {
      const response = await getInHouseGuests()
      if (response.success) {
        const guests = response.data.guests || []
        setInHouseGuests(guests)
        return guests
      }
    } catch (error) {
      console.error("Failed to fetch in-house guests:", error)
      toast.error("Failed to load in-house guests")
    }
    return []
  }

  const handleRoomChange = async (roomNumber: string, selectedGuest?: any) => {
    setShowSuccess(false)
    setCheckoutResult(null)
    window.sessionStorage.removeItem(CHECKOUT_SUCCESS_STORAGE_KEY)
    setSelectedRoom(roomNumber)
    setFolioData(null)
    setAmountPaid(0)
    setAmountPaidEdited(false)
    setIsSettled(false)
    setRefundSettled(false)
    setSplitAllocations(buildSplitRowsForRoom(roomNumber))
    const normalizedRoomNumber = String(roomNumber).trim()
    const roomGuests = inHouseGuests.filter(g => getGuestRoomNumber(g) === normalizedRoomNumber)
    const guest = selectedGuest && !isPaxGuest(selectedGuest)
      ? selectedGuest
      : roomGuests.find(g => !isPaxGuest(g)) || selectedGuest || roomGuests[0]
    const folioId = getGuestFolioId(guest) || getGuestCheckinId(guest)
    if (guest && folioId) {
      setFetchingFolio(true)
      try {
        const response = await getFolioDetails(folioId)
        if (response.success) {
          setFolioData(response.data.folio || response.data)
        }
      } catch (error) {
        console.error("Failed to fetch folio details:", error)
        toast.error("Failed to load billing details")
      } finally {
        setFetchingFolio(false)
      }
    }
  }

  const handleSettle = async () => {
    setIsSettling(true)
    // Simulate settlement process
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      if (balance > 0) {
        setIsSettled(true)
        toast.success(`Payment of ${money(balance)} collected via ${settlementMethod.toUpperCase()}`)
      } else if (refund > 0) {
        setRefundSettled(true)
        toast.success(`Refund of ${money(refund)} processed via ${settlementMethod.toUpperCase()}`)
      } else {
        setIsSettled(true)
        toast.success("Billing settled")
      }
    } catch (err) {
      toast.error("Settlement failed")
    } finally {
      setIsSettling(false)
    }
  }

  const handleCheckout = async () => {
    if (!selectedRoom || !folioData) return
    if (!minibarChecked) {
      toast.error("Please confirm minibar check before checkout")
      return
    }
    if (!roomInspected) {
      toast.error("Please complete room inspection before checkout")
      return
    }
    if (billingType === "full" && balance > 0.001 && !isSettled) {
      toast.error("Pending payment settlement. Please collect balance before checkout.")
      return
    }
    if (billingType === "full" && refund > 0.001 && !refundSettled) {
      toast.error("Refund settlement pending. Please process refund before checkout.")
      return
    }
    if (billingType === "split" && !isSplitBillingValid()) {
      toast.error("Split allocation must equal final payable amount")
      return
    }
    if (billingType === "company" && (!companyId || !companyName)) {
      toast.error("Please select company details for company billing")
      return
    }

    setProcessingCheckout(true)
    try {
      const guest = inHouseGuests.find(g => getGuestRoomNumber(g) === String(selectedRoom).trim())
      if (!guest) {
        toast.error("Selected room details were not found")
        return
      }
      const payload = {
        folioId: guest.folioId || guest.id,
        billingType,
        actualCheckOutTime: new Date().toISOString(),

        splitBilling:
          billingType === "split"
            ? splitAllocations.map((row) => ({
              name: row.name,
              amount: toNonNegativeNum(row.amount),
              mode: row.mode,
            }))
            : undefined,

        companyBilling:
          billingType === "company"
            ? {
              companyId,
              companyName,
              gstin: companyGstin,
              billingAddress: companyBillingAddress,
            }
            : undefined,

        payment:
          billingType === "full"
            ? {
              mode: paymentMode,
              amountPaid,
            }
            : undefined,

        validations: {
          minibarChecked,
          roomInspected,
          keyCardsReturned,
        },

        adjustments: {
          minibarCharges,
          damageCharges,
          lateCheckoutCharges,
          extraManualCharges,
          discount,
        },

        roomStatusAfterCheckout: roomStatus,
        guestFeedback: {
          rating,
          comment: comments,
        },
      }

      const response = await createCheckOut(payload)
      if (response.success) {
        toast.success("Checkout processed successfully")
        window.sessionStorage.setItem(CHECKOUT_SUCCESS_STORAGE_KEY, JSON.stringify(response.data))
        setCheckoutResult(response.data)
        setShowSuccess(true)
        window.dispatchEvent(new Event(CHECKOUT_SUCCESS_EVENT))

        // Reset and refresh
        setSelectedRoom("")
        setFolioData(null)
        setKeyCardsReturned(1)
        setMinibarChecked(true)
        setMinibarCharges(0)
        setRoomInspected(true)
        setDamageCharges(0)
        setDiscount(0)
        setExtraManualCharges(0)
        setLateCheckoutHours(0)
        setLateCheckoutCharges(0)
        setPaymentMode("cash")
        setAmountPaid(0)
        setAmountPaidEdited(false)
        setRoomStatus("dirty")
        setSplitAllocations([{ name: "Guest 1", amount: 0, mode: "cash" }])
        setBillingType("full")
        setCompanyId("")
        setCompanyName("")
        setCompanyGstin("")
        setCompanyBillingAddress("")
        setRating(5)
        setComments("")

        fetchInHouseGuests()
      }
    } catch (error: any) {
      console.error("Checkout failed:", error)
      toast.error(error.message || "Checkout failed")
    } finally {
      setProcessingCheckout(false)
    }
  }

  const handlePrint = () => {
    const content = document.getElementById("gr-card-print")

    if (!content) return

    const win = window.open("", "", "width=900,height=700")

    if (win) {
      win.document.write(`
      <html>
        <head>
          <title>Bill</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body {
              margin: 0;
              padding: 20px;
              background: white;
            }
          </style>
        </head>

        <body>
          ${content.outerHTML}
        </body>
      </html>
    `)

      win.document.close()
      setTimeout(() => {
        win.print()
        win.close()
      }, 500)
    }
  }

  const handlePrintCheckoutReceipt = () => {
    const totals = checkoutResult?.totals
    const hasReceiptData = checkoutResult &&
      totals &&
      typeof totals === "object" &&
      (totals.adjustedFinalAmount != null || totals.finalAmount != null)

    if (!hasReceiptData) {
      toast.error("A generated invoice is not available for this checkout")
      return
    }

    const escapeHtml = (value: unknown) => String(value ?? "—")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;")
    const receiptMoney = (value: unknown) => money(toNum(value))
    const checkoutTime = parseDate(checkoutResult.checkOutTime)
    const win = window.open("", "", "width=760,height=800")

    if (!win) {
      toast.error("Allow pop-ups to print the checkout bill")
      return
    }

    win.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Checkout bill ${escapeHtml(checkoutResult.checkOutId || "")}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 40px; color: #17201b; background: #fff; font: 14px/1.5 Arial, sans-serif; }
            main { max-width: 680px; margin: 0 auto; }
            header { display: flex; justify-content: space-between; gap: 24px; padding-bottom: 20px; border-bottom: 2px solid #15803d; }
            h1 { margin: 0; font-size: 24px; }
            .status { margin-top: 4px; color: #15803d; font-weight: 700; }
            .meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 24px; padding: 24px 0; border-bottom: 1px solid #d1d5db; }
            .label { display: block; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; }
            table { width: 100%; margin-top: 24px; border-collapse: collapse; }
            th, td { padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: left; }
            th:last-child, td:last-child { text-align: right; }
            .total td { padding-top: 16px; border-bottom: 0; font-size: 17px; font-weight: 700; }
            footer { margin-top: 36px; color: #6b7280; font-size: 12px; text-align: center; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <main>
            <header>
              <div><h1>Checkout Bill</h1><div class="status">Checkout Successful</div></div>
              <div><span class="label">Reference</span>${escapeHtml(checkoutResult.checkOutId)}</div>
            </header>
            <section class="meta">
              <div><span class="label">Booking</span>${escapeHtml(checkoutResult.bookingId)}</div>
              <div><span class="label">Room</span>${escapeHtml(checkoutResult.roomNumber)}</div>
              <div><span class="label">Billing type</span>${escapeHtml(checkoutResult.billingType)}</div>
              <div><span class="label">Checkout time</span>${escapeHtml(checkoutTime ? checkoutTime.toLocaleString("en-IN") : "—")}</div>
            </section>
            <table aria-label="Checkout bill totals">
              <thead><tr><th>Description</th><th>Amount</th></tr></thead>
              <tbody>
                <tr><td>Room charges</td><td>${escapeHtml(receiptMoney(totals?.roomCharges))}</td></tr>
                <tr><td>Service charges</td><td>${escapeHtml(receiptMoney(totals?.serviceCharges))}</td></tr>
                <tr><td>GST</td><td>${escapeHtml(receiptMoney(totals?.gst))}</td></tr>
                <tr><td>Advance paid</td><td>− ${escapeHtml(receiptMoney(totals?.advancePaid))}</td></tr>
                <tr class="total"><td>Final amount</td><td>${escapeHtml(receiptMoney(totals?.adjustedFinalAmount ?? totals?.finalAmount))}</td></tr>
              </tbody>
            </table>
            <footer>Generated from the completed checkout record.</footer>
          </main>
        </body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => {
      win.print()
      win.close()
    }, 300)
  }

  const handleDownloadGeneratedBills = async () => {
    if (downloadingBills) return

    const companionInvoices = Array.isArray(checkoutResult?.companionInvoices) ? checkoutResult.companionInvoices : []
    const invoiceIds = Array.from(new Set([
      checkoutResult?.invoiceId,
      ...companionInvoices.map((invoice: any) => invoice?.invoiceId),
    ].filter(Boolean).map(String)))

    if (!invoiceIds.length) {
      handlePrintCheckoutReceipt()
      return
    }

    setDownloadingBills(true)
    try {
      const downloads = await Promise.allSettled(invoiceIds.map((invoiceId) => downloadCheckoutInvoice(invoiceId)))
      const failedDownloads = downloads.filter((result) => result.status === "rejected")

      if (failedDownloads.length) {
        throw new Error(
          failedDownloads.length === invoiceIds.length
            ? "Failed to download generated bills"
            : `${failedDownloads.length} of ${invoiceIds.length} generated bills could not be downloaded`
        )
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to download generated bills")
    } finally {
      setDownloadingBills(false)
    }
  }

  const handleUndoCheckout = async () => {
    if (!checkoutResult?.folioId) {
      toast.error("No folio information found to undo checkout")
      return
    }

    setUndoing(true)
    try {
      const roomToRestore = checkoutResult.roomNumber
      const response = await undoCheckOut({
        folioId: checkoutResult.folioId,
        reason: "Manual reversal via HMS UI",
      })
      if (response.success) {
        toast.success("Checkout undone successfully. Guest is now active.")
        
        // Hide success card and dialog
        setShowSuccess(false)
        window.sessionStorage.removeItem(CHECKOUT_SUCCESS_STORAGE_KEY)
        setIsUndoDialogOpen(false)
        
        // Reset all checkout-related local states
        setCheckoutResult(null)
        setAmountPaidEdited(false)
        setAmountPaid(0)
        setDiscount(0)
        setExtraManualCharges(0)
        setDamageCharges(0)
        setMinibarCharges(0)
        setLateCheckoutHours(0)
        setLateCheckoutCharges(0)
        setComments("")
        setRating(5)

        // Refresh in-house guests and restore selection
        const refreshedGuests = await fetchInHouseGuests()
        
        // Restore the room selection to show the active check-in screen
        if (roomToRestore) {
          const restoredGuest = refreshedGuests.find((guest) => getGuestRoomNumber(guest) === String(roomToRestore).trim())
          if (restoredGuest) {
            await handleRoomChange(roomToRestore, restoredGuest)
          } else {
            setSelectedRoom("")
            setFolioData(null)
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to undo checkout")
    } finally {
      setUndoing(false)
    }
  }

  const selectedRoomGuests = useMemo(
    () => inHouseGuests.filter(g => getGuestRoomNumber(g) === String(selectedRoom).trim()),
    [inHouseGuests, selectedRoom]
  )
  const room = selectedRoomGuests.find((guest) => !isPaxGuest(guest)) || selectedRoomGuests[0]
  const roomOptions = Array.from(
    new Map(
      inHouseGuests
        .map((guest) => {
          const roomNumber = getGuestRoomNumber(guest)
          if (!roomNumber) return null
          const roomGuests = inHouseGuests.filter(g => getGuestRoomNumber(g) === roomNumber)
          const primaryGuest = roomGuests.find((g) => !isPaxGuest(g)) || guest
          const payerNames = Array.from(new Set(roomGuests.map(getGuestDisplayName).filter(Boolean)))

          return [
            roomNumber,
            {
              roomNumber,
              guestName: getGuestDisplayName(primaryGuest),
              folioNumber: getGuestFolioNumber(primaryGuest),
              payerCount: payerNames.length,
            },
          ] as const
        })
        .filter((entry): entry is readonly [string, { roomNumber: string; guestName: string; folioNumber: string; payerCount: number }] => Boolean(entry))
    ).values()
  ).sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true, sensitivity: "base" }))

  // Calculate billing from folioData or fallback to room data
  const charges = Array.isArray(folioData?.charges) ? folioData.charges : []
  const payments = Array.isArray(folioData?.payments) ? folioData.payments : []
  const checkoutSummary = folioData?.checkoutSummary || {}

  const roomTypeValue = room?.roomType?.$oid || room?.roomType?._id || room?.roomType || folioData?.room?.roomType || ""
  const roomTypeName = String(room?.roomType?.name || room?.type || folioData?.room?.roomType || "").toLowerCase()
  const setupRoomType = roomTypes.find((rt) => {
    const id = String(rt._id || rt.id || "")
    const name = String(rt.name || rt.code || "").toLowerCase()
    return id === String(roomTypeValue) || (!!roomTypeName && name === roomTypeName)
  })
  const fallbackNightlyRate = Number(
    room?.planCharges ||
    folioData?.room?.rate ||
    setupRoomType?.baseRate ||
    setupRoomType?.rate ||
    0
  )
  const roomTariffCharges = charges.filter((c: any) => String(c.category || c.type || "").toLowerCase() === "room-tariff")
  const postedRoomCharges = roomTariffCharges
    .reduce((sum: number, c: any) => sum + Number(c.total ?? c.totalAmount ?? c.amount ?? 0), 0)
  const postedNights = roomTariffCharges
    .reduce((sum: number, c: any) => sum + Math.max(1, Number(c.quantity || 1)), 0)
  const scheduledNights = Math.max(1, Number(room?.nights || folioData?.stay?.nights || 1))
  const explicitStayedNights = Math.max(0, Number(room?.nightsStayed || folioData?.stay?.nightsStayed || folioData?.nightsStayed || 0))
  const calculatedStayedNights = calculateStayedNights(
    room?.checkInDate || room?.checkIn || folioData?.stay?.checkIn,
    folioData?.actualCheckOutTime || new Date()
  )
  const billableStayedNights = calculatedStayedNights || explicitStayedNights || scheduledNights
  const totalNights = postedNights > 0 && billableStayedNights < postedNights ? billableStayedNights : (postedNights || billableStayedNights)
  const adjustedForEarlyCheckout = postedNights > 0 && billableStayedNights < postedNights
  const calculatedRoomCharges = postedRoomCharges
    ? roundMoney(adjustedForEarlyCheckout ? (postedRoomCharges / postedNights) * totalNights : postedRoomCharges)
    : roundMoney((fallbackNightlyRate * totalNights) || 0)
  const roomCharges = checkoutSummary.roomCharges != null
    ? roundMoney(checkoutSummary.roomCharges)
    : calculatedRoomCharges

  const calculatedServiceCharges = charges
    .filter((c: any) => String(c.category || c.type || "").toLowerCase() !== "room-tariff")
    .reduce((sum: number, c: any) => sum + Number(c.total ?? c.totalAmount ?? c.amount ?? 0), 0) || 0
  const serviceCharges = checkoutSummary.serviceCharges != null
    ? roundMoney(checkoutSummary.serviceCharges)
    : calculatedServiceCharges

  const providedCgst = Number(folioData?.cgst || folioData?.summary?.cgst || 0)
  const providedSgst = Number(folioData?.sgst || folioData?.summary?.sgst || 0)
  const computedTax = ((roomCharges + serviceCharges) * GST_PERCENT) / 100
  const totalTax = checkoutSummary.gstAmount != null
    ? roundMoney(checkoutSummary.gstAmount)
    : (adjustedForEarlyCheckout ? computedTax : (providedCgst + providedSgst || computedTax))
  const cgst = checkoutSummary.cgst != null
    ? roundMoney(checkoutSummary.cgst)
    : (adjustedForEarlyCheckout ? totalTax / 2 : (providedCgst || totalTax / 2))
  const sgst = checkoutSummary.sgst != null
    ? roundMoney(checkoutSummary.sgst)
    : (adjustedForEarlyCheckout ? totalTax / 2 : (providedSgst || totalTax / 2))
  const grossTotal = checkoutSummary.grossTotal != null
    ? roundMoney(checkoutSummary.grossTotal)
    : roomCharges + serviceCharges + totalTax
  const rawAdvance = payments.reduce((sum: number, p: any) => sum + toNum(p.amount), 0) || Number(room?.advanceAmount || 0)
  const advance = checkoutSummary.advancePaid != null
    ? Math.abs(roundMoney(checkoutSummary.advancePaid))
    : Math.abs(rawAdvance)
  const netPayable = grossTotal - advance
  const folioNetPayable = checkoutSummary.amountDue != null
    ? roundMoney(checkoutSummary.amountDue)
    : roundMoney(netPayable)

  const extraCharges =
    minibarCharges +
    damageCharges +
    lateCheckoutCharges +
    extraManualCharges

  const finalAmount = roundMoney(folioNetPayable + extraCharges - discount)
  const totalSplit = roundMoney(splitAllocations.reduce((sum, row) => sum + toNonNegativeNum(row.amount), 0))
  
  // Scenario Detection
  const refundDue = finalAmount < -0.01 ? Math.abs(finalAmount) : 0
  const isRefundScenario = refundDue > 0
  
  // Balance is only if finalAmount > 0
  const balance = billingType === "full" && !isRefundScenario 
    ? Math.max(0, roundMoney(finalAmount - toNonNegativeNum(amountPaid))) 
    : 0
  
  // Refund is either from negative finalAmount (refundScenario) or from overpayment of amountPaid
  const refund = billingType === "full" 
    ? (isRefundScenario 
        ? refundDue + toNonNegativeNum(amountPaid)
        : (toNonNegativeNum(amountPaid) > finalAmount ? roundMoney(toNonNegativeNum(amountPaid) - finalAmount) : 0)
      ) 
    : 0
  const remainingSplitBalance = roundMoney(finalAmount - totalSplit)
  const splitHasAllocationMismatch = billingType === "split" && !moneyEquals(totalSplit, finalAmount)

  useEffect(() => {
    if (billingType === "full" && !amountPaidEdited) {
      setAmountPaid(Math.max(0, finalAmount))
    }
  }, [finalAmount, billingType, amountPaidEdited])

  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Check-Out</h1>
          <p className="text-sm text-muted-foreground">Process guest departure and finalize billing</p>
        </div>

        {showSuccess && checkoutResult && (
          <Card
            role="status"
            aria-live="polite"
            className="border-emerald-200 bg-emerald-50/70 shadow-none"
          >
            <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-emerald-900">Checkout Successful</p>
                  <p className="mt-0.5 break-words text-xs font-medium text-emerald-700">
                    Ref: {checkoutResult.checkOutId || "Not available"} <span aria-hidden="true">|</span>{" "}
                    Booking: {checkoutResult.bookingId || "Not available"}
                  </p>
                </div>
              </div>
              <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
                <Button
                  size="sm"
                  className="h-8 gap-1.5 bg-emerald-600 text-xs text-white hover:bg-emerald-700 focus-visible:ring-emerald-600"
                  onClick={handleDownloadGeneratedBills}
                  disabled={downloadingBills}
                >
                  {downloadingBills ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {downloadingBills ? "Generating..." : "Generate Bill"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-800"
                  onClick={() => {
                    setShowSuccess(false)
                    setCheckoutResult(null)
                    window.sessionStorage.removeItem(CHECKOUT_SUCCESS_STORAGE_KEY)
                  }}
                  aria-label="Dismiss checkout success message"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={isUndoDialogOpen} onOpenChange={setIsUndoDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Undo Checkout</DialogTitle>
              <div className="space-y-3 pt-2 text-sm text-muted-foreground">
                <p>This will:</p>
                <ul className="space-y-1 font-medium text-foreground">
                  <li className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" /> Restore the guest to Checked In
                  </li>
                  <li className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" /> Mark the room as Occupied
                  </li>
                  <li className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" /> Reopen the guest folio
                  </li>
                </ul>
              </div>
            </DialogHeader>
            <DialogFooter className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setIsUndoDialogOpen(false)} disabled={undoing}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleUndoCheckout} 
                disabled={undoing}
                className="gap-2"
              >
                {undoing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Undo Checkout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div id="gr-card-print" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Room Selection */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Room Selection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Room No <span className="text-destructive">*</span></Label>
                  <Select value={selectedRoom} onValueChange={handleRoomChange}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select room" /></SelectTrigger>
                    <SelectContent>
                      {roomOptions.length > 0 ? (
                        roomOptions.map((option) => (
                          <SelectItem key={option.roomNumber} value={option.roomNumber}>
                            {[option.roomNumber, option.guestName, option.folioNumber].filter(Boolean).join(" - ")}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-rooms" disabled>No occupied rooms available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Billing Type</Label>
                  <Select value={billingType} onValueChange={setBillingType}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Billing</SelectItem>
                      <SelectItem value="split">Split Billing</SelectItem>
                      <SelectItem value="company">Company Billing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {room && (
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Room:</span><span className="font-medium text-foreground">{getGuestRoomNumber(room) || "N/A"}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Guest:</span><span className="font-medium text-foreground">{room.guestName || room.name}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Folio:</span><span className="text-foreground">{folioData?.folioNumber || room.folioNumber || "N/A"}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Booking:</span><span className="text-foreground">{room.bookingNumber || room.bookingNo || room.bookingId || room.reservationId || "N/A"}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Check-In:</span><span className="text-foreground">{room.checkInDate || room.checkIn}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Check-Out:</span><span className="text-foreground">{room.checkOutDate || room.checkOut || "N/A"}</span></div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Room Type:</span>
                      <span className="text-foreground">
                        {room.roomType?.name ||
                          room.type ||
                          roomTypes.find(rt => (rt._id === (room.roomType?.$oid || room.roomType)) || (rt.id === (room.roomType?.$oid || room.roomType)))?.name ||
                          "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Plan:</span>
                      <span className="text-foreground">
                        {room.ratePlan?.name ||
                          ratePlans.find(rp => (rp._id === (room.planType?.$oid || room.planType)) || (rp.id === (room.planType?.$oid || room.planType)))?.name ||
                          "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Nights:</span><span className="text-foreground">{totalNights || 0}</span></div>
                  </div>
                )}
                <div className="flex flex-col gap-2 pt-2">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs justify-start" onClick={handleEditCheckIn}><Pencil className="h-3 w-3" /> Check-in Details Update</Button>
                </div>
              </CardContent>
            </Card>

            {/* Billing Summary */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Billing Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {fetchingFolio ? (
                    <div className="flex h-32 items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : folioData ? (
                    <div className="space-y-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Description</TableHead>
                            <TableHead className="text-xs text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="text-xs">Room Charges ({totalNights} nights)</TableCell>
                            <TableCell className="text-xs text-right">{money(roomCharges)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="text-xs">Other Services (Laundry, Minibar)</TableCell>
                            <TableCell className="text-xs text-right">{money(serviceCharges)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="text-xs text-muted-foreground">CGST</TableCell>
                            <TableCell className="text-xs text-right text-muted-foreground">{money(cgst)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="text-xs text-muted-foreground">SGST</TableCell>
                            <TableCell className="text-xs text-right text-muted-foreground">{money(sgst)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                      <Separator />
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs"><span>Gross Total</span><span className="font-medium">{money(grossTotal)}</span></div>
                        <div className="flex justify-between text-xs text-green-600"><span>Advance Paid</span><span>-{money(advance)}</span></div>
                        <Separator />
                        <div className="flex justify-between text-sm font-bold">
                          <span>{finalAmount < 0 ? "Net Refundable" : "Net Payable"}</span>
                          <span className={finalAmount < 0 ? "text-green-600" : "text-primary"}>
                            {money(folioNetPayable)}
                          </span>
                        </div>
                      </div>

                      <Separator />

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">

                            {/* Left Section */}
                            <div className="space-y-4">

                              <div className="rounded-lg border border-border p-4 space-y-3">
                                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Room Verification
                                </h3>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="minibar"
                                    checked={minibarChecked}
                                    onCheckedChange={(v) => setMinibarChecked(!!v)}
                                  />

                                  <Label htmlFor="minibar" className="text-sm">
                                    Minibar Checked
                                  </Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="inspected"
                                    checked={roomInspected}
                                    onCheckedChange={(v) => setRoomInspected(!!v)}
                                  />

                                  <Label htmlFor="inspected" className="text-sm">
                                    Room Inspected
                                  </Label>
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-[11px] font-medium text-muted-foreground uppercase">
                                    Key Cards Returned
                                  </Label>

                                  <Input
                                    type="number"
                                    min="0"
                                    className="h-9 text-sm"
                                    value={isNaN(keyCardsReturned) ? "" : keyCardsReturned}
                                    onChange={(e) =>
                                      setKeyCardsReturned(
                                        Math.max(0, parseInt(e.target.value) || 0)
                                      )
                                    }
                                  />
                                </div>
                              </div>

                            </div>

                            {/* Right Section */}
                            <div className="rounded-lg border border-border p-4 space-y-4">

                              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Additional Charges
                              </h3>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <div className="space-y-1">
                                  <Label className="text-[11px] font-medium text-muted-foreground uppercase">
                                    Minibar Charges
                                  </Label>

                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="h-9 text-sm"
                                    value={numberInputValue(minibarCharges)}
                                    onChange={(e) =>
                                      setMinibarCharges(toNonNegativeNum(e.target.value))
                                    }
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-[11px] font-medium text-muted-foreground uppercase">
                                    Damage Charges
                                  </Label>

                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="h-9 text-sm"
                                    value={numberInputValue(damageCharges)}
                                    onChange={(e) =>
                                      setDamageCharges(toNonNegativeNum(e.target.value))
                                    }
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-[11px] font-medium text-muted-foreground uppercase">
                                    Late Checkout Hours
                                  </Label>

                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="h-9 text-sm"
                                    value={numberInputValue(lateCheckoutHours)}
                                    onChange={(e) =>
                                      setLateCheckoutHours(toNonNegativeNum(e.target.value))
                                    }
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-[11px] font-medium text-muted-foreground uppercase">
                                    Late Checkout Charges
                                  </Label>

                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="h-9 text-sm"
                                    value={numberInputValue(lateCheckoutCharges)}
                                    onChange={(e) =>
                                      setLateCheckoutCharges(toNonNegativeNum(e.target.value))
                                    }
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-[11px] font-medium text-muted-foreground uppercase">
                                    Manual Extra Charges
                                  </Label>

                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="h-9 text-sm"
                                    value={numberInputValue(extraManualCharges)}
                                    onChange={(e) =>
                                      setExtraManualCharges(toNonNegativeNum(e.target.value))
                                    }
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-[11px] font-medium text-muted-foreground uppercase">
                                    Discount
                                  </Label>

                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="h-9 text-sm"
                                    value={numberInputValue(discount)}
                                    onChange={(e) =>
                                      setDiscount(toNonNegativeNum(e.target.value))
                                    }
                                  />
                                </div>

                              </div>
                            </div>

                          </div>

                      <Separator />

                      {billingType === "full" && (
                        <div className="space-y-4">
                          {isRefundScenario ? (
                            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 space-y-3">
                              <div className="flex items-center gap-2 text-amber-800 font-semibold">
                                <AlertCircle className="h-5 w-5" />
                                <span>Refund Settlement Required</span>
                              </div>
                              <p className="text-sm text-amber-700">
                                This guest is due for a refund of <span className="font-bold">{money(refundDue)}</span>. 
                                Please complete the refund settlement before checking out.
                              </p>
                              <Button 
                                variant="outline" 
                                className="w-full bg-white border-amber-300 text-amber-800 hover:bg-amber-100"
                                onClick={() => {
                                  const guest = inHouseGuests.find(g => getGuestRoomNumber(g) === String(selectedRoom).trim())
                                  const folioId = getGuestFolioId(guest) || getGuestCheckinId(guest)
                                  router.push(`/admin/front-office/reception/paidout-refund?folioId=${folioId}&amount=${refundDue}&type=refund&from=checkout`)
                                }}
                              >
                                Go To Refund Settlement <ArrowRight className="h-4 w-4 ml-2" />
                              </Button>
                            </div>
                          ) : finalAmount > 0.001 ? (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground uppercase">Payment Mode</Label>
                                <Select value={paymentMode} onValueChange={setPaymentMode}>
                                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="upi">UPI</SelectItem>
                                    <SelectItem value="card">Card</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground uppercase">Amount Paid</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="h-8 text-xs"
                                  value={numberInputValue(amountPaid)}
                                  onChange={(e) => {
                                    setAmountPaidEdited(true)
                                    setAmountPaid(toNonNegativeNum(e.target.value))
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center gap-2 text-green-700">
                              <CheckCircle2 className="h-5 w-5" />
                              <span className="text-sm font-medium">Billing Already Settled</span>
                            </div>
                          )}
                        </div>
                      )}

                      {billingType === "split" && (
                        <div className="space-y-3 border rounded-md p-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold">Split Billing Allocations</Label>
                            <div className="flex gap-1.5">
                              <Button type="button" size="sm" variant="outline" className="h-7 text-[10px]" onClick={autoFillLast}>
                                Auto-fill Last
                              </Button>
                              <Button type="button" size="sm" variant="outline" className="h-7 text-[10px]" onClick={distributeEvenly}>
                                Distribute Evenly
                              </Button>
                              <Button type="button" size="sm" variant="outline" className="h-7 text-[10px] bg-primary/5" onClick={addSplitPayer}>
                                Add Payer
                              </Button>
                            </div>
                          </div>
                          {splitAllocations.map((row, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-end">
                              <div className="col-span-5 space-y-1">
                                <Label className="text-[10px] text-muted-foreground uppercase">Payer Name</Label>
                                <Input
                                  className="h-8 text-xs"
                                  value={row.name}
                                  onChange={(e) => updateSplitPayer(index, "name", e.target.value)}
                                />
                              </div>
                              <div className="col-span-3 space-y-1">
                                <Label className="text-[10px] text-muted-foreground uppercase">Amount</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="h-8 text-xs"
                                  value={row.amount === 0 ? "" : row.amount}
                                  onChange={(e) => {
                                    updateSplitPayer(index, "amount", toNonNegativeNum(e.target.value))
                                  }}
                                />
                              </div>
                              <div className="col-span-3 space-y-1">
                                <Label className="text-[10px] text-muted-foreground uppercase">Mode</Label>
                                <Select value={row.mode} onValueChange={(value) => updateSplitPayer(index, "mode", value)}>
                                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="upi">UPI</SelectItem>
                                    <SelectItem value="card">Card</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="col-span-1">
                                <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => removeSplitPayer(index)}>
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <div className="text-xs flex flex-col gap-1 pt-2">
                            <div className="flex justify-between">
                              <span>Total Split</span>
                              <span className={moneyEquals(totalSplit, finalAmount) ? "text-green-600 font-semibold" : "text-destructive font-semibold"}>
                                {money(totalSplit)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Remaining Balance</span>
                              <span className={moneyEquals(remainingSplitBalance, 0) ? "text-muted-foreground font-semibold" : "text-destructive font-semibold"}>
                                {money(remainingSplitBalance)}
                              </span>
                            </div>
                            {splitHasAllocationMismatch && (
                              <div className="text-destructive text-[10px] text-right font-medium">
                                Split allocation must equal final payable amount
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {billingType === "company" && (
                        <div className="grid grid-cols-2 gap-4 border rounded-md p-3">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground uppercase">Company Name</Label>
                            <Select value={companyId} onValueChange={handleCompanyChange}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select company" /></SelectTrigger>
                              <SelectContent>
                                {companyOptions.length > 0 ? (
                                  companyOptions.map((item: any) => {
                                    const optionValue = String(item._id || item.id || item.value || "")
                                    const optionLabel = String(item.value || item.name || optionValue)
                                    return <SelectItem key={optionValue} value={optionValue}>{optionLabel}</SelectItem>
                                  })
                                ) : (
                                  <SelectItem value="no-company" disabled>No companies configured</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground uppercase">Company GSTIN</Label>
                            <Input className="h-8 text-xs" value={companyGstin} onChange={(e) => setCompanyGstin(e.target.value)} />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <Label className="text-[10px] text-muted-foreground uppercase">Billing Address</Label>
                            <Textarea className="text-xs min-h-16" value={companyBillingAddress} onChange={(e) => setCompanyBillingAddress(e.target.value)} />
                          </div>
                          <p className="col-span-2 text-xs text-amber-600 font-medium">Guest payment is ₹0. This folio will be marked Pending to Company.</p>
                        </div>
                      )}


                      <div className="space-y-1.5 border rounded-md p-3">
                        <div className="flex justify-between text-xs">
                          <span>Final Amount</span>
                          <span className="font-semibold">{money(finalAmount)}</span>
                        </div>
                        {billingType === "full" && (
                          <>
                            <div className="flex justify-between text-xs">
                              <span>Balance</span>
                              <span className={`font-semibold ${balance > 0 ? "text-destructive" : "text-muted-foreground"}`}>{money(Math.max(0, balance))}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>Refund</span>
                              <span className={`font-semibold ${refund > 0 ? "text-green-600" : "text-muted-foreground"}`}>{money(refund)}</span>
                            </div>
                          </>
                        )}
                        {billingType === "split" && (
                          <>
                            <div className="flex justify-between text-xs">
                              <span>Split Allocation Total</span>
                              <span className={`font-semibold ${moneyEquals(totalSplit, finalAmount) ? "text-green-600" : "text-destructive"}`}>{money(totalSplit)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>Remaining Balance</span>
                              <span className={`font-semibold ${moneyEquals(remainingSplitBalance, 0) ? "text-muted-foreground" : "text-destructive"}`}>{money(remainingSplitBalance)}</span>
                            </div>
                          </>
                        )}
                        {billingType === "company" && (
                          <div className="flex justify-between text-xs">
                            <span>Payment Status</span>
                            <span className="font-semibold text-amber-600">Pending to Company</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 pt-2">
                        <Label className="text-xs">Guest Feedback</Label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-4 w-4 cursor-pointer ${s <= rating ? "fill-warning text-warning" : "text-muted-foreground"}`}
                              onClick={() => setRating(s)}
                            />
                          ))}
                        </div>
                        <Textarea
                          placeholder="Comments..."
                          className="text-xs h-16"
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-12">Select a room to view billing details</p>
                  )}
                </CardContent>
              </Card>
            </div>
            {selectedRoom && folioData && (
              <div className="flex items-center gap-2 justify-end">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
                  <Printer className="h-3.5 w-3.5" /> Print Payment Statement (F3)
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={handleCheckout}
                  disabled={processingCheckout || !isSplitBillingValid() || isRefundScenario || (billingType === "full" && balance > 0.001)}
                >
                  {processingCheckout ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <DoorOpen className="h-3.5 w-3.5" />}
                  Checkout (F10)
                </Button>
              </div>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
