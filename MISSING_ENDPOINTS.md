# Missing/Unavailable Endpoints - Detailed Reference

## Overview

The backend has **137 total endpoints** across 12 route modules. **21 endpoints are wired** to the frontend. This document details the **116 unwired endpoints** organized by category.

---

## 📊 Endpoint Status Summary

| Module | Total | Wired | Pending | Usage |
|--------|-------|-------|---------|-------|
| **Auth** | 3 | 2 | 1 | Login, Logout, (Refresh) |
| **Super Admin** | 35 | 5 | 30 | Hotels, Settings, Auth, Modules |
| **Admin: Staff** | 8 | 6 | 2 | Staff CRUD, Roles |
| **Admin: Front Office** | 35 | 6 | 29 | Rooms, Reservations, Guests, Setup |
| **Admin: Accounting** | 25 | 0 | 25 | ⚠️ **Not yet wired** |
| **Admin: POS** | 18 | 0 | 18 | ⚠️ **Not yet wired** |
| **Staff** | 8 | 4 | 4 | Dashboard, Reservations, Guests |
| **Additional** | 5 | 0 | 5 | Night Audit, Reports preview |
| **TOTAL** | 137 | 21 | 116 | |

---

## 🟡 Category 1: AUTH Module (3 endpoints)

### Wired (2):
- ✅ POST `/auth/login` - User login with JWT response
- ✅ POST `/auth/logout` - Clear session and tokens

### Not Wired (1):
- ⚠️ POST `/auth/refresh` - Refresh expired access token
  - **Backend Path:** `/auth/refresh`
  - **Purpose:** Get new accessToken using refreshToken
  - **When to Wire:** After 1 hour when token expires; implement auto-retry logic
  - **Why Not Wired Yet:** Basic structure in place; needs exercising with real token expiry
  - **Payload:** `{ refreshToken: string }`
  - **Response:** `{ success: boolean, data: { accessToken, refreshToken } }`

---

## 🔴 Category 2: ACCOUNTING Module (25 endpoints) - ⚠️ NOT WIRED

**Status:** Backend endpoints fully implemented; frontend pages not yet created

**Routes File:** `/routes/Admin/Accounting/*.js` (multiple sub-routes)

### Accounting Dashboard (2):
- GET `/admin/accounts/dashboard` - Overview stats
- GET `/admin/accounts/summary` - Period summary

### Ledger Operations (6):
- GET `/admin/accounts/ledger` - List ledger entries
- POST `/admin/accounts/ledger` - Create entry
- GET `/admin/accounts/ledger/{id}` - Get specific entry
- PUT `/admin/accounts/ledger/{id}` - Update entry
- DELETE `/admin/accounts/ledger/{id}` - Delete entry
- GET `/admin/accounts/ledger/report` - Export report

### Day Book (4):
- GET `/admin/accounts/daybook` - Daily transactions
- POST `/admin/accounts/daybook` - Record transaction
- GET `/admin/accounts/daybook/{date}` - Specific day
- GET `/admin/accounts/daybook/report` - Day summary

### Expense Management (6):
- GET `/admin/accounts/expenses` - List expenses
- POST `/admin/accounts/expenses` - Add expense
- GET `/admin/accounts/expenses/{id}` - Get expense
- PUT `/admin/accounts/expenses/{id}` - Update expense
- DELETE `/admin/accounts/expenses/{id}` - Delete expense
- GET `/admin/accounts/expenses/categories` - Expense types

### Financial Reports (7):
- GET `/admin/accounts/balance-sheet` - Balance sheet
- GET `/admin/accounts/profit-loss` - P&L report
- GET `/admin/accounts/tax-reports` - Tax summary
- GET `/admin/accounts/invoices` - Billing records
- GET `/admin/accounts/payments` - Payment history
- GET `/admin/accounts/receipts` - Receipt register
- GET `/admin/accounts/transactions` - All transactions

**Why Not Wired:** Frontend admin accounting pages don't exist in `/app/admin/accounts/`

**To Wire When Needed:**
```typescript
// lib/backend-api.ts - Add these functions:
export async function getAccountingDashboard() {
  return apiRequest('/admin/accounts/dashboard')
}
export async function getLedger() {
  return apiRequest('/admin/accounts/ledger')
}
// ... etc for each endpoint
```

Then create `/app/admin/accounts/page.tsx` components referencing these functions.

---

