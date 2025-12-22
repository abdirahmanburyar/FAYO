# Diagnose FCM Token Registration

## Current Status
✅ Notification system is working  
✅ Found 2 active patients  
❌ Found 0 FCM tokens (patients haven't registered tokens yet)

## Why No Tokens?

FCM tokens are registered when:
1. **Flutter app initializes FCM** (on app start)
2. **User logs in** (token is sent to backend)
3. **Token is saved to database** via `POST /api/v1/notifications/register-token`

## Check Database

```bash
# Check if any tokens exist
sudo -u postgres psql -d fayo -c "SELECT COUNT(*) FROM users.fcm_tokens;"

# Check tokens for specific patients
sudo -u postgres psql -d fayo -c "
SELECT 
  u.email,
  u.\"firstName\",
  u.\"lastName\",
  COUNT(ft.id) as token_count
FROM users.users u
LEFT JOIN users.fcm_tokens ft ON u.id = ft.\"userId\"
WHERE u.role = 'PATIENT' OR u.\"userType\" = 'PATIENT'
GROUP BY u.id, u.email, u.\"firstName\", u.\"lastName\"
ORDER BY token_count DESC;
"

# See all registered tokens
sudo -u postgres psql -d fayo -c "
SELECT 
  ft.*,
  u.email,
  u.\"firstName\"
FROM users.fcm_tokens ft
JOIN users.users u ON ft.\"userId\" = u.id
ORDER BY ft.\"createdAt\" DESC;
"
```

## Check Flutter App Logs

Look for these log messages in Flutter app:

```
✅ User granted notification permission
📱 FCM Token: <token_here>
✅ FCM token registered with backend
```

If you see:
- `❌ User declined notification permission` → User needs to enable notifications
- `❌ Error initializing FCM` → Firebase not configured properly
- `❌ Failed to register FCM token` → API endpoint issue

## Check API Service Logs

Look for these log messages when Flutter app registers token:

```
📱 POST /notifications/register-token - User: <user_id>, Platform: android
✅ Token registration completed for user <user_id>
```

## Manual Token Registration (Testing)

You can manually register a token for testing:

```bash
# Get a user ID (patient)
USER_ID=$(sudo -u postgres psql -d fayo -t -c "SELECT id FROM users.users WHERE role = 'PATIENT' LIMIT 1;")

# Register token via API (replace TOKEN and AUTH_TOKEN)
curl -X POST http://localhost:3000/api/v1/notifications/register-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <AUTH_TOKEN>" \
  -d '{
    "token": "BPrPJU7e58S7fX9g9PupTwuYhfXnLSvxXiugUBqjtUVR_iXDc99FHbsFFoluuScHdemt0ZBGwVzprPX1-ICtP_4",
    "platform": "android"
  }'
```

## Steps to Fix

1. **Ensure Flutter app is running** with FCM initialized
2. **Have patients log in** to the Flutter app
3. **Check Flutter logs** for token registration
4. **Check API logs** for registration requests
5. **Verify tokens in database** using queries above

## Test Notification After Registration

Once tokens are registered, test with:

```bash
# Send test notification to a user
curl -X POST http://localhost:3000/api/v1/notifications/test \
  -H "Authorization: Bearer <AUTH_TOKEN>"
```

