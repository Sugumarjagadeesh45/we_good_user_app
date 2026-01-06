# Ride Booking – Vehicle Type Based Driver Alert System

**Professional Requirement & Implementation Notes**

## Overview

The current codebase (Eazygo/user-app_Besafe) is working perfectly.

Using the same logic and functions, a new project has been started for a ride booking application, and the implementation is almost complete.

However, a **critical issue** has been identified in the new project.

---

## Current Issue

When a user books a ride, the ride alert is sent to **all online drivers**.

At the same time, the vehicle type of all online drivers **automatically changes to taxi**, which should **never happen**.

This behavior is **incorrect**.

---

## Correct Expected Behavior

When a user books a ride, the user must select a vehicle type:

- `taxi`
- `port`
- `bike`

⚠️ **Vehicle types must always be stored and compared in lowercase only.**

Only drivers who are:

1. **Online**
2. **AND** have the **same vehicle type** as selected by the user

should receive the ride alert.

Drivers with other vehicle types must **NOT** receive the ride request.

A driver's vehicle type must **NEVER** change automatically:

- ❌ Not during ride booking
- ❌ Not during alert broadcasting
- ❌ Not during socket events
- ❌ Not during API calls

---

## Correct Ride Alert Flow

### Step 1: User Books a Ride

User selects:

- Pickup location
- Drop location
- Vehicle type (`taxi` | `port` | `bike`)

Ride is created with the selected vehicle type.

### Step 2: Backend Filters Drivers

1. Fetch only **online drivers**
2. Filter drivers using:

```javascript
driver.vehicleType === ride.vehicleType
```

### Step 3: Send Ride Alert

- Send ride request **only** to matching drivers
- Other drivers must be **ignored**

---

## Important Backend Rules

### Vehicle Type Rules

Vehicle type is **immutable** during ride booking.

Must be set only at:

- Driver registration
- Profile update

Must **NOT** be modified in:

- ❌ Ride creation logic
- ❌ Socket events
- ❌ Notification logic
- ❌ Ride broadcast functions

---

## Example Database Structure

### Driver Model

```javascript
{
  "_id": "driverId",
  "name": "Driver Name",
  "isOnline": true,
  "vehicleType": "bike"   // taxi | port | bike (lowercase only)
}
```

### Ride Model

```javascript
{
  "_id": "rideId",
  "userId": "userId",
  "vehicleType": "port",
  "pickupLocation": {},
  "dropLocation": {},
  "status": "requested"
}
```

---

## Sample Backend Logic (Reference)

```javascript
const matchingDrivers = onlineDrivers.filter(driver =>
  driver.vehicleType === ride.vehicleType
);

// Send alert only to matching drivers
matchingDrivers.forEach(driver => {
  sendRideAlert(driver.socketId, ride);
});
```

---

## Important Notes (Must Follow)

- ❌ Never update driver vehicle type during ride booking
- ❌ Never hardcode `taxi` anywhere in ride flow
- ✅ Always compare vehicle types using **lowercase**
- ✅ Ride alerts must be **vehicle-type specific**
- ✅ Driver vehicle type should only change via:
  - Driver profile update API
  - Admin panel update (if applicable)

---

## Key APIs / Endpoints (Example)

### Create Ride

**Endpoint:** `POST /api/rides/create`

**Body:**

```json
{
  "pickup": {},
  "drop": {},
  "vehicleType": "bike"
}
```

### Get Online Drivers (Filtered)

**Endpoint:** `GET /api/drivers/online?vehicleType=bike`

### Send Ride Alert (Socket/Event)

**Event:** `ride_request`

**Target:** Drivers with matching `vehicleType`

---

## Final Conclusion

The system must ensure that:

1. Vehicle type selection by the user **strictly controls** driver notifications
2. Driver vehicle types **remain unchanged**
3. Only **relevant drivers** receive ride alerts

This logic should be followed consistently across:

- Backend APIs
- Socket events
- Database updates

---

## Implementation Checklist

Before deploying the new project, verify:

- [ ] User can select vehicle type during booking
- [ ] Backend filters drivers by `vehicleType` before sending alerts
- [ ] Driver `vehicleType` field is never modified during ride flow
- [ ] All vehicle type comparisons use lowercase
- [ ] Socket events target only matching drivers
- [ ] Ride model stores selected `vehicleType`
- [ ] Database queries include `vehicleType` filter
- [ ] No hardcoded `"taxi"` values in ride booking logic
