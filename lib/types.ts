// Inventory
export interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  minStock: number
  status: "in-stock" | "low-stock" | "critical"
  lastUpdated: string
}

// POS
export interface POSItem {
  id: string
  name: string
  category: string
  price: number
  taxRate: number
  description?: string
  image?: string
  status: "active" | "inactive"
}

export interface POSOrderItem {
  itemId: string
  name: string
  quantity: number
  unitPrice: number
  taxRate: number
  amount: number
  taxAmount: number
  total: number
}

export interface POSOrder {
  id: string
  orderNumber: string
  folioId?: string
  guestName?: string
  roomNumber?: string
  tableNo?: string
  status: "open" | "closed" | "cancelled"
  items: POSOrderItem[]
  subTotal: number
  taxTotal: number
  grandTotal: number
  paidAmount: number
  paymentMode?: string
  createdAt: string
}

// User roles
export type UserRole = "super-admin" | "company-admin" | "admin" | "staff"

// Available modules in the system
export type ModuleType =
  | "front-office"
  | "point-of-sale"
  | "housekeeping"
  | "accounts"
  | "inventory"
  | "reports"

export interface Module {
  id: ModuleType
  name: string
  description: string
  icon: string
}

export const AVAILABLE_MODULES: Module[] = [
  {
    id: "front-office",
    name: "Front Office",
    description: "Reservations, check-in/out, room management",
    icon: "building",
  },
  {
    id: "point-of-sale",
    name: "Point of Sale",
    description: "Restaurant, bar, and retail transactions",
    icon: "credit-card",
  },
  {
    id: "housekeeping",
    name: "Housekeeping",
    description: "Room cleaning status and task management",
    icon: "sparkles",
  },
  {
    id: "accounts",
    name: "Accounts",
    description: "Billing, invoices, and financial reports",
    icon: "calculator",
  },
  {
    id: "inventory",
    name: "Inventory",
    description: "Stock management and procurement",
    icon: "package",
  },
  {
    id: "reports",
    name: "Reports",
    description: "Analytics and business intelligence",
    icon: "bar-chart",
  },
]

// Hotel entity
export interface Hotel {
  id: string
  name: string
  address: string
  city: string
  country: string
  phone: string
  email: string
  propertyCode?: string
  companyId?: string
  companyName?: string
  companyCode?: string
  companySubscriptionPlan?: string
  companyMaxAllowedProperties?: number
  isStandalone?: boolean
  modules: ModuleType[]
  status: "active" | "inactive" | "pending" | "suspended"
  isActive: boolean
  subscriptionStatus?: "ACTIVE" | "WARNING" | "GRACE" | "EXPIRED" | "INACTIVE"
  subscriptionMessage?: string
  subscriptionIsValid?: boolean
  subscriptionDaysLeft?: number
  expiryDate: string
  createdAt: string
  roomCount: number
}

// Staff entity
export interface Staff {
  id: string
  name: string
  username?: string
  email: string
  phone?: string
  role: "admin" | "staff"
  avatar?: string
  hotelId: string
  modules: ModuleType[]
  permissions?: string[]
  status: "active" | "inactive"
  createdAt: string
  lastLogin?: string
}

// Company entity
export interface Company {
  _id: string
  hotelId: string
  name: string
  code?: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
  gstNumber?: string
  type: "Company" | "Travel Agent"
  creditAllowed: boolean
  creditLimit: number
  status: boolean
  createdAt?: string
  updatedAt?: string
}

// Travel Agent entity
export interface TravelAgent {
  _id: string
  hotelId: string
  name: string
  code?: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
  gstNumber?: string
  creditAllowed: boolean
  creditLimit: number
  status: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Service {
  _id: string
  name: string
  code?: string
  category?: string
  defaultPrice: number
  chargeType: string
  isFood?: boolean
  gstApplicable?: boolean
  gstPercentage?: number
  status?: "active" | "inactive"
}

// User entity (for auth)
export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  hotelId?: string
  hotelName?: string
  companyId?: string
  propertyIds?: string[]
  defaultPropertyId?: string
  permissions?: string[]
  expiryDate?: string
  modules?: ModuleType[]
  avatar?: string
  needsSetup?: boolean
  mustChangePassword?: boolean
}

// Room types for front office
export type RoomStatus = "available" | "occupied" | "maintenance" | "cleaning" | "reserved" | "blocked"
export type RoomType = string

export interface Room {
  id: string
  number: string
  floor: number
  type: RoomType
  roomTypeId?: string
  status: RoomStatus
  hkStatus?: "clean" | "dirty" | "cleaning" | "inspected" | "out-of-order"
  acType?: "AC" | "NON_AC"
  price: number
  gstPercentage?: number
  gstType?: "INCLUSIVE" | "EXCLUSIVE"
  amenities: string[]
  guestName?: string
  checkinId?: string
  folioId?: string
  checkIn?: string
  checkOut?: string
  bookingId?: string
  phone?: string
  adults?: number
  children?: number
  remainingDays?: number
  planCharges?: number
  foodCharges?: number
  discount?: number
  guestDetails?: {
    name?: string
    phone?: string
    checkIn?: string
    checkOut?: string
    adults?: number
    children?: number
    bookingId?: string
    checkinId?: string
    folioId?: string
  }
  blockDetails?: {
    from: string
    to: string
    reason: string
  }
}