## 🔴 Category 3: POS Module (18 endpoints) - ⚠️ NOT WIRED

**Status:** Backend fully implemented; frontend POS pages minimal/not integrated

**Routes File:** `/routes/Admin/POS/*.js`

### Order Management (8):
- GET `/admin/pos/orders` - List orders
- POST `/admin/pos/orders` - Create order
- GET `/admin/pos/orders/{id}` - Get order
- PUT `/admin/pos/orders/{id}` - Update order
- DELETE `/admin/pos/orders/{id}` - Cancel order
- GET `/admin/pos/orders/summary` - Daily POS summary
- POST `/admin/pos/orders/{id}/complete` - Mark complete
- POST `/admin/pos/orders/{id}/refund` - Process refund

### Product/Menu Management (5):
- GET `/admin/pos/items` - Menu items
- POST `/admin/pos/items` - Add item
- PUT `/admin/pos/items/{id}` - Update item
- DELETE `/admin/pos/items/{id}` - Delete item
- GET `/admin/pos/categories` - Item categories

### Promotions & Discounts (5):
- GET `/admin/pos/promotions` - Active promotions
- POST `/admin/pos/promotions` - Create promotion
- PUT `/admin/pos/promotions/{id}` - Update promotion
- GET `/admin/pos/discounts` - Discount codes
- POST `/admin/pos/discounts` - Add discount

**Why Not Wired:** POS feature requires complex order UI; designed for future phase

**To Wire When Needed:** Similar pattern to front office:
```typescript
export async function getPOSOrders() {
  return apiRequest('/admin/pos/orders')
}
export async function createPOSOrder(payload) {
  return apiRequest('/admin/pos/orders', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}
```

---

## 🔴 Category 4: REPORTS Module (10+ endpoints) - ⚠️ NOT WIRED

**Status:** Backend endpoints available; frontend reporting UI not implemented

**Routes File:** `/routes/Admin/Reports/*.js`

### Standard Reports (6):
- GET `/admin/reports/revenue` - Revenue by period
- GET `/admin/reports/occupancy` - Room occupancy stats
- GET `/admin/reports/guests` - Guest statistics
- GET `/admin/reports/staff` - Staff performance
- GET `/admin/reports/inventory` - Inventory report
- GET `/admin/reports/daily` - Daily summary report

### Custom Reporting (4):
- POST `/admin/reports/custom` - Generate custom report
- GET `/admin/reports/custom/{id}` - Get saved report
- PUT `/admin/reports/custom/{id}` - Update report
- DELETE `/admin/reports/custom/{id}` - Delete report

**Why Not Wired:** Advanced reporting UI design needed; lower priority than core operations

---

## 🔴 Category 5: HOUSEKEEPING Module (10+ endpoints) - ⚠️ NOT WIRED

**Status:** Backend implemented; frontend housekeeping pages exist but not integrated

**Routes File:** `/routes/Admin/Housekeeping/*.js`

### Task Management (6):
- GET `/admin/housekeeping/tasks` - List tasks
- POST `/admin/housekeeping/tasks` - Create task
- GET `/admin/housekeeping/tasks/{id}` - Get task
- PUT `/admin/housekeeping/tasks/{id}` - Update task
- DELETE `/admin/housekeeping/tasks/{id}` - Delete task
- PUT `/admin/housekeeping/tasks/{id}/complete` - Mark complete

### Staff Assignment (4):
- GET `/admin/housekeeping/assignments` - View assignments
- POST `/admin/housekeeping/assignments` - Assign staff
- PUT `/admin/housekeeping/assignments/{id}` - Change assignment
- DELETE `/admin/housekeeping/assignments/{id}` - Remove assignment

**Why Not Wired:** Housekeeping pages exist (`/app/admin/housekeeping/`) but not connected to backend

**To Wire:** Add to `/app/admin/housekeeping/page.tsx`:
```typescript
const [tasks, setTasks] = useState([])
useEffect(() => {
  getHousekeepingTasks().then(setTasks)
}, [])
```

---

## 🔴 Category 6: SETUP/CONFIGURATION Modules (30+ endpoints) - ⚠️ NOT WIRED

**Status:** Backend fully implemented; frontend setup pages not yet called

