# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Eazygo** (internally named "user-app_Besafe"), a React Native mobile application for ride-hailing and shopping services. The app supports both taxi booking with real-time driver tracking and an e-commerce shopping experience.

## Development Commands

### Running the App

```bash
# Start Metro bundler
npm start

# Run on Android (emulator or connected device)
npm run android

# Run on iOS (simulator or connected device)
npm run ios
```

### iOS-specific Setup

CocoaPods dependencies must be installed before running on iOS:

```bash
# First time only (or after updating dependencies)
bundle install

# Every time you update native dependencies
bundle exec pod install
```

### Other Commands

```bash
# Linting
npm run lint

# Run tests
npm test
```

## Architecture Overview

### App Structure

The app uses React Navigation with a stack navigator and multiple context providers for global state management:

**Provider Hierarchy** (in [App.tsx](App.tsx)):
```
LanguageProvider
  └─ WalletProvider
      └─ AddressProvider
          └─ CartProvider
              └─ NavigationContainer
```

### Navigation Flow

1. **Initial Load**: [App.tsx](App.tsx) checks AsyncStorage for `hasLaunched` and auth tokens (`authToken` or `userToken`)
2. **Route Logic**:
   - If `userToken` exists → Navigate to `Screen1` (main app)
   - If first launch → Navigate to `SplashScreen`
   - Otherwise → Navigate to `WelcomeScreen3` (login)

### Main Screen Tabs

[Screen1.tsx](src/Screen1.tsx) is the main app screen with two tabs:
- **Taxi Tab**: Real-time ride booking with map integration
- **Shopping Tab**: E-commerce product browsing and checkout

### Key Features

#### Taxi Booking
- Real-time driver location tracking via Socket.IO
- Google Maps integration with directions
- Firebase Authentication
- Smooth driver animations (handled by [driverAnimationHelper.ts](src/utils/driverAnimationHelper.ts))
- Professional ride completion billing alerts

#### Shopping
- Product catalog with categories
- Shopping cart functionality
- Address management
- Enhanced checkout flow
- Order history

#### Wallet System
- Global wallet state managed by [WalletContext.tsx](src/context/WalletContext.tsx)
- Real-time balance updates via Socket.IO events (`rideCompleted`, `walletUpdate`)
- Persistent storage in AsyncStorage
- Automatic wallet credit after ride completion

## Google Maps API Configuration

### API Key Location

The Google Maps API key is stored in [src/constants/googleMapKey.js](src/constants/googleMapKey.js):
```javascript
export const GOOGLE_MAP_KEY = "AIzaSyA9Ef953b2mO_rr940k-3OclHSZp3ldM2o"
```

### Services Using Google Maps API

The app uses **ONLY Google Maps API** for all mapping services:

1. **Places Autocomplete API** - Location search with place types and icons
2. **Geocoding API** - Reverse geocoding (coordinates to address)
3. **Directions API** - Route calculation and real-time navigation
4. **Maps SDK** - Map rendering and display

### Migration from Open-Source Services

**REMOVED Services** (No longer used):
- ❌ OpenStreetMap Nominatim API (location search & reverse geocoding)
- ❌ OSRM (Open Source Routing Machine) for route calculation

**Current Implementation** (Google Maps API):
- ✅ Google Places Autocomplete for location search ([TaxiContent.tsx](src/Screen1/Taxibooking/TaxiContent.tsx:2535))
- ✅ Google Geocoding API for reverse geocoding ([TaxiContent.tsx](src/Screen1/Taxibooking/TaxiContent.tsx:3288))
- ✅ Google Directions API for route calculation ([TaxiContent.tsx](src/Screen1/Taxibooking/TaxiContent.tsx:2466))
- ✅ Google Directions API for real-time routing ([TaxiContent.tsx](src/Screen1/Taxibooking/TaxiContent.tsx:547))

### Place Type Icons

Location search suggestions display contextual icons based on Google Places API types:
- ✈️ Airport → `flight` icon
- 🚂 Train/Railway Station → `train` icon
- 🚌 Bus Station → `directions-bus` icon
- 🏥 Hospital/Health → `local-hospital` icon
- 🏫 School/University → `school` icon
- ⛪ Place of Worship → `church` icon
- 🛒 Shopping Mall/Store → `shopping-mall` icon
- 🌳 Park/Garden → `park` icon
- 🍽️ Restaurant/Cafe → `restaurant` icon
- 🍺 Bar/Night Club → `local-bar` icon
- ⛽ Gas Station → `local-gas-station` icon
- 🏨 Hotel/Lodging → `hotel` icon
- 🏦 Bank/ATM → `account-balance` icon
- And 15+ more types ([TaxiContent.tsx](src/Screen1/Taxibooking/TaxiContent.tsx:3290-3358))

### Polyline Decoding

