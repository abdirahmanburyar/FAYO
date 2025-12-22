# Firebase Initialization Troubleshooting

## Current Issue
Firebase Admin SDK is not initializing, causing notifications to fail with:
```
⚠️ Firebase not initialized. Skipping notification.
```

## Quick Fix Steps

### Step 1: Check if File Exists
```bash
cd services/api-service
ls -la firebase-service-account.json
```

If file doesn't exist, download it from Firebase Console.

### Step 2: Rebuild the Service
The TypeScript code needs to be compiled:
```bash
cd services/api-service
npm run build
```

### Step 3: Restart PM2 Service
```bash
pm2 restart fayo-api-service
```

### Step 4: Check Startup Logs
```bash
pm2 logs fayo-api-service --lines 50
```

Look for these logs:
```
🔍 [FCM] Looking for Firebase service account file...
   Current working directory: /root/fayo/services/api-service
   ✅ [FCM] Found Firebase service account at: ...
✅ [FCM] Firebase service account loaded from file
   Project ID: fayo-healthcare
✅ Firebase Admin SDK initialized successfully
✅ [FCM] Firebase Admin SDK is ready to send notifications
```

## If File Not Found

### Option 1: Move File to Correct Location
The service checks these paths (in order):
1. `process.cwd()/firebase-service-account.json` (usually `/root/fayo/services/api-service/`)
2. `__dirname/../../firebase-service-account.json`
3. `__dirname/../../../firebase-service-account.json`
4. `process.cwd()/services/api-service/firebase-service-account.json`

**Recommended location**: `services/api-service/firebase-service-account.json`

### Option 2: Use Environment Variable
Set in `ecosystem.config.js`:
```javascript
FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT || '{"type":"service_account",...}'
```

Or export before starting:
```bash
export FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"fayo-healthcare",...}'
pm2 restart fayo-api-service
```

## Verify File Content

The file should contain:
```json
{
  "type": "service_account",
  "project_id": "fayo-healthcare",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-...@fayo-healthcare.iam.gserviceaccount.com",
  ...
}
```

## Common Issues

### Issue 1: File in Wrong Location
**Symptom**: Logs show "Firebase service account file not found"
**Fix**: Move file to `services/api-service/firebase-service-account.json`

### Issue 2: Code Not Rebuilt
**Symptom**: No initialization logs appear
**Fix**: Run `npm run build` then restart PM2

### Issue 3: PM2 Working Directory
**Symptom**: File exists but not found
**Fix**: Check `ecosystem.config.js` - `cwd` should be `./services/api-service`

### Issue 4: File Permissions
**Symptom**: File exists but can't be read
**Fix**: `chmod 644 firebase-service-account.json`

## Diagnostic Script

Run the diagnostic script:
```bash
cd services/api-service
chmod +x check_firebase_init.sh
./check_firebase_init.sh
```

## Expected Logs After Fix

When working correctly, you should see on startup:
```
🔍 [FCM] Looking for Firebase service account file...
   Current working directory: /root/fayo/services/api-service
   __dirname: /root/fayo/services/api-service/dist/src/notifications
   ✅ [FCM] Found Firebase service account at: /root/fayo/services/api-service/firebase-service-account.json
✅ [FCM] Firebase service account loaded from file
   Project ID: fayo-healthcare
   Client Email: firebase-adminsdk-fbsvc@fayo-healthcare.iam.gserviceaccount.com
✅ Firebase Admin SDK initialized successfully
✅ [FCM] Firebase Admin SDK is ready to send notifications
```

