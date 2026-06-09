import { apiRequest, type JsonRecord } from "./client"

export interface AccountsPagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface AccountsListFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
  type?: string
  category?: string
  paymentMode?: string
  direction?: "outgoing" | "incoming" | string
  fromDate?: string
  toDate?: string
  date?: string
  month?: number | string
  year?: number | string
  asOfDate?: string
}

export interface AccountsTransaction {
  id: string
  _id: string
  transactionNumber?: string
  date: string
  type: "Income" | "Expense" | "Transfer" | "Refund" | "Journal" | string
  category: string
  subCategory?: string
  description: string
  reference?: string
  amount: number
  paymentMode?: string
  status: "pending" | "completed" | "cancelled" | "reversed" | string
  sourceModule?: string
  ledgerAccountId?: string
  createdBy?: string
  createdAt?: string
}

export interface AccountsTransactionSummary {
  totalIncome: number
  totalExpense: number
  netAmount: number
}

export interface CreateAccountsTransactionPayload {
  date?: string
  type: string
  category: string
  subCategory?: string
  description: string
  amount: number
  paymentMode?: string
  reference?: string
  ledgerAccountId?: string
}

export interface AccountsPayment {
  id: string
  _id: string
  date: string
  payee: string
  payer: string
  category: string
  description: string
  amount: number
  mode: string
  reference?: string
  status: string
  direction: "outgoing" | "incoming" | string
}

export interface CreateAccountsPaymentPayload {
  vendorName: string
  category?: string
  description?: string
  amount: number
  paymentMode: string
  paymentDate?: string
  utrNumber?: string
  chequeNumber?: string
  billNumber?: string
  direction?: "outgoing" | "incoming"
  status?: string
}

export interface CreateAccountsReceiptPayload {
  customerName?: string
  guestName?: string
  receiptType?: string
  invoiceId?: string
  amount: number
  paymentMode: string
  reference?: string
  remarks?: string
  status?: string
}

export interface AccountsInvoice {
  id: string
  _id: string
  invoiceNumber: string
  guestName: string
  customerName?: string
  companyName?: string
  room: string
  checkIn?: string
  checkOut?: string
  invoiceDate?: string
  dueDate?: string
  items: JsonRecord[]
  subtotal: number
  taxes: number
  totalTax: number
  total: number
  grandTotal: number
  paid: number
  amountPaid: number
  balance: number
  balanceDue: number
  status: string
  sent?: boolean
  notes?: string
}

export interface AccountsExpense {
  id: string
  _id: string
  date: string
  category: string
  subCategory?: string
  description: string
  amount: number
  paidTo?: string
  vendor: string
  paymentMode?: string
  billNumber?: string
  department?: string
  approvedBy?: string
  status: string
  taxAmount: number
  taxableAmount: number
  gstRate: number
}

export interface LedgerAccount {
  id: string
  _id: string
  code: string
  name: string
  type: string
  normalBalance: "Dr" | "Cr" | string
  isActive: boolean
  balance: number
  entries?: JsonRecord[]
}

export interface LedgerEntry {
  date: string
  description?: string
  particulars?: string
  reference?: string
  voucherNo?: string
  debit: number
  credit: number
  balance: number
}

export interface AccountSettings {
  _id?: string
  gstNumber?: string
  gstRates?: JsonRecord
  tdsRates?: JsonRecord
  hsnCodes?: JsonRecord
  panNumber?: string
  tanNumber?: string
  stateCode?: string
  financialYearStart?: string
  currency?: string
  invoicePrefix?: string
  receiptPrefix?: string
  paymentPrefix?: string
  depositPrefix?: string
  refundPrefix?: string
  automation?: {
    autoGenerateInvoiceOnCheckout?: boolean
    sendInvoiceViaEmail?: boolean
    roundOffAmounts?: boolean
  }
  paymentMethods?: unknown[]
  taxRates?: unknown[]
  expenseCategories?: unknown[]
}