**Routes:**
- `/routes/Admin/FrontOffice/SetUp/addRoomRoutes.js`
- `/routes/Admin/FrontOffice/SetUp/roomTypeRoutes.js`
- `/routes/Admin/FrontOffice/SetUp/ratePlanRoutes.js`
- `/routes/Admin/FrontOffice/SetUp/hotelConfigRoutes.js`
- `/routes/Admin/FrontOffice/Setup/serviceCodeRoutes.js`

### Room Types Management (6):
- GET `/admin/front-office/setup/room-types` - List room types
- POST `/admin/front-office/setup/room-types` - Create type
- PUT `/admin/front-office/setup/room-types/{id}` - Update type
- DELETE `/admin/front-office/setup/room-types/{id}` - Delete type
- GET `/admin/front-office/setup/room-types/{id}/rate-plans` - Get rates for type
- POST `/admin/front-office/setup/room-types/{id}/rate-plans` - Add rate

### Rate Plans (6):
- GET `/admin/front-office/setup/rate-plans` - List rate plans
- POST `/admin/front-office/setup/rate-plans` - Create rate plan
- PUT `/admin/front-office/setup/rate-plans/{id}` - Update plan
- DELETE `/admin/front-office/setup/rate-plans/{id}` - Delete plan
- GET `/admin/front-office/setup/rate-plans/{id}/details` - Plan details
- POST `/admin/front-office/setup/rate-plans/{id}/copy` - Clone plan

### Hotel Configuration (8):
- GET `/admin/front-office/setup/hotel-config` - Get config
- PUT `/admin/front-office/setup/hotel-config` - Update config
- GET `/admin/front-office/setup/floors` - List floors
- POST `/admin/front-office/setup/floors` - Add floor
- GET `/admin/front-office/setup/amenities` - Available amenities
- POST `/admin/front-office/setup/amenities` - Add amenity
- GET `/admin/front-office/setup/service-codes` - Service codes
- POST `/admin/front-office/setup/service-codes` - Add service code

### Lookups & Dropdowns (10+):
- GET `/admin/front-office/lookups/room-status` - Status options
- GET `/admin/front-office/lookups/reservation-status` - Reservation statuses
- GET `/admin/front-office/lookups/guest-types` - Guest Type options
- GET `/admin/front-office/lookups/id-types` - ID document types
- ... and more

**Why Not Wired:** Setup is admin-level configuration; not part of daily operations flow

---

## 🟡 Category 7: SUPER-ADMIN Settings & Modules (30 endpoints) - ⚠️ PARTIALLY WIRED

### Wired (5):
- ✅ GET `/super-admin/dashboard/stats`
- ✅ GET `/super-admin/hotels`
- ✅ POST `/super-admin/hotels`
- ✅ PUT `/super-admin/hotels/{id}/status`
- ✅ DELETE `/super-admin/hotels/{id}`

### Not Wired (25):
**Security Settings (6):**
- GET `/super-admin/settings/security` - Security config
- PUT `/super-admin/settings/security` - Update security
- GET `/super-admin/settings/security/roles` - Role definitions
- PUT `/super-admin/settings/security/roles` - Update roles
- GET `/super-admin/settings/security/permissions` - Permission matrix
- POST `/super-admin/settings/security/audit-log` - Audit trails

**Appearance Settings (4):**
- GET `/super-admin/settings/appearance` - Theme config
- PUT `/super-admin/settings/appearance` - Update theme
- POST `/super-admin/settings/appearance/logo` - Upload logo
- POST `/super-admin/settings/appearance/colors` - Update colors

**Notification Settings (5):**
- GET `/super-admin/settings/notifications` - Notification config
- PUT `/super-admin/settings/notifications` - Update settings
- GET `/super-admin/notifications/list` - Notification history
- POST `/super-admin/notifications/send` - Send notification
- DELETE `/super-admin/notifications/{id}` - Clear notification

**Module Management (6):**
- GET `/super-admin/modules` - Available modules
- POST `/super-admin/modules` - Activate module
- DELETE `/super-admin/modules/{id}` - Deactivate module
- GET `/super-admin/module-requests` - Module requests from hotels
- PUT `/super-admin/module-requests/{id}` - Approve/reject request
- GET `/super-admin/modules/usage` - Module usage stats

**Profile & Preferences (4):**
- GET `/super-admin/profile` - Super admin profile
- PUT `/super-admin/profile` - Update profile
- POST `/super-admin/profile/password` - Change password
- GET `/super-admin/profile/preferences` - Saved preferences

