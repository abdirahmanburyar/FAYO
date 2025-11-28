# Agora Video Calling Implementation Guide

This document provides a comprehensive guide to the Agora RTC SDK implementation across the FAYO Healthcare platform, following the [official Agora documentation](https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=web).

## Overview

The FAYO Healthcare platform uses Agora RTC SDK for video calling functionality across three platforms:
1. **Backend (NestJS)** - Token generation and call management
2. **Web Admin Panel (Next.js)** - Video calling interface for doctors/admins
3. **Mobile App (Kotlin Multiplatform Android)** - Video calling interface for patients

## Architecture

```
┌─────────────────┐
│  Appointment     │
│  Service        │───► Generates Agora RTC Tokens
│  (NestJS)       │     Manages call sessions
└────────┬────────┘
         │
         ├───► WebSocket Events (call.invitation, call.accepted, call.ended)
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌───▼────┐
│ Next │ │ Android│
│  JS  │ │   App  │
└───┬───┘ └───┬────┘
    │         │
    └────┬────┘
         │
    ┌────▼────┐
    │  Agora  │
    │   RTC   │
    │  Cloud  │
    └─────────┘
```

## Backend Implementation (appointment-service)

### Setup

1. **Install Dependencies**
   ```bash
   npm install agora-access-token
   ```

2. **Environment Variables**
   Add to `.env`:
   ```env
   AGORA_APP_ID=your_app_id
   AGORA_APP_CERTIFICATE=your_app_certificate
   AGORA_TOKEN_TTL=3600  # Token expiration in seconds (default: 1 hour)
   ```

### Implementation

**Location**: `services/appointment-service/src/agora/agora.service.ts`

The `AgoraService` provides:
- `generateRtcToken()` - Generate RTC token for a user
- `generateCallCredentials()` - Generate credentials for both HOST and PARTICIPANT
- `validateChannelName()` - Validate channel name format
- `getAppId()` - Get Agora App ID

**Key Features**:
- Token-based authentication
- Role-based access (publisher/subscriber)
- Automatic token expiration
- Channel name validation

### API Endpoints

**Create Call** (POST `/api/v1/calls`)
```typescript
{
  appointmentId: string
}
```

**Get Participant Credentials** (GET `/api/v1/calls/participant/:appointmentId?userId=xxx`)
Returns credentials for patient to join call.

**Accept Call** (POST `/api/v1/calls/:appointmentId/accept`)
```typescript
{
  patientId: string,
  channelName: string
}
```

**End Call** (POST `/api/v1/calls/:appointmentId/end`)
```typescript
{
  userId: string
}
```

### WebSocket Events

The service broadcasts the following events via WebSocket:

- `call.invitation` - Sent to patient when doctor starts a call
- `call.accepted` - Sent when patient accepts the call
- `call.ended` - Sent when call ends

## Web Implementation (Next.js Admin Panel)

### Setup

1. **Install Dependencies**
   ```bash
   npm install agora-rtc-sdk-ng
   ```

   Already included in `web/admin-panel/package.json`.

### Implementation

**Location**: `web/admin-panel/src/app/call/[sessionId]/CallPageContent.tsx`

**Key Features**:
- Real-time video/audio streaming
- Mute/unmute controls
- Video on/off controls
- Screen sharing (optional)
- Multiple remote users support
- Connection state management
- Call duration timer

### Usage Flow

1. **Initialize Client**
   ```typescript
   const agoraClient = AgoraRTC.createClient({ 
     mode: 'rtc', 
     codec: 'vp8' 
   });
   ```

2. **Join Channel** (after patient accepts)
   ```typescript
   await agoraClient.join(
     credential.appId,
     credential.channelName,
     credential.token,
     credential.uid
   );
   ```

3. **Publish Local Tracks**
   ```typescript
   const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
   await agoraClient.publish([audioTrack, videoTrack]);
   ```

4. **Subscribe to Remote Users**
   ```typescript
   agoraClient.on('user-published', async (user, mediaType) => {
     await agoraClient.subscribe(user, mediaType);
     if (mediaType === 'video') {
       user.videoTrack?.play(videoElement);
     }
     if (mediaType === 'audio') {
       user.audioTrack?.play();
     }
   });
   ```

5. **Leave Channel**
   ```typescript
   await agoraClient.leave();
   localVideoTrack?.close();
   localAudioTrack?.close();
   ```

### Event Handlers

- `user-published` - Remote user published audio/video
- `user-unpublished` - Remote user stopped publishing
- `user-left` - Remote user left the channel
- `connection-state-change` - Connection state changed

## Android Implementation (Kotlin Multiplatform)

### Setup

1. **Add Dependency**
   In `mobile/kmp/androidApp/build.gradle.kts`:
   ```kotlin
   implementation("io.agora.rtc:full-sdk:4.2.0")
   ```
   
   Check [Agora Android SDK docs](https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=android) for the latest version.

2. **Add Permissions**
   In `AndroidManifest.xml` (already added):
   ```xml
   <uses-permission android:name="android.permission.CAMERA" />
   <uses-permission android:name="android.permission.RECORD_AUDIO" />
   <uses-permission android:name="android.permission.INTERNET" />
   <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
   <uses-permission android:name="android.permission.BLUETOOTH" />
   <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
   ```

3. **ProGuard Rules**
   In `proguard-rules.pro`:
   ```proguard
   -keep class io.agora.** { *; }
   -dontwarn io.agora.**
   ```

### Implementation

**Location**: `mobile/kmp/androidApp/src/main/java/com/fayo/healthcare/data/services/AndroidAgoraVideoService.kt`