function toQueryString(filters: object = {}) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "all") return
    params.set(key, String(value))
  })

  const query = params.toString()
  return query ? `?${query}` : ""
}

function getArray<T extends JsonRecord>(data: JsonRecord | undefined, key: string): T[] {
  const value = data?.[key]
  return Array.isArray(value) ? value as T[] : []
}

function pagination(raw?: Partial<AccountsPagination>, filters: AccountsListFilters = {}): AccountsPagination {
  return {
    page: Number(raw?.page || filters.page || 1),
    limit: Number(raw?.limit || filters.limit || 25),
    total: Number(raw?.total || 0),
    pages: Number(raw?.pages || 1),
  }
}

function actorName(value: unknown) {
  if (value && typeof value === "object") {
    const raw = value as JsonRecord
    return String(raw.name || raw.email || raw._id || "")
  }
  return value ? String(value) : ""
}

function mapTransaction(raw: JsonRecord, fallbackTransactionNumber?: string): AccountsTransaction {
  const id = String(raw._id || raw.id || "")
  return {
    id,
    _id: id,
    transactionNumber: raw.transactionNumber ? String(raw.transactionNumber) : fallbackTransactionNumber,
    date: String(raw.date || raw.createdAt || ""),
    type: String(raw.type || ""),
    category: String(raw.category || ""),
    subCategory: raw.subCategory ? String(raw.subCategory) : undefined,
    description: String(raw.description || ""),
    reference: raw.reference ? String(raw.reference) : undefined,
    amount: Number(raw.amount || 0),
    paymentMode: raw.paymentMode ? String(raw.paymentMode) : undefined,
    status: String(raw.status || "completed"),
    sourceModule: raw.sourceModule ? String(raw.sourceModule) : undefined,
    ledgerAccountId: raw.ledgerAccountId ? String(raw.ledgerAccountId) : undefined,
    createdBy: actorName(raw.createdBy),
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
  }
}

function mapPayment(raw: JsonRecord): AccountsPayment {
  const id = String(raw._id || raw.id || "")
  const reference = raw.utrNumber || raw.chequeNumber || raw.billNumber || raw.reference

  return {
    id,
    _id: id,
    date: String(raw.paymentDate || raw.createdAt || ""),
    payee: String(raw.vendorName || raw.payee || raw.customerName || raw.guestName || ""),
    payer: String(raw.customerName || raw.guestName || raw.vendorName || raw.payer || ""),
    category: String(raw.category || raw.paymentType || raw.receiptType || ""),
    description: String(raw.description || raw.remarks || ""),
    amount: Number(raw.amount || 0),
    mode: String(raw.paymentMode || raw.mode || ""),
    reference: reference ? String(reference) : undefined,
    status: String(raw.status === "active" ? "completed" : raw.status || "completed"),
    direction: String(raw.direction || (raw.receiptNumber ? "incoming" : "outgoing")),
  }
}

function mapInvoice(raw: JsonRecord): AccountsInvoice {
  const id = String(raw._id || raw.id || raw.invoiceNumber || "")
  const invoiceNumber = String(raw.invoiceNumber || raw.id || id)
  const total = Number(raw.total || raw.grandTotal || 0)
  const paid = Number(raw.paid || raw.amountPaid || 0)
  const balance = Number(raw.balance || raw.balanceDue || Math.max(0, total - paid))

  return {
    id,
    _id: id,
    invoiceNumber,
    guestName: String(raw.guestName || raw.customerName || raw.companyName || ""),
    customerName: raw.customerName ? String(raw.customerName) : undefined,
    companyName: raw.companyName ? String(raw.companyName) : undefined,
    room: String(raw.room || ""),
    checkIn: raw.checkIn ? String(raw.checkIn) : undefined,
    checkOut: raw.checkOut ? String(raw.checkOut) : undefined,
    invoiceDate: raw.invoiceDate ? String(raw.invoiceDate) : undefined,
    dueDate: raw.dueDate ? String(raw.dueDate) : undefined,
    items: Array.isArray(raw.items) ? raw.items as JsonRecord[] : [],
    subtotal: Number(raw.subtotal || 0),
    taxes: Number(raw.taxes || raw.totalTax || 0),
    totalTax: Number(raw.totalTax || raw.taxes || 0),
    total,
    grandTotal: Number(raw.grandTotal || total),
    paid,
    amountPaid: Number(raw.amountPaid || paid),
    balance,
    balanceDue: Number(raw.balanceDue || balance),
    status: String(raw.status || "pending"),
    sent: Boolean(raw.sent),
    notes: raw.notes ? String(raw.notes) : undefined,
  }
}