// Housekeeping
export interface HousekeepingTask {
  id: string
  room: {
    id: string
    roomNumber: string
    floor: number
    hkStatus: string
    status: string
  }
  taskType: "checkout" | "stayover" | "deep-clean" | "turndown" | "inspection" | "maintenance"
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "in-progress" | "completed" | "cancelled"
  assignedTo?: string
  assignedToName?: string
  notes?: string
  createdAt: string
  completedAt?: string
}

// Reservation
export interface Reservation {
  id: string
  reservationId: string
  bookingNumber?: string
  guestName: string
  guestEmail: string
  guestPhone: string
  guestPhotoUrl?: string
  idProofType?: string
  idProofNumber?: string
  roomId: string
  roomNumber: string
  roomType?: string
  checkIn: string
  checkOut: string
  status: "confirmed" | "checked-in" | "checked-out" | "cancelled"
  adults?: number
  children?: number
  extraBeds?: number
  totalAmount: number
  paidAmount: number
  paymentMode?: string
  ratePlan?: string
  bookingSource?: string
  referredByType?: string
  referredById?: string
  referredByName?: string
  stayType?: string
  amount?: number
  createdAt: string
}

// Guest
export interface Guest {
  id: string
  name: string
  email: string
  phone: string
  photo?: string
  idType: string
  idNumber: string
  address: string
  nationality: string
  visits: number
  totalSpent: number
}

// Dashboard stats
export interface DashboardStats {
  totalRooms: number
  occupiedRooms: number
  availableRooms: number
  todayCheckIns: number
  todayCheckOuts: number
  revenue: number
  occupancyRate: number
}

// Module Request - Hotel can request new modules
export interface ModuleRequest {
  id: string
  hotelId: string
  hotelName: string
  requestedModules: ModuleType[]
  reason?: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
  respondedAt?: string
  respondedBy?: string
  adminNotes?: string
}

// Notification types
export type NotificationType = "module-update" | "promotion" | "system-update" | "alert"
export type NotificationRecipient = "admin" | "hotel" | "guest" | "all"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  recipient: NotificationRecipient // "admin" = super-admin to hotels, "hotel" = hotel to customers
  hotelId?: string // For admin notifications to specific hotels
  customerId?: string // For hotel notifications to specific customers/guests
  senderId: string // user ID who sent it
  senderType: "admin" | "hotel" // who sent: super-admin or hotel-admin
  isRead: boolean
  createdAt: string
  expiresAt?: string
  metadata?: Record<string, unknown> // Additional data like promotion details

  // Recipient details for display
  recipientName?: string
  recipientEmail?: string
}

// Promotion notification (sent by hotels to customers)
export interface Promotion {
  id: string
  hotelId: string
  title: string
  description: string
  discountType: "percentage" | "fixed" // "20% off" or "₹5000 off"
  discountValue: number
  applicableModules?: ModuleType[] // Which modules this promotion applies to
  validFrom: string
  validUntil: string
  status: "active" | "scheduled" | "expired"
  audienceType: "all-guests" | "specific-guests" | "repeat-guests"
  specificGuestIds?: string[] // For targeted promotions
  notificationSent: boolean
  createdAt: string
  createdBy: string // hotel admin ID
}

export interface GRCardData {
  bookingNo: string
  registerNo: string
  guestName: string
  roomNumber: string
  roomType: string
  planType: string
  tariff: number
  totalAmount?: number
  checkIn: string
  checkOut: string
  noOfPax: number
  guestType?: string
  idProof: string
  idProofType?: string
  idProofNumber?: string
  passportNo?: string
  visaDetails?: string
  noOfNights?: number
  totalPax?: number
  netAmount?: number
  nationality?: string
  address?: string
  email?: string
  mobileNo?: string
  company?: string
  dob?: string
  arrivalFrom?: string
  departureTo?: string
  purposeOfVisit?: string
  adultMale?: number
  adultFemale?: number
  children?: number
  hotel?: {
    name: string
    address: string
    city: string
    country: string
    phone: string
  }
}

export interface Folio {
  folioId: string
  folioNumber: string
  bookingId: string
  guest: {
    name: string
    email: string
    phone: string
    gstNumber?: string
    companyName?: string
  }
  room: {
    roomNumber: string
    roomType: string
  }
  stay: {
    checkIn: string
    checkOut: string
    nights: number
  }
  charges: any[]
  payments: any[]
  summary: {
    totalRoomCharges: number
    totalOtherCharges: number
    totalCharges: number
    totalTax: number
    grossTotal: number
    discount: number
    netTotal: number
    totalPayments: number
    balance: number
  }
}
