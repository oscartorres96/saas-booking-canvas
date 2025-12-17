# Manual MongoDB Migration Guide
# Use this if you prefer to create subscriptions directly in MongoDB

## Option A: Using MongoDB Compass (GUI)

### Step 1: Connect to your database
1. Open MongoDB Compass
2. Connect to: `mongodb://localhost:27017` (or your connection string)
3. Select database: `bookpro` (or your database name)

### Step 2: Find your business
1. Go to collection: `businesses`
2. Find your business document
3. Copy the `_id` and `ownerUserId` values

### Step 3: Create subscription
1. Go to collection: `subscriptions`
2. Click "INSERT DOCUMENT"
3. Paste this structure (replace values):

```json
{
  "userId": "YOUR_OWNER_USER_ID",
  "businessId": "YOUR_BUSINESS_ID",
  "stripeCustomerId": null,
  "stripeSubscriptionId": null,
  "priceId": "legacy_grandfathered",
  "status": "active",
  "currentPeriodStart": { "$date": "2024-01-01T00:00:00.000Z" },
  "currentPeriodEnd": { "$date": "2099-12-31T23:59:59.999Z" },
  "createdAt": { "$date": "2024-01-01T00:00:00.000Z" },
  "updatedAt": { "$date": "2024-01-01T00:00:00.000Z" }
}
```

### Step 4: Update business status
1. Go back to collection: `businesses`
2. Find your business
3. Edit and set: `"subscriptionStatus": "active"`
4. Save

---

## Option B: Using MongoDB Shell (CLI)

### Connect to MongoDB
```bash
mongosh
use bookpro
```

### Find your business ID
```javascript
db.businesses.findOne({ email: "your@email.com" })
// Copy the _id value
```

### Create subscription
```javascript
db.subscriptions.insertOne({
  userId: ObjectId("YOUR_OWNER_USER_ID"),
  businessId: "YOUR_BUSINESS_ID",
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  priceId: "legacy_grandfathered",
  status: "active",
  currentPeriodStart: new Date("2024-01-01"),
  currentPeriodEnd: new Date("2099-12-31"),
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### Update business status
```javascript
db.businesses.updateOne(
  { _id: ObjectId("YOUR_BUSINESS_ID") },
  { $set: { subscriptionStatus: "active" } }
)
```

---

## Check Results

### Verify subscription was created
```javascript
db.subscriptions.find({ businessId: "YOUR_BUSINESS_ID" })
```

### Verify business status
```javascript
db.businesses.findOne({ _id: ObjectId("YOUR_BUSINESS_ID") })
// Check that subscriptionStatus is "active"
```

---

## Special Price ID: "legacy_grandfathered"

This special price ID identifies users who were grandfathered in:
- They get active status forever (expires 2099)
- No Stripe customer/subscription IDs
- Won't be charged
- Can use all features

The Billing component will detect this and show appropriate messaging.