function mapExpense(raw: JsonRecord): AccountsExpense {
  const id = String(raw._id || raw.id || "")
  return {
    id,
    _id: id,
    date: String(raw.date || raw.createdAt || ""),
    category: String(raw.category || ""),
    subCategory: raw.subCategory ? String(raw.subCategory) : undefined,
    description: String(raw.description || ""),
    amount: Number(raw.amount || 0),
    paidTo: raw.paidTo ? String(raw.paidTo) : undefined,
    vendor: String(raw.paidTo || raw.vendorName || ""),
    paymentMode: raw.paymentMode ? String(raw.paymentMode) : undefined,
    billNumber: raw.billNumber ? String(raw.billNumber) : undefined,
    department: raw.department ? String(raw.department) : undefined,
    approvedBy: raw.approvedBy ? String(raw.approvedBy) : undefined,
    status: String(raw.status || "approved"),
    taxAmount: Number(raw.taxAmount || 0),
    taxableAmount: Number(raw.taxableAmount || raw.amount || 0),
    gstRate: Number(raw.gstRate || 0),
  }
}

function mapLedgerAccount(raw: JsonRecord): LedgerAccount {
  const id = String(raw._id || raw.id || raw.code || "")
  return {
    id,
    _id: id,
    code: String(raw.code || ""),
    name: String(raw.name || ""),
    type: String(raw.type || ""),
    normalBalance: String(raw.normalBalance || "Dr"),
    isActive: raw.isActive !== false,
    balance: Number(raw.balance || 0),
    entries: Array.isArray(raw.entries) ? raw.entries as JsonRecord[] : [],
  }
}

function mapLedgerEntry(raw: JsonRecord): LedgerEntry {
  return {
    date: String(raw.date || ""),
    description: raw.description ? String(raw.description) : undefined,
    particulars: String(raw.particulars || raw.description || ""),
    reference: raw.reference ? String(raw.reference) : undefined,
    voucherNo: raw.voucherNo ? String(raw.voucherNo) : undefined,
    debit: Number(raw.debit || 0),
    credit: Number(raw.credit || 0),
    balance: Number(raw.balance || 0),
  }
}

class AccountsService {
  private listRequest = async <T,>(path: string, key: string, filters: AccountsListFilters, mapper: (raw: JsonRecord, index: number) => T) => {
    const response = await apiRequest<{ success: boolean; data: JsonRecord }>(`${path}${toQueryString(filters)}`)
    const page = pagination(response.data?.pagination as Partial<AccountsPagination> | undefined, filters)
    return {
      items: getArray(response.data, key).map(mapper),
      pagination: page,
      raw: response.data,
    }
  }

  // Dashboard & Summary
  async getDashboard() {
    const response = await apiRequest<{ success: boolean; data: JsonRecord }>("/accounts/dashboard")
    return {
      summary: response.data?.summary || {},
      recentTransactions: getArray(response.data, "recentTransactions").map((item, index) => mapTransaction(item, `TXN-${index + 1}`)),
      pendingPayments: getArray(response.data, "pendingPayments"),
    }
  }

