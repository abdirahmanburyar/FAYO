# Zoom SDK Migration Guide

This guide documents the migration from Agora to Zoom Video SDK.

## Backend Changes (Completed ✅)

### 1. Zoom Service
- **File**: `services/call-service/src/zoom/zoom.service.ts`
- **Purpose**: Generates Zoom JWT tokens using SDK Key and Secret
- **Environment Variables**:
  - `ZOOM_SDK_KEY` - Your Zoom SDK Key
  - `ZOOM_SDK_SECRET` - Your Zoom SDK Secret
  - `ZOOM_TOKEN_TTL` - Token expiration time (default: 3600 seconds)

### 2. Updated Files
- `services/call-service/src/calls/calls.service.ts` - Now uses ZoomService
- `services/call-service/src/calls/calls.module.ts` - Imports ZoomModule
- `services/call-service/src/app.module.ts` - Imports ZoomModule
- `services/call-service/package.json` - Replaced `agora-access-token` with `jsonwebtoken`
- `services/call-service/env.example` - Updated environment variables

## Frontend Changes (Next.js - In Progress)

### 1. Package Update
- **File**: `web/admin-panel/package.json`
- **Change**: Replaced `agora-rtc-sdk-ng` with `@zoom/videosdk`

### 2. API Interface Update
- **File**: `web/admin-panel/src/services/callApi.ts`
- **Change**: Updated `CallCredential` interface to include Zoom-specific fields:
  - `sdkKey` (replaces `appId`)
  - `sessionName` (replaces `channelName`)
  - `userIdentity` (replaces `rtcUserId`)
  - `role`: 'HOST' | 'PARTICIPANT' (replaces 'HOST' | 'AUDIENCE')

### 3. Call Page Migration
- **File**: `web/admin-panel/src/app/call/[sessionId]/page.tsx`
- **Status**: Needs complete refactor
- **Key Changes**:
  - Replace `AgoraRTC.createClient()` with Zoom Video SDK initialization
  - Replace `client.join()` with Zoom `joinSession()`
  - Replace Agora event handlers with Zoom event handlers
  - Update video/audio track handling

## Flutter Changes (In Progress)

### 1. Package Update
- **File**: `mobile/flutter_app/pubspec.yaml`
- **Change**: Replace `agora_rtc_engine` with `flutter_zoom_videosdk`

### 2. Call Screen Migration
- **File**: `mobile/flutter_app/lib/screens/call_screen.dart`
- **Status**: Needs complete refactor
- **Key Changes**:
  - Replace `RtcEngine` with `ZoomVideoSdk`
  - Replace `joinChannelWithUserAccount()` with `joinSession()`
  - Update event handlers

## Next Steps

1. **Install Dependencies**:
   ```bash
   # Backend
   cd services/call-service
   npm install
   
   # Frontend
   cd web/admin-panel
   npm install
   
   # Flutter
   cd mobile/flutter_app
   flutter pub get
   ```

2. **Configure Environment Variables**:
   - Add `ZOOM_SDK_KEY` and `ZOOM_SDK_SECRET` to `services/call-service/.env`
   - Get these from Zoom App Marketplace: https://marketplace.zoom.us/

3. **Update Call Page Implementation**:
   - Refactor `web/admin-panel/src/app/call/[sessionId]/page.tsx` to use Zoom SDK
   - Refactor `mobile/flutter_app/lib/screens/call_screen.dart` to use Zoom SDK

4. **Test**:
   - Test call creation from admin panel
   - Test call acceptance from Flutter app
   - Verify video/audio streaming works

## Zoom SDK Resources

- **Web SDK**: https://marketplace.zoom.us/docs/sdk/video/web
- **Flutter SDK**: https://marketplace.zoom.us/docs/sdk/video/flutter
- **JWT Token Generation**: https://marketplace.zoom.us/docs/guides/auth/jwt

## Important Notes

- Zoom uses JWT tokens (not Agora-style tokens)
- Session names can be up to 200 characters (vs Agora's 64 bytes)
- Zoom uses `sessionName` instead of `channelName`
- Zoom roles are: `HOST` (1) or `PARTICIPANT` (0)

