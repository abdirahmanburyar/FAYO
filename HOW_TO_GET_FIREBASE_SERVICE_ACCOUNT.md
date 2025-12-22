# How to Get Firebase Service Account JSON

## Step-by-Step Instructions

### Step 1: Go to Firebase Console
1. Open your browser
2. Go to: https://console.firebase.google.com/
3. Sign in with your Google account

### Step 2: Select Your Project
1. You should see your project: **fayo-healthcare**
2. Click on it to open the project

### Step 3: Open Project Settings
1. Click the **⚙️ gear icon** in the top left (next to "Project Overview")
2. Select **"Project settings"** from the dropdown menu

### Step 4: Go to Service Accounts Tab
1. In the Project Settings page, you'll see several tabs at the top:
   - General
   - Cloud Messaging ← (This is where you were before)
   - **Service Accounts** ← Click this tab
   - Integrations
   - etc.

2. Click on the **"Service Accounts"** tab

### Step 5: Generate New Private Key
1. In the Service Accounts tab, you'll see:
   - A section showing your service account email
   - A button that says **"Generate new private key"** or **"Generate New Private Key"**

2. Click the **"Generate new private key"** button

3. A popup will appear warning you about keeping the key secure
4. Click **"Generate key"** to confirm

### Step 6: Download the JSON File
1. A JSON file will automatically download to your computer
2. The file will be named something like:
   - `fayo-healthcare-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`
   - Or just a random name with `.json` extension

### Step 7: Rename and Place the File
1. **Rename the file** to: `firebase-service-account.json`
2. **Move the file** to: `services/api-service/` directory

**Full path should be:**
```
C:\FAYO\services\api-service\firebase-service-account.json
```

### Step 8: Verify the File
1. Open the file location: `services/api-service/`
2. You should see `firebase-service-account.json` there
3. The file should contain JSON with fields like:
   ```json
   {
     "type": "service_account",
     "project_id": "fayo-healthcare",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     "client_email": "...@fayo-healthcare.iam.gserviceaccount.com",
     "client_id": "...",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token",
     ...
   }
   ```

### Step 9: Restart API Service
After placing the file, restart your API service:
```bash
pm2 restart fayo-api-service
# or
cd services/api-service && npm run start:dev
```

### Step 10: Check Logs
Look for these messages in your API service logs:
```
✅ Firebase service account loaded from file
✅ Firebase Admin SDK initialized successfully
```

## Visual Guide

```
Firebase Console
    ↓
Project: fayo-healthcare
    ↓
⚙️ Settings → Project settings
    ↓
Service Accounts tab
    ↓
"Generate new private key" button
    ↓
Download JSON file
    ↓
Rename to: firebase-service-account.json
    ↓
Place in: services/api-service/
    ↓
Restart API service
    ↓
✅ Done!
```

## Troubleshooting

### Can't find "Service Accounts" tab?
- Make sure you're in **Project Settings** (not Cloud Messaging settings)
- Look for tabs: General, Cloud Messaging, **Service Accounts**, Integrations, etc.
- It should be the 3rd or 4th tab

### File not downloading?
- Check your browser's download settings
- Look in your Downloads folder
- Try a different browser

### File is in wrong location?
- Make sure it's in: `services/api-service/firebase-service-account.json`
- Not in: `services/api-service/src/...`
- Not in: root `FAYO/...`
- Should be same level as `package.json` in api-service

### Still not working?
- Check file permissions
- Verify the JSON is valid (open it in a text editor)
- Check API service logs for error messages

## Security Reminder

⚠️ **Important**: 
- This file contains private keys
- Never commit it to Git (already in .gitignore)
- Keep it secure
- Don't share it publicly

## Quick Checklist

- [ ] Opened Firebase Console
- [ ] Selected fayo-healthcare project
- [ ] Went to Project Settings → Service Accounts tab
- [ ] Clicked "Generate new private key"
- [ ] Downloaded the JSON file
- [ ] Renamed to `firebase-service-account.json`
- [ ] Placed in `services/api-service/` directory
- [ ] Restarted API service
- [ ] Verified logs show "Firebase Admin SDK initialized"

