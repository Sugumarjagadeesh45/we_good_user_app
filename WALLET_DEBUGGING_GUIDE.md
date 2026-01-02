# Wallet Balance Not Updating - Debugging Guide

**Issue**: Wallet shows ₹0.00 even though backend credits money after ride completion

---

## 🔍 Step 1: Check Backend API Endpoint

### Test the `/api/wallet` endpoint:

```bash
# Get your auth token from AsyncStorage (check app logs or use React Native Debugger)
# Then test the endpoint:

curl -X GET http://localhost:5001/api/wallet \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response**:
```json
{
  "wallet": 1250,
  "success": true
}
```

**If endpoint doesn't exist**, you need to create it in the backend.

---

## 🔍 Step 2: Check User Model Has Wallet Field

The User model needs a `wallet` field:

**File**: `/Users/webasebrandings/Downloads/ba--main/models/user/user.js`

```javascript
const userSchema = new mongoose.Schema({
  // ... other fields
  wallet: {
    type: Number,
    default: 0,
    min: 0
  }
});
```

---

## 🔍 Step 3: Check Socket Event Data

When ride completes, the backend should emit:

```javascript
io.to(`user_${userId}`).emit('rideCompleted', {
  rideId: "RIDE123",
  distance: 5.2,
  duration: 18,
  totalAmount: 120,
  walletBalance: 1370,  // ← CRITICAL: Must include this
  fareBreakdown: {
    baseFare: 50,
    distanceCharge: 52,
    timeCharge: 18
  }
});
```

---

## 🔍 Step 4: Add Debug Logs to User App

Add these console logs to see what's happening:

### In WalletContext.tsx:

Already has logs! Check your console for:
- `💰 Fetching wallet balance from: ...`
- `✅ Wallet balance fetched: ...`
- `🎉 Ride completed - updating wallet: ...`

### In your console/metro bundler:

Look for these logs when app launches:
```
💰 Fetching wallet balance from: http://localhost:5001/api/wallet
✅ Wallet balance fetched: 1250
```

If you see errors, that's your issue!

---

## ✅ Solution: Create Missing Backend Endpoint

If `/api/wallet` doesn't exist, create it:

### File: `controllers/user/userController.js`

```javascript
const getWalletBalance = async (req, res) => {
  try {
    const userId = req.user.userId; // From auth middleware

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      wallet: user.wallet || 0,
      userId: user.userId
    });
  } catch (error) {
    console.error('❌ Error fetching wallet:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  // ... other exports
  getWalletBalance
};
```

### File: `routes/userRoutes.js`

```javascript
const { getWalletBalance } = require('../controllers/user/userController');

// Add this route:
router.get('/wallet', authMiddleware, getWalletBalance);
```

---

## ✅ Solution: Update Ride Completion to Credit User Wallet

### File: `socket.js` or ride completion handler

When ride completes:

```javascript
// 1. Find the user
const user = await User.findOne({ userId });

// 2. Credit the wallet
const newBalance = (user.wallet || 0) + totalAmount;
await User.findOneAndUpdate(
  { userId },
  { $set: { wallet: newBalance } },
  { new: true }
);

// 3. Emit socket event with new balance
io.to(`user_${userId}`).emit('rideCompleted', {
  rideId,
  distance,
  duration,
  totalAmount,
  walletBalance: newBalance,  // ← Include this!
  fareBreakdown: {
    baseFare: 50,
    distanceCharge: 52,
    timeCharge: 18
  }
});

console.log(`✅ Credited ₹${totalAmount} to user ${userId}. New balance: ₹${newBalance}`);
```

---

## 🧪 Testing Steps

### 1. Test API Endpoint

```bash
# Replace YOUR_TOKEN with actual token
curl http://localhost:5001/api/wallet \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Should return: `{"success": true, "wallet": 0}` (or current balance)

### 2. Test Wallet Fetch in App

1. Open React Native app
2. Open console/metro bundler
3. Look for: `💰 Fetching wallet balance from: ...`
4. Look for: `✅ Wallet balance fetched: X`

### 3. Test Ride Completion

1. Complete a ride
2. Check backend logs: `✅ Credited ₹120 to user user123. New balance: ₹1370`
3. Check app logs: `🎉 Ride completed - updating wallet: { walletBalance: 1370 }`
4. Check UI: Wallet should show ₹1370

---

## 🔧 Quick Fix Checklist

- [ ] User model has `wallet` field (default: 0)
- [ ] `/api/wallet` endpoint exists and works
- [ ] Auth middleware is working (token validation)
- [ ] Ride completion updates user wallet in database
- [ ] Socket event includes `walletBalance` field
- [ ] WalletContext is listening to socket events
- [ ] WalletProvider is wrapped around app (already done ✅)
- [ ] WalletSection uses `useWallet()` hook (already done ✅)

---

## 📝 Common Issues & Solutions

### Issue 1: "❌ Error fetching wallet balance: 404"

**Cause**: `/api/wallet` endpoint doesn't exist
**Fix**: Create the endpoint (see Solution above)

### Issue 2: "❌ Error fetching wallet balance: 401 Unauthorized"

**Cause**: Auth token is missing or invalid
**Fix**: Check AsyncStorage for `userToken` or `authToken`

```javascript
// In app, check:
const token = await AsyncStorage.getItem('userToken');
console.log('Token:', token);
```

### Issue 3: Wallet shows 0 after app restart

**Cause**: Database not persisting wallet value
**Fix**: Verify User model update is working:

```javascript
// In MongoDB:
db.users.findOne({ userId: "user123" })
// Should show: { wallet: 1250, ... }
```

### Issue 4: Wallet not updating after ride

**Cause**: Socket event doesn't include `walletBalance`
**Fix**: Check backend logs and update ride completion handler

---

## 🎯 Expected Flow (Working System)

```
1. App launches
   ↓
2. WalletContext fetches balance from /api/wallet
   ↓
3. Backend returns: { wallet: 1250 }
   ↓
4. UI shows: ₹1250.00
   ↓
5. User completes ride (cost: ₹120)
   ↓
6. Backend credits wallet: 1250 + 120 = 1370
   ↓
7. Backend emits: { walletBalance: 1370 }
   ↓
8. WalletContext updates: setWalletBalance(1370)
   ↓
9. UI instantly updates: ₹1370.00
```

---

## 🚀 Next Steps

1. **Check backend logs** - Does `/api/wallet` exist?
2. **Check app console** - What errors do you see?
3. **Test API endpoint** - Does it return wallet balance?
4. **Fix missing parts** - Add endpoint/update user model if needed
5. **Test again** - Complete a ride and verify wallet updates

---

**Need Help?**
- Check app console for specific errors
- Check backend logs for wallet credit operations
- Verify database has wallet field and value
