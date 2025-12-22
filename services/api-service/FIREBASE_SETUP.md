# Firebase Cloud Messaging Setup Guide

This guide explains how to configure Firebase credentials for the FAYO Healthcare API service.

## Important: Two Types of Firebase Config

1. **Client Config** (Web/Mobile apps):
   - Used by Flutter app and Admin Panel
   - Contains: `apiKey`, `projectId`, `messagingSenderId`, etc.
   - Already configured in your project
   - Location: `web/admin-panel/src/config/firebase.config.ts`

2. **Service Account** (Backend/Server):
   - Used by NestJS backend to send notifications
   - Contains: `private_key`, `client_email`, etc.
   - **This is what you need to set up below**
   - Location: `services/api-service/firebase-service-account.json` or environment variable

## Quick Setup

### Option 1: Using Service Account File (Recommended for Development)

1. **Download Service Account JSON**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: **fayo-healthcare**
   - Click **⚙️ Settings** (gear icon) → **Project settings**
   - Click the **Service Accounts** tab (3rd or 4th tab at the top)
   - Click **"Generate new private key"** button
   - Confirm and download the JSON file

2. **Place the file**:
   - The downloaded file will have a long name like `fayo-healthcare-firebase-adminsdk-xxxxx.json`
   - **Rename it** to: `firebase-service-account.json`
   - **Place it** in: `services/api-service/` directory (same level as `package.json`)
   - Full path: `C:\FAYO\services\api-service\firebase-service-account.json`

   **See `HOW_TO_GET_FIREBASE_SERVICE_ACCOUNT.md` for detailed step-by-step instructions with screenshots guide.**

3. **Verify**:
   ```bash
   cd services/api-service
   ls firebase-service-account.json  # Should show the file
   ```

4. **Restart the API service**:
   ```bash
   pm2 restart fayo-api-service
   # or
   npm run start:dev
   ```

### Option 2: Using Environment Variable (Recommended for Production)

1. **Download Service Account JSON** (same as Option 1)

2. **Convert to single-line JSON string**:
   - Open the JSON file
   - Remove all newlines and extra spaces
   - Escape any quotes if needed
   - Or use this command:
   ```bash
   cat firebase-service-account.json | jq -c
   ```

3. **Add to environment**:
   - **For PM2**: Add to `ecosystem.config.js`:
     ```javascript
     FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT || '{"type":"service_account",...}',
     ```
   - **For Docker**: Add to docker-compose.yml or .env file
   - **For systemd**: Add to service file or /etc/environment

4. **Set the variable**:
   ```bash
   export FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...",...}'
   ```

5. **Restart the service**

## File Structure

```
services/api-service/
├── firebase-service-account.json  ← Place your Firebase credentials here
├── .env                           ← Or set FIREBASE_SERVICE_ACCOUNT here
├── .gitignore                     ← Already ignores the JSON file
├── package.json
└── src/
    └── notifications/
        └── notifications.service.ts  ← Loads credentials automatically
```

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit `firebase-service-account.json` to Git (already in .gitignore)
- Never commit `.env` files with credentials
- Use environment variables in production
- Restrict file permissions: `chmod 600 firebase-service-account.json`
- Rotate keys if exposed

## Verification

After setup, check the logs for:
```
✅ Firebase service account loaded from file
✅ Firebase Admin SDK initialized successfully
```

If you see warnings:
```
⚠️ Firebase service account not configured...
```
Then the credentials are not set up correctly.

## Testing

Test the notification service:
```bash
# Using curl
curl -X POST http://localhost:3001/api/v1/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

Or use the admin panel to send a test notification.

## Troubleshooting

### Error: "Firebase service account not configured"
- Check that `firebase-service-account.json` exists in `services/api-service/`
- Or verify `FIREBASE_SERVICE_ACCOUNT` environment variable is set
- Check file permissions

### Error: "Failed to parse FIREBASE_SERVICE_ACCOUNT"
- Ensure the JSON string is valid
- Check for escaped quotes
- Try using the file method instead

### Error: "Invalid credentials"
- Verify the service account JSON is correct
- Check that the service account has FCM permissions
- Ensure the project ID matches

## Next Steps

Once configured:
1. ✅ Notifications will work automatically
2. ✅ New doctor notifications will be sent
3. ✅ Appointment reminders will work
4. ✅ Payment confirmations will be sent

See `FCM_INTEGRATION_GUIDE.md` for more details.