  // Transactions
  async listTransactions(filters: AccountsListFilters = {}) {
    const result = await this.listRequest("/accounts/transactions", "transactions", filters, (transaction, index) => {
      const page = Number(filters.page || 1)
      const limit = Number(filters.limit || 25)
      return mapTransaction(transaction, `TXN-${String((page - 1) * limit + index + 1).padStart(3, "0")}`)
    })
    const summary = result.raw.summary as Partial<AccountsTransactionSummary> | undefined
    return {
      transactions: result.items,
      summary: {
        totalIncome: Number(summary?.totalIncome || 0),
        totalExpense: Number(summary?.totalExpense || 0),
        netAmount: Number(summary?.netAmount || 0),
      },
      pagination: result.pagination,
    }
  }

  async createTransaction(payload: CreateAccountsTransactionPayload) {
    const response = await apiRequest<{ success: boolean; data: JsonRecord }>("/accounts/transactions", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return mapTransaction(response.data || {})
  }

  // Invoices
  async listInvoices(filters: AccountsListFilters = {}) {
    const result = await this.listRequest("/accounts/invoices", "invoices", filters, mapInvoice)
    return { invoices: result.items, pagination: result.pagination }
  }

  async createInvoice(payload: JsonRecord) {
    const response = await apiRequest<{ success: boolean; data: JsonRecord }>("/accounts/invoices", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return mapInvoice(response.data || {})
  }

  async getInvoice(invoiceId: string) {
    const response = await apiRequest<{ success: boolean; data: JsonRecord }>(`/accounts/invoices/${invoiceId}`)
    return mapInvoice(response.data || {})
  }

  async updateInvoice(invoiceId: string, payload: JsonRecord) {
    const response = await apiRequest<{ success: boolean; data: JsonRecord }>(`/accounts/invoices/${invoiceId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
    return mapInvoice(response.data || {})
  }

  async sendInvoice(invoiceId: string, payload: JsonRecord = {}) {
    const response = await apiRequest<{ success: boolean; data: JsonRecord; message?: string }>(`/accounts/invoices/${invoiceId}/send`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return { invoice: mapInvoice(response.data || {}), message: response.message }
  }

  async collectInvoicePayment(invoiceId: string, payload: CreateAccountsReceiptPayload) {
    const response = await apiRequest<{ success: boolean; data: JsonRecord }>(`/accounts/invoices/${invoiceId}/payments`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return mapPayment(response.data || {})
  }

  // Receipts
  async listReceipts(filters: AccountsListFilters = {}) {
    const result = await this.listRequest("/accounts/receipts", "receipts", filters, mapPayment)
    return { receipts: result.items, pagination: result.pagination }
  }

  async createReceipt(payload: CreateAccountsReceiptPayload) {
    const response = await apiRequest<{ success: boolean; data: JsonRecord }>("/accounts/receipts", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return mapPayment(response.data || {})
  }

  // Payments
  async listPayments(filters: AccountsListFilters = {}) {
    const result = await this.listRequest("/accounts/payments", "payments", filters, mapPayment)
    return { payments: result.items, pagination: result.pagination }
  }

  async createPayment(payload: CreateAccountsPaymentPayload) {
    const response = await apiRequest<{ success: boolean; data: JsonRecord }>("/accounts/payments", {
      method: "POST",
      body: JSON.stringify({ ...payload, direction: payload.direction || "outgoing" }),
    })
    return mapPayment(response.data || {})
  }

  // Expenses
  async listExpenses(filters: AccountsListFilters = {}) {
    const result = await this.listRequest("/accounts/expenses", "expenses", filters, mapExpense)
    return { expenses: result.items, pagination: result.pagination }
  }

  async createExpense(payload: JsonRecord) {
    const response = await apiRequest<{ success: boolean; data: JsonRecord }>("/accounts/expenses", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return mapExpense(response.data || {})
  }

  // Ledger
  async getChartOfAccounts(filters: AccountsListFilters = {}) {
    const response = await apiRequest<{ success: boolean; data: JsonRecord }>(`/accounts/ledger/chart-of-accounts${toQueryString(filters)}`)
    return getArray(response.data, "accounts").map(mapLedgerAccount)
  }

  async getLedgerEntries(accountId: string, filters: AccountsListFilters = {}) {
    const response = await apiRequest<{ success: boolean; data: JsonRecord }>(`/accounts/ledger/${accountId}/entries${toQueryString(filters)}`)
    return {
      account: mapLedgerAccount((response.data?.account || {}) as JsonRecord),
      openingBalance: Number(response.data?.openingBalance || 0),
      entries: getArray(response.data, "entries").map(mapLedgerEntry),
      closingBalance: Number(response.data?.closingBalance || 0),
    }
  }

  // Day Book
  async getDayBook(filters: Pick<AccountsListFilters, "date"> = {}) {
    const response = await apiRequest<{ success: boolean; data: JsonRecord }>(`/accounts/day-book${toQueryString(filters)}`)
    return response.data
  }

  // Tax Reports
  async getGstReport(filters: Pick<AccountsListFilters, "month" | "year"> = {}) {
    const response = await apiRequest<{ success: boolean; data: JsonRecord }>(`/accounts/tax-reports/gst${toQueryString(filters)}`)
    return response.data
  }

  async getTdsReport(filters: AccountsListFilters = {}) {
    const response = await apiRequest<{ success: boolean; data: JsonRecord }>(`/accounts/tax-reports/tds${toQueryString(filters)}`)
    return response.data
  }

  // Financial Reports
  async getProfitLoss(filters: AccountsListFilters = {}) {
    const response = await apiRequest<{ success: boolean; data: JsonRecord }>(`/accounts/reports/profit-loss${toQueryString(filters)}`)
    return response.data
  }

  async getBalanceSheet(filters: Pick<AccountsListFilters, "asOfDate"> = {}) {
    const response = await apiRequest<{ success: boolean; data: JsonRecord }>(`/accounts/reports/balance-sheet${toQueryString(filters)}`)
    return response.data
  }

  // Advance Deposits
  async listAdvanceDeposits(filters: AccountsListFilters = {}) {
    const result = await this.listRequest("/accounts/advance-deposits", "deposits", filters, (item) => item)
    return { deposits: result.items, pagination: result.pagination }
  }

  async createAdvanceDeposit(payload: JsonRecord) {
    const response = await apiRequest<{ success: boolean; data: JsonRecord }>("/accounts/advance-deposits", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return response.data
  }

  // Refunds
  async listRefunds(filters: AccountsListFilters = {}) {
    const result = await this.listRequest("/accounts/refunds", "refunds", filters, (item) => item)
    return { refunds: result.items, pagination: result.pagination }
  }

  async createRefund(payload: JsonRecord) {
    const response = await apiRequest<{ success: boolean; data: JsonRecord }>("/accounts/refunds", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return response.data
  }

  // Company Billing
  async listCompanyBilling(filters: AccountsListFilters = {}) {
    const result = await this.listRequest("/accounts/company-billing", "bills", filters, (item) => item)
    return { bills: result.items, pagination: result.pagination }
  }

  async createCompanyBilling(payload: JsonRecord) {
    const response = await apiRequest<{ success: boolean; data: JsonRecord }>("/accounts/company-billing", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return response.data
  }

  // Service Transactions
  async listServiceTransactions(filters: AccountsListFilters = {}) {
    const result = await this.listRequest("/accounts/service-transactions", "serviceTransactions", filters, (item) => item)
    return { serviceTransactions: result.items, pagination: result.pagination }
  }

  // Journal Entries
  async listJournalEntries(filters: AccountsListFilters = {}) {
    const result = await this.listRequest("/accounts/journal-entries", "journalEntries", filters, (item) => item)
    return { journalEntries: result.items, pagination: result.pagination }
  }

  async createJournalEntry(payload: JsonRecord) {
    const response = await apiRequest<{ success: boolean; data: JsonRecord }>("/accounts/journal-entries", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return response.data
  }

  // Financial Years
  async listFinancialYears() {
    const response = await apiRequest<{ success: boolean; data: JsonRecord }>("/accounts/financial-years")
    return getArray(response.data, "financialYears")
  }

  async createFinancialYear(payload: JsonRecord) {
    const response = await apiRequest<{ success: boolean; data: JsonRecord }>("/accounts/financial-years", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return response.data
  }

  async updateFinancialYear(id: string, payload: JsonRecord) {
    const response = await apiRequest<{ success: boolean; data: JsonRecord }>(`/accounts/financial-years/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
    return response.data
  }

  // Audit Logs
  async listAuditLogs(filters: AccountsListFilters = {}) {
    const result = await this.listRequest("/accounts/audit-logs", "auditLogs", filters, (item) => item)
    return { auditLogs: result.items, pagination: result.pagination }
  }

  // Settings
  async getSettings(): Promise<AccountSettings> {
    const response = await apiRequest<{ success: boolean; data: AccountSettings }>("/accounts/settings")
    return response.data || {}
  }

  async updateSettings(payload: AccountSettings) {
    const response = await apiRequest<{ success: boolean; data: AccountSettings }>("/accounts/settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    })
    return response.data
  }

  // Tax Settings (aliases)
  async getTaxSettings(): Promise<AccountSettings> {
    return this.getSettings()
  }

  async updateTaxSettings(payload: AccountSettings) {
    return this.updateSettings(payload)
  }

  // Payment Methods Settings (aliases)
  async getPaymentMethodSettings(): Promise<AccountSettings> {
    return this.getSettings()
  }

  async updatePaymentMethodSettings(payload: AccountSettings) {
    return this.updateSettings(payload)
  }

  // Expense Categories Settings (aliases)
  async getExpenseCategorySettings(): Promise<AccountSettings> {
    return this.getSettings()
  }

  async updateExpenseCategorySettings(payload: AccountSettings) {
    return this.updateSettings(payload)
  }
}

// Export instance instead of static methods
export const accountsService = new AccountsService()

// Backward compatibility - export convenience functions
export async function getAccountsDashboard() {
  return accountsService.getDashboard()
}

export async function getAccountsTransactions(filters: AccountsListFilters = {}) {
  return accountsService.listTransactions(filters)
}

export async function createAccountsTransaction(payload: CreateAccountsTransactionPayload) {
  return accountsService.createTransaction(payload)
}

export async function getAccountsInvoices(filters: AccountsListFilters = {}) {
  return accountsService.listInvoices(filters)
}

export async function createAccountsInvoice(payload: JsonRecord) {
  return accountsService.createInvoice(payload)
}

export async function getAccountsInvoice(invoiceId: string) {
  return accountsService.getInvoice(invoiceId)
}

export async function updateAccountsInvoice(invoiceId: string, payload: JsonRecord) {
  return accountsService.updateInvoice(invoiceId, payload)
}

export async function sendAccountsInvoice(invoiceId: string, payload: JsonRecord = {}) {
  return accountsService.sendInvoice(invoiceId, payload)
}

export async function collectAccountsInvoicePayment(invoiceId: string, payload: CreateAccountsReceiptPayload) {
  return accountsService.collectInvoicePayment(invoiceId, payload)
}

export async function getAccountsReceipts(filters: AccountsListFilters = {}) {
  return accountsService.listReceipts(filters)
}

export async function createAccountsReceipt(payload: CreateAccountsReceiptPayload) {
  return accountsService.createReceipt(payload)
}

export async function getAccountsPayments(filters: AccountsListFilters = {}) {
  return accountsService.listPayments(filters)
}

export async function createAccountsPayment(payload: CreateAccountsPaymentPayload) {
  return accountsService.createPayment(payload)
}

export async function getAccountsExpenses(filters: AccountsListFilters = {}) {
  return accountsService.listExpenses(filters)
}

export async function createAccountsExpense(payload: JsonRecord) {
  return accountsService.createExpense(payload)
}

export async function getChartOfAccounts(filters: AccountsListFilters = {}) {
  return accountsService.getChartOfAccounts(filters)
}

export async function getLedgerEntries(accountId: string, filters: AccountsListFilters = {}) {
  return accountsService.getLedgerEntries(accountId, filters)
}

export async function getAccountsDayBook(filters: Pick<AccountsListFilters, "date"> = {}) {
  return accountsService.getDayBook(filters)
}

export async function getAccountsGstReport(filters: Pick<AccountsListFilters, "month" | "year"> = {}) {
  return accountsService.getGstReport(filters)
}

export async function getAccountsTdsReport(filters: AccountsListFilters = {}) {
  return accountsService.getTdsReport(filters)
}

export async function getAccountsProfitLoss(filters: AccountsListFilters = {}) {
  return accountsService.getProfitLoss(filters)
}

export async function getAccountsBalanceSheet(filters: Pick<AccountsListFilters, "asOfDate"> = {}) {
  return accountsService.getBalanceSheet(filters)
}

export async function getAccountsAdvanceDeposits(filters: AccountsListFilters = {}) {
  return accountsService.listAdvanceDeposits(filters)
}

export async function createAccountsAdvanceDeposit(payload: JsonRecord) {
  return accountsService.createAdvanceDeposit(payload)
}

export async function getAccountsRefunds(filters: AccountsListFilters = {}) {
  return accountsService.listRefunds(filters)
}

export async function createAccountsRefund(payload: JsonRecord) {
  return accountsService.createRefund(payload)
}

export async function getAccountsCompanyBilling(filters: AccountsListFilters = {}) {
  return accountsService.listCompanyBilling(filters)
}

export async function createAccountsCompanyBilling(payload: JsonRecord) {
  return accountsService.createCompanyBilling(payload)
}

export async function getAccountsServiceTransactions(filters: AccountsListFilters = {}) {
  return accountsService.listServiceTransactions(filters)
}

export async function getAccountsJournalEntries(filters: AccountsListFilters = {}) {
  return accountsService.listJournalEntries(filters)
}

export async function createAccountsJournalEntry(payload: JsonRecord) {
  return accountsService.createJournalEntry(payload)
}

export async function getAccountsFinancialYears() {
  return accountsService.listFinancialYears()
}

export async function createAccountsFinancialYear(payload: JsonRecord) {
  return accountsService.createFinancialYear(payload)
}

export async function updateAccountsFinancialYear(id: string, payload: JsonRecord) {
  return accountsService.updateFinancialYear(id, payload)
}

export async function getAccountsAuditLogs(filters: AccountsListFilters = {}) {
  return accountsService.listAuditLogs(filters)
}

export async function getAccountsSettings(): Promise<AccountSettings> {
  return accountsService.getSettings()
}

export async function updateAccountsSettings(payload: AccountSettings) {
  return accountsService.updateSettings(payload)
}

export const getAccountsTaxSettings = () => accountsService.getTaxSettings()
export const updateAccountsTaxSettings = (payload: AccountSettings) => accountsService.updateTaxSettings(payload)
export const getAccountsPaymentMethodSettings = () => accountsService.getPaymentMethodSettings()
export const updateAccountsPaymentMethodSettings = (payload: AccountSettings) => accountsService.updatePaymentMethodSettings(payload)
export const getAccountsExpenseCategorySettings = () => accountsService.getExpenseCategorySettings()
export const updateAccountsExpenseCategorySettings = (payload: AccountSettings) => accountsService.updateExpenseCategorySettings(payload)
