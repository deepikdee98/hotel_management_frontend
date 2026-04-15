# Quick Start Guide - Hotel Management Frontend

## Prerequisites
- Backend running on `http://localhost:5000`
- MongoDB connected with sample data
- Node.js + npm/pnpm

## Setup

```bash
cd hotel-management-frontend
npm install
npm run dev  # Starts on http://localhost:3000
```

## Default Test Users (if mock mode active)

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Super Admin | superadmin@hotel.com | password | All hotels, system config |
| Hotel Admin | admin@hotel.com | password | Single hotel operations |
| Staff | staff@hotel.com | password | Limited guest interactions |

## File Changes Summary

### Created:
- ✅ `lib/backend-api.ts` - Centralized API client (285 lines)
- ✅ `API_INTEGRATION_REPORT.md` - Detailed endpoint coverage report

### Modified:
- ✅ `lib/auth-context.tsx` - Backend login/logout + token storage
- ✅ 12 frontend pages - Integrated with live backend data + mock fallback

## Page Navigation

### Super Admin Routes:
- `/super-admin` - Dashboard (total hotels, stats)
- `/super-admin/hotels` - Hotel management (CRUD)

### Admin Routes:
- `/admin` - Dashboard (occupancy, staff, reservations)
- `/admin/staff/page` - Staff management (CRUD)
- `/admin/front-office` - Room & reservation overview
- `/admin/front-office/reservation` - Reservation CRUD
- `/admin/front-office/check-in` - Guest check-in flow
- `/admin/front-office/in-house` - In-house guests & billing

### Staff Routes:
- `/staff` - Dashboard (available rooms, check-ins)
- `/staff/reservations` - Reservation management
- `/staff/rooms` - Room status management
- `/staff/guests` - Guest directory

## API Integration Flow

```
Frontend Component
  └─ useEffect on mount
    └─ Call API function (e.g., getFrontOfficeReservations())
      └─ apiRequest<T>() wrapper
        └─ Retrieve token from sessionStorage
        └─ Inject Authorization header
        └─ Fetch from backend
      └─ Catch error → Use mock data
  └─ setState with response
  └─ Render data
```

## Common Patterns

### Fetching Data in a Page:
```typescript
'use client'

import { useEffect, useState } from 'react'
import { getFrontOfficeReservations, Reservation } from '@/lib/backend-api'

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getFrontOfficeReservations()
        setReservations(data)
      } catch {
        // Error logged, using mock data fallback
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div>
      {loading ? <div>Loading...</div> : <ReservationsList data={reservations} />}
    </div>
  )
}
```

### Creating a Resource:
```typescript
const handleCreate = async (formData: CreateReservationPayload) => {
  try {
    const result = await createFrontOfficeReservation({
      guestName: formData.name,
      phone: formData.phone,
      email: formData.email,
      checkInDate: formData.checkIn,
      checkOutDate: formData.checkOut,
      roomType: selectedRoom.type,
      room: selectedRoom.id,
      totalAmount: calculateTotal(formData),
    })
    // Handle success
    toast.success('Reservation created')
  } catch (error) {
    // Fallback to local state update
    console.error(error)
  }
}
```

## Troubleshooting

### Issue: "Connect failed" or "Network error"
**Solution:** Verify backend is running:
```bash
curl http://localhost:5000/auth/login
# Should get a request body error, not connection refused
```

### Issue: Login shows mock users even with backend running
**Solution:** Check Network tab in DevTools:
- POST `/auth/login` should show 200 response
- Check `sessionStorage` for `hotel_manager_tokens` key

### Issue: API calls return 401 Unauthorized
**Solution:** Token may be expired
- Clear sessionStorage and login again
- Check Authorization header in Network tab

### Issue: TypeScript errors after editing
**Solution:** Run type check:
```bash
npx tsc --noEmit
```

## API Function Reference

### Super Admin:
- `getSuperAdminDashboard()` → Dashboard stats
- `getSuperAdminHotels(search?)` → List hotels
- `createSuperAdminHotel(payload)` → New hotel
- `updateSuperAdminHotelStatus(id, status)` → Toggle status
- `deleteSuperAdminHotel(id)` → Delete hotel

### Admin:
- `getAdminDashboard()` → Dashboard with multiple stats
- `getAdminStaff(search?, role?)` → List staff
- `getAdminStaffSummary()` → Staff statistics
- `createAdminStaff(payload)` → New staff member
- `updateAdminStaffStatus(id, isActive)` → Toggle active
- `deleteAdminStaff(id)` → Remove staff

### Front Office:
- `getFrontOfficeRooms(params?)` → Room inventory
- `updateFrontOfficeRoomStatus(roomId, status)` → Update status
- `getFrontOfficeReservations(params?)` → All reservations
- `createFrontOfficeReservation(payload)` → New reservation
- `updateFrontOfficeReservationStatus(id, status)` → Change status
- `getInHouseGuests()` → Current guests checked in
- `createCheckIn(payload)` → Process check-in

### Staff:
- `getStaffDashboard()` → Staff view of dashboard
- `getStaffReservations()` → Staff's reservations
- `getStaffGuests(search?)` → Guest directory
- `createStaffGuest(payload)` → Register guest

---

**Full documentation:** See `API_INTEGRATION_REPORT.md`