Google Directions API returns routes in encoded polyline format. The app includes a decoder utility:
- Location: [TaxiContent.tsx](src/Screen1/Taxibooking/TaxiContent.tsx:546-584)
- Converts encoded strings to latitude/longitude coordinates
- Used by both initial route calculation and real-time routing

### iOS Configuration

Google Maps SDK is initialized in [AppDelegate.swift](ios/Eazygo/AppDelegate.swift:19):
```swift
import GoogleMaps
GMSServices.provideAPIKey("AIzaSyA9Ef953b2mO_rr940k-3OclHSZp3ldM2o")
```

### Android Configuration

Google Maps API key is configured in [AndroidManifest.xml](android/app/src/main/AndroidManifest.xml:26-28).

## Backend Configuration

### Current Setup: Localhost + Ngrok Tunnel

The app is configured to use **localhost via ngrok tunnel** for backend connections (not map services):

**Configuration Files**:
- [src/socket.ts](src/socket.ts) - Socket.IO connection
- [src/util/backendConfig.tsx](src/util/backendConfig.tsx) - API base URL

**Current Ngrok URL**: `https://49be702bef38.ngrok-free.app` → `http://localhost:5001`

**IMPORTANT**: You must update the ngrok URL in both files whenever you restart ngrok, as the URL changes with each session.

This configuration allows you to:
- Develop and test against your local backend server
- Test on physical devices and emulators using the ngrok tunnel
- Debug API calls and socket events in real-time

### Backend API Endpoints

**REST API**:
- `GET /api/wallet/balance` - Fetch user wallet balance (requires Bearer token)

**Socket Events**:
- `rideCompleted` - Ride completion with billing data
- `walletUpdate` - Wallet balance updates
- `driverLiveLocationUpdate` - Real-time driver location during rides
- `ride_request` - Ride alert to drivers (filtered by vehicle type)

### Image URL Handling

The app has built-in image URL management in [backendConfig.tsx](src/util/backendConfig.tsx):

**Key Functions**:
- `getImageUrl(imagePath, cacheBust?)` - Main image URL handler
- `getProductImageUrl(imagePath)` - Product image URLs

**Features**:
- Automatically fixes localhost URLs from database
- Handles multiple path formats (`/uploads/`, `uploads/`, or plain filenames)
- Optional cache-busting with timestamps (useful for profile pictures)
- Falls back to placeholder for empty paths

**Usage**:
```typescript
import { getImageUrl, getProductImageUrl } from './util/backendConfig';

const profilePic = getImageUrl(user.profileImage, true); // Cache-bust
const productImg = getProductImageUrl(product.image);
```

## Important Implementation Details

### Socket.IO Integration

The app uses Socket.IO for real-time features:
- Driver location updates during rides
- Ride status changes
- Wallet balance updates

Socket configuration in [src/socket.ts](src/socket.ts):
```typescript
transports: ['websocket']
reconnectionAttempts: Infinity
reconnectionDelay: 1000
reconnectionDelayMax: 5000
timeout: 20000
forceNew: true
autoConnect: true
```

### Context Providers

**WalletContext** ([src/context/WalletContext.tsx](src/context/WalletContext.tsx)):
- Manages global wallet state
- Fetches balance on app launch
- Listens to socket events for real-time updates
- Provides `useWallet()` hook

**CartProvider** (in [ShoppingContent.tsx](src/Screen1/Shopping/ShoppingContent.tsx)):
- Shopping cart state management
- Add/remove items
- Calculate totals

**AddressProvider** ([AddressContext.tsx](src/Screen1/Shopping/AddressContext.tsx)):
- User delivery addresses
- Address CRUD operations

### Authentication & Storage

Auth tokens are stored in AsyncStorage with two possible keys:
- `authToken`
- `userToken`

When making authenticated API calls, check both:
```typescript
const token = await AsyncStorage.getItem('authToken') || await AsyncStorage.getItem('userToken');
```

### Driver Animations

Smooth driver movement is handled by [src/utils/driverAnimationHelper.ts](src/utils/driverAnimationHelper.ts):

Key functions:
- `animateDriverMovement()` - Smooth position transitions with rotation
- `calculateBearing()` - Direction calculation for icon rotation
- `isSignificantMovement()` - GPS jitter filtering (5m threshold)

Animation uses React Native's Animated API with easing for natural movement.

### Ride Completion Flow

When a ride completes:
1. Backend emits `rideCompleted` socket event with billing data
2. [BillingAlert.tsx](src/components/BillingAlert.tsx) displays professional modal with:
   - Trip summary (distance, duration)
   - Fare breakdown (base fare, distance charge, time charge, surcharge)
   - Total amount
   - Wallet credit confirmation
3. WalletContext updates global balance
4. User can view details or close

### Vehicle Type Selection System

