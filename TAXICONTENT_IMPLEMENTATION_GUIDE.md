# TaxiContent.tsx - Implementation Guide for Wallet & Smooth Animations

**Date**: 2025-12-31
**Objective**: Update TaxiContent.tsx to integrate wallet functionality and smooth driver animations
**Status**: Implementation Required

---

## Overview

This guide provides step-by-step instructions to update the TaxiContent.tsx file to:
1. Integrate the new BillingAlert component with wallet updates
2. Implement smooth driver location animations
3. Handle ride completion with automatic wallet credit

---

## Step 1: Add Required Imports

### Location: Top of TaxiContent.tsx (around line 25-40)

Add these imports:

```typescript
// Add to existing imports
import { useWallet } from '../../context/WalletContext';
import BillingAlert from '../../components/BillingAlert';
import {
  animateDriverMovement,
  initializeDriverAnimation,
  calculateBearing,
  isSignificantMovement,
} from '../../utils/driverAnimationHelper';
```

---

## Step 2: Add Wallet Hook

### Location: Inside TaxiContent component, near other hooks (around line 100-150)

Add the wallet hook:

```typescript
const TaxiContent = () => {
  // Existing hooks...
  const [currentLocation, setCurrentLocation] = useState(null);
  // ... other state variables

  // ADD THIS: Wallet hook
  const { walletBalance, updateWallet } = useWallet();

  // Rest of component...
```

---

## Step 3: Add State for Billing Alert

### Location: Near other state declarations (around line 150-200)

Add these state variables:

```typescript
// ADD THESE: Billing alert states
const [billingVisible, setBillingVisible] = useState(false);
const [billingData, setBillingData] = useState<any>(null);

// Update existing billDetails state to store more info
const [billDetails, setBillDetails] = useState({
  distance: '0 km',
  travelTime: '0 mins',
  charge: 0,
  driverName: '',
  vehicleType: '',
  fareBreakdown: {
    baseFare: 0,
    distanceCharge: 0,
    timeCharge: 0,
    surcharge: 0,
  },
  totalAmount: 0,
  walletBalance: 0,
});
```

---

## Step 4: Add Animated Values for Driver Locations

### Location: Near useRef declarations (around line 200-250)

Add animated values storage:

```typescript
// ADD THIS: Store animated values for each driver
const animatedDriverLocations = useRef<{
  [driverId: string]: {
    latitude: Animated.Value;
    longitude: Animated.Value;
    rotation: Animated.Value;
  };
}>({});

// Helper function to get or create animated values
const getAnimatedDriverLocation = (
  driverId: string,
  coordinate: { latitude: number; longitude: number }
) => {
  if (!animatedDriverLocations.current[driverId]) {
    animatedDriverLocations.current[driverId] = initializeDriverAnimation(coordinate);
  }
  return animatedDriverLocations.current[driverId];
};
```

---

## Step 5: Update Ride Completion Handler

### Location: Find the existing rideCompleted socket handler (around line 5855)

**REPLACE** the existing handler with this:

```typescript
useEffect(() => {
  if (!isMountedRef.current) return;

  const handleRideCompleted = (data) => {
    console.log('🎉 Ride completed in user app:', data);

    // Prepare billing data for the professional alert
    const fareBreakdown = data.fareBreakdown || {
      baseFare: data.baseFare || 50,
      distanceCharge: data.distanceCharge || 0,
      timeCharge: data.timeCharge || 0,
      surcharge: data.surcharge || 0,
    };

    const billingInfo = {
      distance: data.distance || travelledKm || 0,
      duration: data.duration || travelTime || 0,
      fareBreakdown: fareBreakdown,
      totalAmount: data.totalAmount || data.charge || fareBreakdown.baseFare + fareBreakdown.distanceCharge + fareBreakdown.timeCharge,
      walletBalance: data.walletBalance || walletBalance,
      driverName: data.driverName || acceptedDriver?.name || 'Driver',
      vehicleType: data.vehicleType || selectedRideType || 'bike',
    };

    // Update wallet balance from backend response
    if (data.walletBalance !== undefined) {
      updateWallet(data.walletBalance);
    }

    // Set billing data and show professional alert
    setBillingData(billingInfo);
    setBillingVisible(true);

    // Clear ride state
    AsyncStorage.removeItem('currentRideId');
    setRideStatus('completed');

    console.log('💰 Billing alert shown with wallet balance:', data.walletBalance);
  };

  const handleBillAlert = (data) => {
    console.log('💰 Bill alert received:', data);
    if (data.type === 'bill' && data.showBill) {
      handleRideCompleted(data);
    }
  };

  socket.on("rideCompleted", handleRideCompleted);
  socket.on("billAlert", handleBillAlert);

  return () => {
    socket.off("rideCompleted", handleRideCompleted);
    socket.off("billAlert", handleBillAlert);
  };
}, [travelledKm, travelTime, acceptedDriver, selectedRideType, walletBalance, updateWallet]);
```

---

## Step 6: Update Driver Location Handler for Smooth Animation

### Location: Find the driverLiveLocationUpdate socket handler (search for "driverLiveLocationUpdate")

**UPDATE** the handler to use smooth animations:

```typescript
useEffect(() => {
  if (!isMountedRef.current) return;

  const handleDriverLocationUpdate = (data: any) => {
    const { driverId, latitude, longitude, heading, bearing, speed } = data;

    // Skip if not the accepted driver (during ride)
    if (acceptedDriver && acceptedDriver.driverId !== driverId) {
      return;
    }

    const newLocation = { latitude, longitude };

    // For nearby drivers (before ride acceptance)
    if (!acceptedDriver) {
      setNearbyDrivers((prevDrivers) =>
        prevDrivers.map((driver) => {
          if (driver.driverId === driverId) {
            // Get or create animated values
            const animatedValues = getAnimatedDriverLocation(driverId, newLocation);

            // Calculate bearing if not provided
            const calculatedBearing = bearing || calculateBearing(
              driver.location,
              newLocation
            );

            // Only animate if movement is significant
            if (isSignificantMovement(driver.location, newLocation, 5)) {
              animateDriverMovement(animatedValues, newLocation, calculatedBearing);
            }

            return {
              ...driver,
              location: newLocation,
              heading: calculatedBearing,
            };
          }
          return driver;
        })
      );
    }
    // For accepted driver (during ride)
    else {
      const animatedValues = getAnimatedDriverLocation(driverId, newLocation);

      // Calculate bearing
      const calculatedBearing = bearing || heading || calculateBearing(
        driverLocation || newLocation,
        newLocation
      );

      // Animate driver movement
      if (driverLocation && isSignificantMovement(driverLocation, newLocation, 5)) {
        animateDriverMovement(animatedValues, newLocation, calculatedBearing);
      }

      // Update driver location state
      setDriverLocation(newLocation);

      // Update accepted driver info
      setAcceptedDriver((prev) => ({
        ...prev,
        location: newLocation,
        heading: calculatedBearing,
      }));
    }
  };

  socket.on('driverLiveLocationUpdate', handleDriverLocationUpdate);
  socket.on('driverLocationUpdate', handleDriverLocationUpdate);

  return () => {
    socket.off('driverLiveLocationUpdate', handleDriverLocationUpdate);
    socket.off('driverLocationUpdate', handleDriverLocationUpdate);
  };
}, [acceptedDriver, driverLocation, getAnimatedDriverLocation]);
```

---

## Step 7: Update Driver Marker Rendering

### Location: Find the MapView section where driver markers are rendered

**UPDATE** driver markers to use animated positions:

```typescript
{/* Nearby Drivers (before ride acceptance) */}
{!acceptedDriver && nearbyDrivers.map((driver) => {
  const animatedValues = animatedDriverLocations.current[driver.driverId];

  if (!animatedValues) {
    return (
      <Marker
        key={driver.driverId}
        coordinate={driver.location}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <Image
          source={require('../../../assets/driver-icon.png')}
          style={{ width: 40, height: 40 }}
        />
      </Marker>
    );
  }

  return (
    <Marker.Animated
      key={driver.driverId}
      coordinate={{
        latitude: animatedValues.latitude,
        longitude: animatedValues.longitude,
      }}
      rotation={animatedValues.rotation}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <Image
        source={require('../../../assets/driver-icon.png')}
        style={{ width: 40, height: 40 }}
      />
    </Marker.Animated>
  );
})}

{/* Accepted Driver (during ride) */}
{acceptedDriver && driverLocation && (
  <Marker.Animated
    key={acceptedDriver.driverId}
    coordinate={{
      latitude: animatedDriverLocations.current[acceptedDriver.driverId]?.latitude || driverLocation.latitude,
      longitude: animatedDriverLocations.current[acceptedDriver.driverId]?.longitude || driverLocation.longitude,
    }}
    rotation={animatedDriverLocations.current[acceptedDriver.driverId]?.rotation || 0}
    anchor={{ x: 0.5, y: 0.5 }}
  >
    <Image
      source={require('../../../assets/driver-car-icon.png')}
      style={{ width: 50, height: 50 }}
    />
  </Marker.Animated>
)}
```

---

## Step 8: Add BillingAlert Component to Render

### Location: At the end of the component's return statement (before closing View/Fragment)

Add the BillingAlert modal:

```typescript
return (
  <View style={styles.container}>
    {/* Existing UI components */}
    <MapView>
      {/* Map content */}
    </MapView>

    {/* Existing modals and UI */}

    {/* ADD THIS: Professional Billing Alert */}
    <BillingAlert
      visible={billingVisible}
      onClose={() => {
        setBillingVisible(false);
        // Reset ride state
        setRideStatus('idle');
        setAcceptedDriver(null);
        setDriverLocation(null);
        setBookedPickupLocation(null);
        setBookedDropoffLocation(null);
        setTravelledKm(0);
        setTravelTime(0);
      }}
      billing={billingData}
      onViewDetails={() => {
        // Navigate to ride history or details screen
        // navigation.navigate('RideHistory');
        console.log('View ride details');
      }}
    />
  </View>
);
```

---

## Step 9: Cleanup Animations on Unmount

### Location: Add a cleanup useEffect at the end of the component

```typescript
// Cleanup animations on unmount
useEffect(() => {
  return () => {
    // Stop all driver animations
    Object.values(animatedDriverLocations.current).forEach((animatedValues) => {
      animatedValues.latitude.stopAnimation();
      animatedValues.longitude.stopAnimation();
      animatedValues.rotation.stopAnimation();
    });
  };
}, []);
```

---

## Step 10: Remove Old Bill Modal (Optional)

### Location: Find the old bill modal (showBillModal)

You can either:
1. **Remove** the old bill modal completely, OR
2. **Keep it as fallback** in case the new one fails

If removing, search for:
```typescript
{showBillModal && (
  <Modal>
    {/* Old bill modal UI */}
  </Modal>
)}
```

And delete or comment it out.

---

## Summary of Changes

### Files Modified:
1. ✅ **TaxiContent.tsx** - Updated with wallet integration and animations

### New Features Added:
- ✅ Professional billing alert with wallet credit notification
- ✅ Smooth driver location animations (no jumps)
- ✅ Real-time wallet balance updates
- ✅ GPS jitter filtering (movements < 5 meters ignored)
- ✅ Direction-aware driver icon rotation
- ✅ Animated marker movements with easing

### Socket Events Handled:
- ✅ `rideCompleted` - Shows billing alert and updates wallet
- ✅ `billAlert` - Alternate event for billing
- ✅ `driverLiveLocationUpdate` - Smooth driver movement
- ✅ `driverLocationUpdate` - Fallback location event

