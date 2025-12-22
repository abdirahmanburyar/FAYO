# How to Query FCM Tokens from Database

## After Migration

Once you've run `npx prisma db push` and created the `fcm_tokens` table, you can query tokens using:

### 1. Using psql (PostgreSQL CLI)

```bash
# Connect to database
sudo -u postgres psql -d fayo

# Query all FCM tokens
SELECT id, "userId", token, platform, "isActive", "createdAt" 
FROM users.fcm_tokens 
ORDER BY "createdAt" DESC;

# Find a specific token
SELECT * FROM users.fcm_tokens 
WHERE token = 'BPrPJU7e58S7fX9g9PupTwuYhfXnLSvxXiugUBqjtUVR_iXDc99FHbsFFoluuScHdemt0ZBGwVzprPX1-ICtP_4';

# Find tokens for a specific user
SELECT * FROM users.fcm_tokens 
WHERE "userId" = 'user_id_here';

# Find all active Android tokens
SELECT * FROM users.fcm_tokens 
WHERE platform = 'android' AND "isActive" = true;
```

### 2. Using Prisma Studio (Visual Database Browser)

```bash
cd services/api-service
npx prisma studio
```

Then navigate to the `FcmToken` model to see all tokens.

### 3. Using API Endpoint

```bash
# Get tokens for current user (requires authentication)
GET /api/v1/notifications/tokens
Authorization: Bearer <jwt_token>
```

## Token Registration Flow

1. **Flutter app gets FCM token** from Firebase
2. **Flutter app sends token to backend**:
   ```
   POST /api/v1/notifications/register-token
   {
     "token": "BPrPJU7e58S7fX9g9PupTwuYhfXnLSvxXiugUBqjtUVR_iXDc99FHbsFFoluuScHdemt0ZBGwVzprPX1-ICtP_4",
     "platform": "android",
     "deviceId": "optional_device_id"
   }
   ```
3. **Backend stores token** in `users.fcm_tokens` table
4. **Token is now available** for sending notifications

## Check if Token Exists

```sql
-- Check if specific token exists
SELECT 
  ft.*,
  u.email,
  u."firstName",
  u."lastName"
FROM users.fcm_tokens ft
JOIN users.users u ON ft."userId" = u.id
WHERE ft.token = 'BPrPJU7e58S7fX9g9PupTwuYhfXnLSvxXiugUBqjtUVR_iXDc99FHbsFFoluuScHdemt0ZBGwVzprPX1-ICtP_4';
```

## Token Statistics

```sql
-- Count tokens by platform
SELECT platform, COUNT(*) as count, COUNT(*) FILTER (WHERE "isActive" = true) as active_count
FROM users.fcm_tokens
GROUP BY platform;

-- Count tokens per user
SELECT u.email, COUNT(ft.id) as token_count
FROM users.users u
LEFT JOIN users.fcm_tokens ft ON u.id = ft."userId"
GROUP BY u.id, u.email
ORDER BY token_count DESC;
```

