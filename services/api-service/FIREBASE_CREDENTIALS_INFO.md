# Firebase Credentials Information

## Project Details
- **Project ID**: `fayo-healthcare`
- **Project Name**: FAYO Healthcare
- **Messaging Sender ID**: `1011968725460`

## Configuration Files Location

### 1. Web Admin Panel (NOT NEEDED)
- **Location**: N/A
- **Type**: Uses WebSockets, not FCM
- **Reason**: Admin panel uses WebSocket connections for real-time updates
- **Status**: ✅ Not required - WebSockets handle real-time updates

### 2. Backend API Service (Service Account)
- **Location**: `services/api-service/firebase-service-account.json` (file)
- **OR**: `FIREBASE_SERVICE_ACCOUNT` environment variable
- **Type**: Server-side service account credentials
- **Contains**: private_key, client_email, project_id, etc.
- **Status**: ⚠️ Needs to be configured (see FIREBASE_SETUP.md)

### 3. Flutter Mobile App
- **Android**: `mobile/fayo/android/app/google-services.json`
- **iOS**: `mobile/fayo/ios/Runner/GoogleService-Info.plist`
- **Type**: Native Firebase config files
- **Status**: ⚠️ Needs to be downloaded and added

## How to Get Service Account JSON

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **fayo-healthcare**
3. Click ⚙️ **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Confirm and download the JSON file
7. Save as `services/api-service/firebase-service-account.json`

## Security Notes

⚠️ **NEVER commit these files to Git:**
- `firebase-service-account.json` (already in .gitignore)
- `.env` files with credentials
- `google-services.json` (can be committed, but be careful)
- `GoogleService-Info.plist` (can be committed, but be careful)

✅ **Safe to commit:**
- `web/admin-panel/src/config/firebase.config.ts` (public config, safe)
- Client-side configs (apiKey is public by design)

## Quick Reference

| Component | Config Type | Location | Status |
|-----------|------------|----------|--------|
| Admin Panel | WebSockets (not FCM) | N/A | ✅ Not needed |
| Backend API | Service Account | `services/api-service/firebase-service-account.json` | ⚠️ Needs setup |
| Flutter Android | Native Config | `mobile/fayo/android/app/google-services.json` | ⚠️ Needs setup |
| Flutter iOS | Native Config | `mobile/fayo/ios/Runner/GoogleService-Info.plist` | ⚠️ Needs setup |

## Next Steps

1. ⚠️ **Download service account JSON for backend** (see FIREBASE_SETUP.md) - REQUIRED
2. ⚠️ Download native configs for Flutter app (google-services.json & GoogleService-Info.plist)
3. ✅ Firebase packages already in Flutter pubspec.yaml
4. ✅ Admin panel uses WebSockets - no FCM needed