### Backend Integration:
- ✅ Expects `walletBalance` in ride completion response
- ✅ Expects `fareBreakdown` object with billing details
- ✅ Updates wallet via WalletContext
- ✅ Persists to AsyncStorage automatically

---

## Testing Checklist

After implementation, test these scenarios:

### Wallet Integration:
- [ ] Wallet balance fetches on app launch
- [ ] Wallet updates after ride completion
- [ ] Billing alert shows correct amounts
- [ ] Wallet balance visible in menu sidebar
- [ ] Wallet persists across app restarts

### Driver Animations:
- [ ] Nearby drivers move smoothly (no jumps)
- [ ] Driver icons rotate based on direction
- [ ] Accepted driver animates during ride
- [ ] No stuttering or lag
- [ ] GPS jitter is filtered out

### Ride Completion:
- [ ] Professional billing alert appears
- [ ] All fare details displayed correctly
- [ ] Wallet credit message shown
- [ ] New balance updates immediately
- [ ] Can view ride details (optional)
- [ ] Can close alert and return to map

### Error Handling:
- [ ] Works if backend doesn't send walletBalance
- [ ] Graceful fallback for missing fareBreakdown
- [ ] Handles missing driver info
- [ ] Works offline (cached wallet balance)

---

## Backend API Requirements

The backend should send this structure on `rideCompleted`:

```typescript
{
  rideId: "RIDE1703123456789",
  distance: 5.2,            // km
  duration: 18,             // minutes
  fareBreakdown: {
    baseFare: 50,
    distanceCharge: 52,
    timeCharge: 18,
    surcharge: 0
  },
  totalAmount: 120,
  walletBalance: 1370,      // IMPORTANT: User's new wallet balance
  driverName: "John Doe",   // Optional
  vehicleType: "bike",      // Optional
  completedAt: "2025-12-31T10:30:00.000Z"
}
```

---

## Common Issues & Solutions

### Issue 1: Wallet balance not updating
**Solution**: Check if backend is sending `walletBalance` in the response. Enable socket logging:
```typescript
socket.on('rideCompleted', (data) => {
  console.log('Full ride completion data:', JSON.stringify(data, null, 2));
});
```

### Issue 2: Driver animations stuttering
**Solution**: Increase the movement threshold in `isSignificantMovement`:
```typescript
if (isSignificantMovement(oldLocation, newLocation, 10)) { // Increased to 10 meters
  animateDriverMovement(...);
}
```

### Issue 3: Billing alert not showing
**Solution**: Verify `setBillingVisible(true)` is called and `billingData` is set:
```typescript
console.log('Billing visible:', billingVisible);
console.log('Billing data:', billingData);
```

---

## Performance Optimization

### Throttle Location Updates (Optional):
```typescript
import { throttle } from 'lodash';

const throttledLocationUpdate = useCallback(
  throttle((data) => {
    handleDriverLocationUpdate(data);
  }, 1000), // Update max once per second
  []
);

socket.on('driverLiveLocationUpdate', throttledLocationUpdate);
```

### Reduce Animation Duration for Faster Updates:
```typescript
// In driverAnimationHelper.ts
const duration = Math.min(Math.max(distance * 5000, 500), 2000); // Faster
```

---

## Next Steps

1. ✅ Apply all changes from this guide to TaxiContent.tsx
2. ✅ Test wallet integration thoroughly
3. ✅ Test smooth animations with real device (not just emulator)
4. ✅ Verify backend sends correct data structure
5. ✅ Handle edge cases (no internet, missing data, etc.)

---

**Status**: Ready for Implementation
**Priority**: High
**Estimated Time**: 1-2 hours for implementation + testing

All required helper files (WalletContext, BillingAlert, driverAnimationHelper) are already created!
