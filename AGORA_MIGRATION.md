# Agora Migration Guide

## Overview
This document tracks the migration from Zoom Video SDK to Agora RTC SDK.

## Backend Changes ✅

### Completed
- ✅ Created `AgoraService` to replace `ZoomService`
- ✅ Updated `CallsService` to use Agora
- ✅ Updated `AppointmentGateway` WebSocket to use `channelName` instead of `sessionName`
- ✅ Updated `env.example` with Agora configuration
- ✅ Updated `package.json` to use `agora-access-token` instead of `jsonwebtoken` for Zoom

### Environment Variables
```env
AGORA_APP_ID=4bae186c2f0446c4bc30f0694293a8c4
AGORA_APP_CERTIFICATE=5923c741e1f6440d9aaa27d505b8ceeb
AGORA_TOKEN_TTL=3600
```

### Key Changes
- `sessionName` → `channelName`
- `sdkKey` → `appId`
- `userIdentity` → `uid` (number)
- `role: 'HOST' | 'PARTICIPANT'` → `role: 'publisher' | 'subscriber'`
- Zoom JWT tokens → Agora RTC tokens

## Web Admin Panel (In Progress)

### Package Changes
- ✅ Updated `package.json`: `@zoom/videosdk` → `agora-rtc-sdk-ng`

### Files to Update
- `web/admin-panel/src/app/call/[sessionId]/CallPageContent.tsx` - Replace Zoom SDK with Agora RTC
- `web/admin-panel/src/services/callApi.ts` - Update credential interface

### Agora RTC SDK Usage
```typescript
import AgoraRTC from 'agora-rtc-sdk-ng';

// Create client
const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

// Join channel
await client.join(appId, channelName, token, uid);

// Get local tracks
const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();

// Publish tracks
await client.publish([audioTrack, videoTrack]);

// Handle remote users
client.on('user-published', async (user, mediaType) => {
  await client.subscribe(user, mediaType);
  if (mediaType === 'video') {
    user.videoTrack?.play(videoContainer);
  }
  if (mediaType === 'audio') {
    user.audioTrack?.play();
  }
});
```

## Mobile App (Pending)

### Android Changes
- Replace `ZoomVideoService` with `AgoraVideoService`
- Update `CallScreen.kt` to use Agora RTC SDK
- Update data models to use Agora terminology

### Agora Android SDK
```kotlin
// Add to build.gradle.kts
implementation("io.agora.rtc:full-sdk:4.2.0")

// Initialize
val engine = RtcEngine.create(context, appId, IRtcEngineEventHandler())

// Join channel
engine.joinChannel(token, channelName, uid, ChannelMediaOptions())

// Enable video/audio
engine.enableVideo()
engine.enableAudio()
```

## Data Model Changes

### CallCredential Interface
```typescript
// Old (Zoom)
interface CallCredential {
  sdkKey: string;
  token: string;
  sessionName: string;
  userIdentity: string;
  role: 'HOST' | 'PARTICIPANT';
}

// New (Agora)
interface CallCredential {
  appId: string;
  token: string;
  channelName: string;
  uid: number | string;
  role: 'HOST' | 'AUDIENCE';
}
```

## Next Steps

1. ✅ Complete backend migration
2. 🔄 Complete web admin panel migration
3. ⏳ Complete mobile app migration
4. ⏳ Update documentation
5. ⏳ Remove Zoom-related files

