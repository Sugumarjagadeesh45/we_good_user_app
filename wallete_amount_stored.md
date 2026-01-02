# Backend Implementation Guide: Wallet Payment for Rides

## 🚨 Current Issue
The User App successfully calls the `POST /api/wallet/pay-ride` endpoint, but the user's wallet balance in the database remains `0`.

**Root Cause:** The backend endpoint is likely returning a `200 OK` success response **without actually updating and saving the user's new wallet balance in the database.**

## ✅ Requirement
The goal is to **ADD** the ride fare to the user's wallet as a credit or cashback after the ride is completed. This happens regardless of how the user paid the driver (Cash, UPI, etc.).

The endpoint must:
1.  Accept the Ride ID and Amount.
2.  Find the user associated with the ride.
3.  **ADD** the ride `amount` to the user's `wallet` field in the database.
4.  **SAVE** the updated user document.
5.  Update the Ride's `paymentStatus` to `"paid"`.
6.  Create a transaction record for this credit.
7.  Return the `newBalance` to the app.

---

## 🛠️ API Specification

### Endpoint
`POST /api/wallet/pay-ride`

### Headers
*   `Content-Type`: `application/json`
*   `Authorization`: `Bearer <USER_AUTH_TOKEN>`

### Request Body
```json
{
  "rideId": "RID123456",
  "amount": 50
}
```

### Backend Logic (Step-by-Step)

1.  **Verify User:** Extract `userId` from the Authorization token.
2.  **Find User:** Look up the user in the database.
3.  **Process Transaction (Credit Logic):**
    *   `user.wallet = (user.wallet || 0) + amount;`  // **ADD the amount**
    *   `await user.save();` // **CRITICAL: Save the change to the database**
    *   Create a **Transaction Record** for the credit:
        *   `userId`: Current User
        *   `amount`: `+50` (Credit)
        *   `type`: `"ride_credit"`
        *   `description`: `"Credit for completing Ride RID123456"`
        *   `date`: `new Date()`
4.  **Update Ride:**
    *   Find the Ride by `rideId`.
    *   Set `paymentStatus` to `"paid_to_driver"` and `status` to `"completed"`.
    *   Save the Ride.
5.  **Send Response:**

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Payment successful",
  "newBalance": 120.50,
  "transactionId": "TXN_987654321"
}
```

### Error Response (400 Bad Request)
```json
{
  "success": false,
  "message": "Insufficient wallet balance"
}
```

---

## 📝 Mongoose/Node.js Implementation Example

```javascript
// routes/wallet.js

router.post('/pay-ride', authMiddleware, async (req, res) => {
  try {
    const { rideId, amount } = req.body;
    const userId = req.user.id; // From auth middleware

    // 1. Get User
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2. Deduct Amount (Logic for Wallet Payment)
    // If you want to support Cash, you might want to send a 'paymentMethod' in the body
    // and only deduct if paymentMethod === 'wallet'.
    
    user.walletBalance -= amount;
    await user.save();

    // 3. Record Transaction
    await Transaction.create({
      userId,
      amount: -amount,
      type: 'debit',
      category: 'ride',
      description: `Ride Payment: ${rideId}`,
      timestamp: new Date()
    });

    // 4. Update Ride Status
    await Ride.findOneAndUpdate(
      { rideId: rideId },
      { paymentStatus: 'paid', status: 'completed' }
    );

    // 5. Return Success
    res.json({
      success: true,
      message: "Payment processed successfully",
      newBalance: user.walletBalance
    });

  } catch (error) {
    console.error("Payment Error:", error);
    res.status(500).json({ message: "Server error processing payment" });
  }
});
```