# Agora Video Calling Implementation Guide

This guide explains how Agora video calling is implemented in the FAYO Healthcare project, covering both the admin panel (Next.js/Web) and Flutter mobile app.

## 📚 Official Agora Documentation

- **Web SDK**: https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=web
- **Flutter SDK**: https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=flutter
- **Token Authentication**: https://docs.agora.io/en/video-calling/develop/integrate-token-generation

## 🏗️ Architecture Overview

```
Admin Panel (Next.js)          Flutter App
     │                              │
     │                              │
     ├─ Create Call Session ────────┼─→ Call Service (NestJS)
     │                              │
     │                              │
     ├─ Get Agora Token ────────────┼─→ Agora Service
     │                              │
     │                              │
     ├─ Join Channel ───────────────┼─→ Agora RTC Network
     │                              │
     └─ Video/Audio Stream ────────┴─→ Peer-to-Peer Communication
```

## 🔑 Key Concepts

### 1. **App ID & App Certificate**
- **App ID**: Unique identifier for your Agora project
- **App Certificate**: Used to generate secure tokens (required for production)

### 2. **Channel**
- A virtual room where users join for video/audio communication
- Channel names must be:
  - Maximum 64 bytes
  - Only contain: `a-z`, `A-Z`, `0-9`, spaces, and special characters: `!`, `#`, `$`, `%`, `&`, `(`, `)`, `+`, `-`, `:`, `;`, `<`, `=`, `.`, `>`, `?`, `@`, `[`, `]`, `^`, `_`, `{`, `}`, `|`, `~`, `,`

### 3. **Token Authentication**
- **Purpose**: Secure access to Agora channels
- **Types**:
  - **UID-based**: Uses numeric user IDs
  - **User Account-based**: Uses string user accounts (what we use)
- **Expiration**: Tokens expire after a set time (default: 3600 seconds)

### 4. **User Roles**
- **HOST (PUBLISHER)**: Can publish audio/video streams
- **AUDIENCE (SUBSCRIBER)**: Can only subscribe to streams (view/listen)

## 💻 Web Implementation (Admin Panel)

### Setup

```typescript
import AgoraRTC from 'agora-rtc-sdk-ng';
```

### Step-by-Step Flow

#### 1. Create Agora Client

```typescript
const client = AgoraRTC.createClient({ 
  mode: 'rtc',      // Real-time communication mode
  codec: 'vp8'      // Video codec
});
```

#### 2. Set Up Event Handlers

```typescript
// When a remote user publishes their stream
client.on('user-published', async (user, mediaType) => {
  // Subscribe to the remote user's stream
  await client.subscribe(user, mediaType);
  
  if (mediaType === 'video') {
    // Play remote video
    user.videoTrack?.play(remoteVideoElement);
  }
  
  if (mediaType === 'audio') {
    // Play remote audio
    user.audioTrack?.play();
  }
});

// When a remote user unpublishes their stream
client.on('user-unpublished', (user) => {
  // Handle user leaving
  user.videoTrack?.stop();
  user.audioTrack?.stop();
});
```

#### 3. Join Channel

```typescript
await client.join(
  appId,           // Your Agora App ID
  channelName,     // Channel name (e.g., "fayo_user123_abc456")
  token,           // Token from backend (or null for testing)
  null             // UID (null = Agora assigns automatically)
);
```

#### 4. Create and Publish Local Tracks

```typescript
// Create microphone and camera tracks
const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();

// Publish tracks to channel
await client.publish([micTrack, camTrack]);

// Play local video
camTrack.play(localVideoElement);
```

#### 5. Cleanup

```typescript
// Stop and close tracks
micTrack.stop();
micTrack.close();
camTrack.stop();
camTrack.close();

// Leave channel
await client.leave();
```

### Complete Example (Our Implementation)

See: `web/admin-panel/src/components/CallOverlay.tsx`

## 📱 Flutter Implementation

### Setup