**Why Not Wired:** Settings accessed less frequently; can be added later

---

## 🟡 Category 8: ADDITIONAL Advanced Features (15+ endpoints) - ⚠️ NOT WIRED

### Guest Management Extensions (5):
- GET `/admin/front-office/guests` - Full guest directory
- POST `/admin/front-office/guests` - Create guest profile
- GET `/admin/front-office/guests/{id}/history` - Guest history
- GET `/admin/front-office/guests/{id}/reviews` - Guest reviews
- POST `/admin/front-office/guests/{id}/reviews` - Leave review

### Folio/Billing (4):
- GET `/admin/front-office/folio/{reservationId}` - Guest bill
- POST `/admin/front-office/folio/{reservationId}/charge` - Add charge
- POST `/admin/front-office/folio/{reservationId}/payment` - Process payment
- POST `/admin/front-office/folio/{reservationId}/print` - Print bill

### Room Operations (6):
- POST `/admin/front-office/rooms/{id}/block` - Block room
- POST `/admin/front-office/rooms/{id}/unblock` - Unblock room
- POST `/admin/front-office/rooms/{id}/maintenance` - Mark maintenance
- GET `/admin/front-office/rooms/{id}/history` - Room usage history
- POST `/admin/front-office/rooms/{id}/transfer` - Move guest to another room
- GET `/admin/front-office/rooms/inventory` - Room inventory

### Night Audit (3):
- GET `/admin/front-office/night-audit/overview` - Night audit preview
- POST `/admin/front-office/night-audit/process` - Process night audit
- GET `/admin/front-office/night-audit/report` - Audit report

---

## 🚀 How to Wire Missing Endpoints

### Step 1: Create API Function in `lib/backend-api.ts`

**Example: Add accounting dashboard**
```typescript
export async function getAccountingDashboard() {
  return apiRequest<{ stats: JsonRecord; data: JsonRecord }>(
    '/admin/accounts/dashboard'
  )
}
```

### Step 2: Create/Update Frontend Page

**Example: `/app/admin/accounts/page.tsx`** (if doesn't exist)
```typescript
'use client'
import { useEffect, useState } from 'react'
import { getAccountingDashboard } from '@/lib/backend-api'

export default function AccountingPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const result = await getAccountingDashboard()
        setData(result)
      } catch (error) {
        console.error('Failed to load accounting data', error)
        // Use mock data or show error
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return (
    <div>
      {loading ? 'Loading...' : <RenderAccountingUI data={data} />}
    </div>
  )
}
```

### Step 3: Test
```typescript
// Browser console or test:
const accounting = await getAccountingDashboard()
console.log(accounting)  // Should see real data
```

---

## Summary Checklist for Integration

To wire any of the 116 missing endpoints:

- [ ] Verify endpoint exists in backend: `grep -r "router.get\|router.post" /routes/`
- [ ] Test endpoint manually: `curl -H "Authorization: Bearer <token>" http://localhost:5000/endpoint`
- [ ] Add facade function to `lib/backend-api.ts`
- [ ] Create or update frontend page component
- [ ] Add `useEffect` to fetch data on mount
- [ ] Map response using appropriate transformer function
- [ ] Add error handling + mock fallback
- [ ] Test in browser: Check Network tab for API call
- [ ] Verify TypeScript compilation: `npx tsc --noEmit`

---

## Priority for Future Phases

1. **HIGH:** Accounting (ledger, expenses, reports) - Financial tracking is core
2. **HIGH:** Token refresh - Prevents 401 errors after 1 hour
3. **MEDIUM:** POS orders - Revenue-generating feature
4. **MEDIUM:** Reports - Management dashboards
5. **MEDIUM:** Setup/Configuration - Reduces manual admin work
6. **LOW:** Housekeeping - Operational feature, not critical path
7. **LOW:** Advanced features - Nice-to-have enhancements

---

## Contact Point

If an endpoint isn't working or needs debugging:

1. Check `API_INTEGRATION_REPORT.md` for wired endpoint status
2. Check backend `/routes/*.js` files for endpoint definition
3. Test endpoint directly: `curl http://localhost:5000/endpoint -H "Authorization: Bearer <token>"`
4. Check backend console for errors
5. Verify token is valid and not expired
6. Check backend database has related records

**All 116 missing endpoints are available in the backend and can be wired using the same pattern demonstrated in the 21 wired endpoints.**