**Critical Requirement**: The app supports multiple vehicle types (`taxi`, `port`, `bike`).

**User Booking Flow**:
1. User selects vehicle type during ride booking
2. Backend filters drivers by `vehicleType` AND `isOnline` status
3. Only matching drivers receive ride alerts via Socket.IO

**Important Rules** (see [ride_booking_note.md](ride_booking_note.md)):
- Vehicle types must always be **lowercase** in comparisons
- Driver's `vehicleType` field is **immutable** during ride booking flow
- Never hardcode `"taxi"` in ride logic - use user-selected type
- Backend must filter: `driver.vehicleType === ride.vehicleType && driver.isOnline === true`

### Metro Config - SVG Support

The app uses [react-native-svg-transformer](https://github.com/kristerkari/react-native-svg-transformer) for importing SVG files directly:

```typescript
import Logo from './assets/logo.svg';
```

Configuration is in [metro.config.js](metro.config.js).

## File Organization

```
src/
├── Screen1.tsx              # Main app screen (taxi/shopping tabs)
├── SplashScreen.tsx         # Initial splash screen
├── WelcomeScreen*.tsx       # Onboarding screens
├── socket.ts                # Socket.IO configuration
├── context/
│   └── WalletContext.tsx    # Global wallet state
├── components/
│   └── BillingAlert.tsx     # Ride completion billing modal
├── utils/
│   └── driverAnimationHelper.ts  # Driver animation utilities
├── util/
│   └── backendConfig.tsx    # API URL configuration
├── constants/
│   └── LanguageContext.tsx  # Internationalization
├── Screen1/
│   ├── Menuicon/            # Menu, profile, settings, wallet
│   ├── Taxibooking/         # Ride booking components
│   │   └── TaxiContent.tsx  # Main taxi booking screen (~4,400 lines)
│   ├── Shopping/            # E-commerce components
│   └── Bellicon/            # Notifications
└── types/                   # TypeScript type definitions
```

## Common Gotchas

### TaxiContent.tsx Size
[TaxiContent.tsx](src/Screen1/Taxibooking/TaxiContent.tsx) is large (~4,400 lines). When making changes:
- Read the file first to understand context
- Make targeted edits rather than full rewrites
- Test thoroughly after any modifications

### Backend URL Usage
Always use the `getBackendUrl()` function from [backendConfig.tsx](src/util/backendConfig.tsx) rather than hardcoding URLs. The app is currently configured to use localhost via ngrok tunnel (`https://49be702bef38.ngrok-free.app`) for all API calls and Socket.IO connections.

**Remember**: Update the ngrok URL in both [src/socket.ts](src/socket.ts) and [src/util/backendConfig.tsx](src/util/backendConfig.tsx) whenever you restart ngrok.

### AsyncStorage Token Keys
The app historically used both `authToken` and `userToken` keys. Always check both when retrieving tokens:
```typescript
const token = await AsyncStorage.getItem('authToken') || await AsyncStorage.getItem('userToken');
```

### Socket Connection Timing
Socket initialization happens in [socket.ts](src/socket.ts) at app startup. Ensure socket event listeners are registered after connection is established. Check `socket.connected` or listen for `connect` event.

### iOS Permissions & CocoaPods
Firebase Auth and Geolocation require proper iOS permissions. Check Info.plist for:
- Location permissions (NSLocationWhenInUseUsageDescription)
- Camera/Photo Library (for profile pictures)

Before running on iOS, ensure CocoaPods dependencies are installed:
```bash
cd ios && bundle exec pod install && cd ..
```

If you encounter pod installation issues, try:
```bash
cd ios
rm -rf Pods Podfile.lock
bundle exec pod install
cd ..
```

## Testing Workflow

### Wallet Integration Testing
1. Ensure your local backend server is running on `http://localhost:5001`
2. Ensure ngrok is running and forwarding to localhost:5001
3. Update the ngrok URL in [src/socket.ts](src/socket.ts) and [src/util/backendConfig.tsx](src/util/backendConfig.tsx) if it changed
4. Launch app (check console for "Wallet balance fetched")
5. Open menu → verify balance displays
6. Complete a test ride → verify billing alert appears
7. Check wallet balance updates in menu

### Driver Animation Testing
1. Book a ride
2. Observe driver movement on map (should be smooth, no jumps)
3. Driver icon should rotate based on direction
4. Small movements (<5m) should be filtered out

## Critical Documentation

**[ride_booking_note.md](ride_booking_note.md)** - Vehicle Type-Based Driver Alert System:
- Users select vehicle type (`taxi`, `port`, `bike`) during booking
- Only drivers with matching vehicle type AND online status receive ride alerts
- Driver `vehicleType` field must NEVER be modified during ride flow
- All vehicle type comparisons must use lowercase
- Never hardcode `"taxi"` in ride logic