```yaml
dependencies:
  agora_rtc_engine: ^6.5.0
  permission_handler: ^11.3.1
```

### Step-by-Step Flow

#### 1. Request Permissions

```dart
final statuses = await [Permission.camera, Permission.microphone].request();
if (statuses[Permission.camera] != PermissionStatus.granted ||
    statuses[Permission.microphone] != PermissionStatus.granted) {
  // Handle permission denied
  return;
}
```

#### 2. Initialize Agora Engine

```dart
final engine = createAgoraRtcEngine();
await engine.initialize(RtcEngineContext(
  appId: credential.appId,
));
```

#### 3. Register Event Handlers

```dart
engine.registerEventHandler(
  RtcEngineEventHandler(
    onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
      // Local user successfully joined
      setState(() => _localJoined = true);
    },
    onUserJoined: (RtcConnection connection, int remoteUid, int elapsed) {
      // Remote user joined
      setState(() => _remoteUid = remoteUid);
    },
    onUserOffline: (RtcConnection connection, int remoteUid, UserOfflineReasonType reason) {
      // Remote user left
      setState(() => _remoteUid = null);
    },
    onError: (ErrorCodeType err, String msg) {
      // Handle errors
    },
  ),
);
```

#### 4. Enable Video and Start Preview

```dart
await engine.enableVideo();
await engine.startPreview();
```

#### 5. Join Channel with User Account

```dart
await engine.joinChannelWithUserAccount(
  token: credential.token,
  channelId: credential.channelName,
  userAccount: credential.rtcUserId,  // String user account
  options: const ChannelMediaOptions(
    clientRoleType: ClientRoleType.clientRoleBroadcaster,
  ),
);
```

#### 6. Display Video

```dart
// Local video (picture-in-picture)
AgoraVideoView(
  controller: VideoViewController(
    rtcEngine: engine,
    canvas: const VideoCanvas(uid: 0),  // 0 = local user
  ),
)

// Remote video (full screen)
AgoraVideoView(
  controller: VideoViewController.remote(
    rtcEngine: engine,
    canvas: VideoCanvas(uid: remoteUid),
    connection: RtcConnection(channelId: channelName),
  ),
)
```

#### 7. Cleanup

```dart
await engine.leaveChannel();
await engine.release();
```

### Complete Example (Our Implementation)

See: `mobile/flutter_app/lib/screens/call_screen.dart`

## 🔧 Backend Implementation (NestJS)

### Token Generation

```typescript
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

generateToken(channelName: string, userAccount: string, role: AgoraRole) {
  const privilegeExpireTs = Math.floor(Date.now() / 1000) + tokenTtl;
  
  const token = RtcTokenBuilder.buildTokenWithAccount(
    appId,
    appCertificate,
    channelName,
    userAccount,        // String user account (e.g., user ID)
    role,               // PUBLISHER or SUBSCRIBER
    privilegeExpireTs
  );
  
  return { appId, token, expiresIn: tokenTtl, expiresAt: new Date(privilegeExpireTs * 1000) };
}
```

### Channel Name Generation

```typescript
// Must be <= 64 bytes
private generateChannelName(userId: string) {
  const shortUserId = userId.substring(0, 8);
  const shortUuid = randomUUID().replace(/-/g, '').substring(0, 16);
  const channelName = `fayo_${shortUserId}_${shortUuid}`;
  
  // Ensure <= 64 bytes
  return channelName.length > 64 
    ? channelName.substring(0, 64) 
    : channelName;
}
```

## 🔐 Security Best Practices

### 1. **Always Use Tokens in Production**
- Never use App ID alone in production
- Generate tokens on the backend (never expose App Certificate to clients)

### 2. **Token Expiration**
- Set appropriate expiration times (default: 3600 seconds = 1 hour)
- Implement token refresh before expiration

### 3. **HTTPS Required for Web**
- Agora Web SDK requires HTTPS (or localhost)
- Use nginx with SSL certificates for production

### 4. **Channel Name Validation**
- Validate channel names on backend
- Ensure they meet Agora's requirements

