# Firebase SHA-1/SHA-256 Fingerprints

## Do You Need Fingerprints?

### ✅ **NOT Required For:**
- **Firebase Cloud Messaging (FCM)** - Works without fingerprints
- **Firebase Analytics** - Works without fingerprints
- **Firebase Crashlytics** - Works without fingerprints
- **Basic Firebase features** - Work with just `google-services.json`

### ⚠️ **Required For:**
- **Google Sign-In** - Needs SHA-1/SHA-256 fingerprints
- **Phone Authentication** - Needs SHA-1/SHA-256 fingerprints
- **App Check** - Needs SHA-1/SHA-256 fingerprints
- **Dynamic Links** - Needs SHA-1/SHA-256 fingerprints

## Current Status

**For FCM (what we're using):** ✅ **Fingerprints NOT needed**

Your FCM is working correctly without fingerprints:
- ✅ Token generation works
- ✅ Token registration works
- ✅ Notifications can be sent

## If You Need to Add Fingerprints (for future features)

### Step 1: Get SHA-1 and SHA-256 Fingerprints

#### For Debug Build:
```bash
cd mobile/fayo/android

# Using Gradle (recommended)
./gradlew signingReport

# Or using keytool directly
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

#### For Release Build:
```bash
# If you have a release keystore
keytool -list -v -keystore /path/to/your/keystore.jks -alias your-key-alias
```

### Step 2: Add to Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **fayo-healthcare**
3. Click **⚙️ Settings** → **Project settings**
4. Scroll to **"Your apps"** section
5. Click on your Android app (`com.fayo.healthcare`)
6. Click **"Add fingerprint"**
7. Paste SHA-1 and SHA-256 fingerprints
8. Click **Save**

### Step 3: Download Updated `google-services.json`

After adding fingerprints:
1. Download the updated `google-services.json`
2. Replace `mobile/fayo/android/app/google-services.json`
3. Rebuild the app

## Quick Check: Do You Need Fingerprints?

**Answer these questions:**

1. ❓ Are you using Google Sign-In? → **Yes** = Need fingerprints
2. ❓ Are you using Phone Authentication? → **Yes** = Need fingerprints
3. ❓ Are you using App Check? → **Yes** = Need fingerprints
4. ❓ Are you only using FCM for push notifications? → **Yes** = ✅ **No fingerprints needed!**

## Current FCM Status

✅ **FCM is working without fingerprints:**
- Token generation: ✅ Working
- Token registration: ✅ Working
- Notification sending: ✅ Ready (once Firebase Admin SDK is initialized)

**Conclusion:** You don't need to add fingerprints for FCM to work. Only add them if you plan to use Google Sign-In, Phone Auth, or App Check in the future.

