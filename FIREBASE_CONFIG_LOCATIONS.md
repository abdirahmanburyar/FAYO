# Firebase Configuration Locations

## FCM Flow: API Service → Flutter Mobile App

**Architecture**: 
- API Service (NestJS) **sends** notifications via FCM
- Flutter Mobile App **receives** notifications
- Admin Panel uses WebSockets (not FCM)

## Summary: Where Each Config Goes

### ✅ API Service (REQUIRED for Push Notifications)
**Location**: `services/api-service/firebase-service-account.json`

**What you need**: Service Account JSON (different from web config)
- Go to Firebase Console → Project Settings → Service Accounts
- Click "Generate New Private Key"
- Download the JSON file
- Save as `services/api-service/firebase-service-account.json`

**Purpose**: Allows NestJS backend to send push notifications via FCM

**Status**: ⚠️ **REQUIRED** - Without this, notifications won't work

---

### ❌ Admin Panel (NOT NEEDED)
**Location**: N/A

**Why**: Admin panel uses WebSockets for real-time updates, not FCM
- FCM is only for mobile apps (Flutter)
- Admin panel already has WebSocket connections for real-time data
- No Firebase config needed in admin panel

**Status**: ✅ Not required - WebSockets handle real-time updates

---

## What You Need to Do

### Step 1: Get Service Account for Backend (REQUIRED)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **fayo-healthcare**
3. Click ⚙️ **Project Settings** → **Service Accounts** tab
4. Click **Generate New Private Key**
5. Download the JSON file
6. Save it as: `services/api-service/firebase-service-account.json`

### Step 2: Verify File Location
```
services/api-service/
├── firebase-service-account.json  ← Place the downloaded JSON here
├── package.json
└── src/
    └── notifications/
        └── notifications.service.ts  ← Will automatically load it
```

### Step 3: Restart API Service
```bash
pm2 restart fayo-api-service
# or
cd services/api-service && npm run start:dev
```

### Step 4: Check Logs
You should see:
```
✅ Firebase service account loaded from file
✅ Firebase Admin SDK initialized successfully
```

## Important Notes

1. **Web Config ≠ Service Account**
   - Web config (what you shared) = Client-side, public config
   - Service Account = Server-side, private credentials

2. **Admin Panel Config is Optional**
   - The web config in admin-panel is only needed if you use Firebase features there
   - For push notifications, you only need the service account in api-service

3. **Security**
   - Service account JSON contains private keys - keep it secure
   - Already added to `.gitignore` - won't be committed to Git

## Quick Reference

| Component | Config Type | Location | Required? |
|-----------|------------|----------|-----------|
| **Backend API** | Service Account JSON | `services/api-service/firebase-service-account.json` | ✅ **YES** |
| Admin Panel | WebSockets (not FCM) | N/A | ❌ Not needed |
| Flutter Android | Native Config | `mobile/fayo/android/app/google-services.json` | ✅ For mobile |
| Flutter iOS | Native Config | `mobile/fayo/ios/Runner/GoogleService-Info.plist` | ✅ For mobile |

## Next Steps

1. ✅ Web config saved (optional, already done)
2. ⚠️ **Download service account JSON** (REQUIRED - do this now)
3. ⚠️ Place it in `services/api-service/` directory
4. ⚠️ Restart API service
5. ✅ Notifications will work!

See `services/api-service/FIREBASE_SETUP.md` for detailed instructions.