## 🐛 Common Issues & Solutions

### Issue 1: "Invalid Channel Name"
**Error**: `The length must be within 64 bytes`
**Solution**: Ensure channel names are <= 64 bytes and contain only allowed characters

### Issue 2: "WEB_SECURITY_RESTRICT"
**Error**: `Your context is limited by web security`
**Solution**: Use HTTPS or localhost (browsers require secure context for media)

### Issue 3: "Token Expired"
**Error**: Token authentication fails
**Solution**: Generate a new token from the backend

### Issue 4: "User Account Mismatch"
**Error**: Cannot join with user account
**Solution**: Ensure token was generated with the same user account string

### Issue 5: "Permission Denied"
**Error**: Camera/microphone access denied
**Solution**: Request permissions before initializing Agora

## 📊 Call Flow Diagram

```
1. Admin initiates call
   │
   ├─→ POST /api/v1/calls/session
   │   └─→ Creates CallSession in database
   │   └─→ Generates Agora token (HOST role)
   │   └─→ Emits WebSocket event to recipient
   │
2. Flutter user receives invitation
   │
   ├─→ WebSocket: call_invitation event
   │   └─→ Shows accept/decline dialog
   │
3. User accepts call
   │
   ├─→ POST /api/v1/calls/session/{id}/token
   │   └─→ Generates Agora token (AUDIENCE role)
   │
4. Both users join Agora channel
   │
   ├─→ Admin: join() with HOST token
   ├─→ Flutter: joinChannelWithUserAccount() with AUDIENCE token
   │
5. Video/Audio streams established
   │
   ├─→ Peer-to-peer communication via Agora
   │
6. Call ends
   │
   ├─→ leaveChannel() / client.leave()
   └─→ Cleanup tracks and engine
```

## 🧪 Testing

### Test Checklist

- [ ] Permissions granted (camera, microphone)
- [ ] Token generated successfully
- [ ] Channel name valid (<= 64 bytes)
- [ ] Both users can join channel
- [ ] Local video displays
- [ ] Remote video displays
- [ ] Audio works (both directions)
- [ ] Call can be ended properly
- [ ] Cleanup happens on disconnect

### Debug Logging

**Web (Browser Console):**
```javascript
// Enable Agora debug logging
AgoraRTC.setLogLevel(4); // 0-4, 4 = all logs
```

**Flutter:**
```dart
// Already enabled in our implementation
debugPrint("✅ [CALL] Local user joined channel");
debugPrint("✅ [CALL] Remote user joined: $remoteUid");
```

## 📝 Configuration

### Environment Variables

```bash
# Backend (call-service)
AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_app_certificate
AGORA_TOKEN_TTL=3600  # Token expiration in seconds
```

### Frontend Configuration

**Web:**
- Uses credentials from API response
- No direct App ID/Certificate exposure

**Flutter:**
- Uses credentials from API response
- App ID comes from backend

## 🔗 Resources

- **Agora Console**: https://console.agora.io/
- **Web SDK Docs**: https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=web
- **Flutter SDK Docs**: https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=flutter
- **Token Generator**: https://www.agora.io/en/blog/token-generator/
- **Sample Projects**: https://github.com/AgoraIO/Basic-Video-Call

## 🎯 Key Takeaways

1. **Always use tokens** for production security
2. **Channel names** must be <= 64 bytes
3. **HTTPS required** for web browsers
4. **User accounts** (strings) vs UIDs (numbers) - we use user accounts
5. **Proper cleanup** is essential to prevent memory leaks
6. **Error handling** should be comprehensive
7. **Permissions** must be requested before media access

## 📞 Support

For Agora-specific issues:
- Check Agora documentation
- Review error codes: https://docs.agora.io/en/video-calling/develop/error-codes
- Contact Agora support via console

For FAYO implementation issues:
- Check service logs: `docker logs call-service`
- Review WebSocket connections
- Verify token generation in backend