**Key Features**:
- RTC Engine initialization
- Channel joining/leaving
- Local video/audio publishing
- Remote user management
- Video/audio controls
- Permission handling

### Usage Flow

1. **Initialize Engine**
   ```kotlin
   val config = RtcEngineConfig().apply {
       mContext = context
       mAppId = credentials.appId
       mEventHandler = object : IRtcEngineEventHandler() {
           override fun onJoinChannelSuccess(channel: String?, uid: Int, elapsed: Int) {
               // Handle join success
           }
           override fun onUserJoined(uid: Int, elapsed: Int) {
               // Handle remote user joined
           }
           override fun onUserOffline(uid: Int, reason: Int) {
               // Handle remote user left
           }
       }
   }
   rtcEngine = RtcEngine.create(config)
   rtcEngine?.enableVideo()
   rtcEngine?.enableAudio()
   ```

2. **Join Channel**
   ```kotlin
   val options = ChannelMediaOptions().apply {
       clientRoleType = if (role == "HOST") {
           Constants.CLIENT_ROLE_BROADCASTER
       } else {
           Constants.CLIENT_ROLE_AUDIENCE
       }
       publishCameraTrack = role == "HOST"
       publishMicrophoneTrack = role == "HOST"
   }
   rtcEngine?.joinChannel(
       token,
       channelName,
       uid,
       options
   )
   ```

3. **Setup Local Video**
   ```kotlin
   val surfaceView = SurfaceView(context)
   rtcEngine?.setupLocalVideo(
       VideoCanvas(surfaceView, Constants.RENDER_MODE_HIDDEN, 0)
   )
   rtcEngine?.startPreview()
   ```

4. **Setup Remote Video**
   ```kotlin
   rtcEngine?.setupRemoteVideo(
       VideoCanvas(surfaceView, Constants.RENDER_MODE_HIDDEN, uid)
   )
   ```

5. **Leave Channel**
   ```kotlin
   rtcEngine?.leaveChannel()
   rtcEngine = null
   ```

### Event Handlers

- `onJoinChannelSuccess` - Successfully joined channel
- `onUserJoined` - Remote user joined
- `onUserOffline` - Remote user left
- `onRemoteVideoStateChanged` - Remote video state changed
- `onRemoteAudioStateChanged` - Remote audio state changed
- `onError` - Error occurred

## Call Flow

### 1. Doctor/Admin Starts Call

```
Admin Panel → POST /api/v1/calls
           → Backend generates HOST credentials
           → Backend broadcasts call.invitation via WebSocket
           → Admin joins Agora channel with HOST role
```

### 2. Patient Receives Invitation

```
WebSocket → call.invitation event
         → Patient sees call invitation
         → Patient can accept or decline
```

### 3. Patient Accepts Call

```
Patient → POST /api/v1/calls/:appointmentId/accept
       → Backend broadcasts call.accepted via WebSocket
       → Patient joins Agora channel with AUDIENCE role
       → Both users can see/hear each other
```

### 4. Call Ends

```
Either user → POST /api/v1/calls/:appointmentId/end
           → Backend broadcasts call.ended via WebSocket
           → Both users leave Agora channel
```

## Credentials Structure

```typescript
interface CallCredentials {
  appId: string;           // Agora App ID
  token: string;           // RTC token for authentication
  channelName: string;      // Unique channel name (e.g., "appointment-{id}")
  uid: number | string;    // User ID (0 for auto-generated)
  role: 'HOST' | 'AUDIENCE'; // User role
  expiresAt: string;       // Token expiration timestamp
  expiresIn: number;       // Token expiration in seconds
}
```

## Channel Naming Convention

Channels are named using the pattern:
```
appointment-{appointmentId}-{timestamp}
```

Example: `appointment-clx123abc-1704067200000`

## Security Considerations

1. **Token Expiration**: Tokens expire after 1 hour (configurable)
2. **Channel Validation**: Channel names are validated for format
3. **Role-Based Access**: HOST can publish, AUDIENCE can only subscribe
4. **User Authorization**: Backend validates user permissions before generating tokens

## Troubleshooting

### Web Issues

- **Black screen**: Check camera permissions and browser compatibility
- **No audio**: Check microphone permissions
- **Connection failed**: Verify token and channel name are correct
- **User not visible**: Ensure remote user has published video track

### Android Issues

- **SDK initialization fails**: Check appId is set correctly
- **Permission denied**: Request runtime permissions before joining
- **Black screen**: Ensure SurfaceView is properly set up
- **No audio**: Check audio permissions and device settings

### Backend Issues

- **Token generation fails**: Verify AGORA_APP_ID and AGORA_APP_CERTIFICATE
- **Invalid channel name**: Check channel name format (alphanumeric, hyphens, underscores, max 64 chars)

## Testing

### Test with Two Devices

1. Start call from admin panel (desktop)
2. Accept call from mobile app
3. Verify both can see and hear each other
4. Test mute/unmute and video on/off
5. Test call ending

### Test with Web Demo

Use Agora's web demo to test:
- Join same channel from web demo
- Verify audio/video works
- Test different roles (publisher/subscriber)

## References

- [Agora Web SDK Documentation](https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=web)
- [Agora Android SDK Documentation](https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=android)
- [Agora Token Server Guide](https://docs.agora.io/en/video-calling/develop/integrate-token-generation)
- [Agora API Reference](https://docs.agora.io/en/video-calling/reference/api-overview)

## Next Steps

1. ✅ Backend implementation complete
2. ✅ Web implementation complete
3. ✅ Android implementation complete
4. ⏳ Add screen sharing feature
5. ⏳ Add recording functionality
6. ⏳ Add call quality monitoring
7. ⏳ Add network quality indicators

