# Video Call Workflow Implementation - Complete Guide

This document describes the complete end-to-end video calling workflow implementation in the FAYO Healthcare project.

## 🔄 Complete Workflow

### Step 1: Admin Initiates Call

**Location**: `web/admin-panel/src/app/admin/users/page.tsx`

1. Admin clicks "Call" button next to a user
2. `handleStartCall()` function is called
3. API call to `POST /api/v1/calls/session` with:
   - `recipientId`: Target user's ID
   - `callType`: 'VIDEO'
   - Authorization header with admin JWT token

**Backend Processing** (`services/call-service/src/calls/calls.service.ts`):
- Creates `CallSession` in database
- Generates unique channel name (max 64 bytes)
- Generates Agora token with HOST role for admin
- Emits `call.session.created` event
- Returns session and credential to admin panel

### Step 2: WebSocket Event Emission

**Location**: `services/call-service/src/gateway/call.gateway.ts`

1. Event listener catches `call.session.created` event
2. Emits `call_invitation` WebSocket event to recipient's room: `user:{recipientId}`
3. Payload includes: session ID, channel name, initiator ID

### Step 3: Flutter User Receives Invitation

**Location**: `mobile/flutter_app/lib/screens/home_screen.dart`

1. `CallSocketService` is initialized when user logs in
2. Connects to WebSocket: `http://31.97.58.62:3010/ws/calls`
3. Listens for `call_invitation` events
4. When received, shows accept/decline dialog
5. User accepts → proceeds to Step 4
6. User declines → workflow ends

### Step 4: Flutter User Joins Call

**Location**: `mobile/flutter_app/lib/screens/home_screen.dart` → `call_screen.dart`

1. API call to `POST /api/v1/calls/session/{sessionId}/token` with:
   - `role`: 'AUDIENCE'
   - Authorization header with user JWT token

**Backend Processing**:
- Validates user is participant
- Updates session status to RINGING
- Generates Agora token with AUDIENCE role
- Returns session and credential

2. Flutter navigates to `CallScreen`
3. `CallScreen` initializes Agora:
   - Requests camera/microphone permissions
   - Creates RtcEngine
   - Registers event handlers
   - Joins channel with `joinChannelWithUserAccount()`
   - Displays local video (picture-in-picture)
   - Waits for remote user

### Step 5: Admin Joins Agora Channel

**Location**: `web/admin-panel/src/components/CallOverlay.tsx`

1. `CallOverlay` component opens automatically
2. Initializes Agora Web SDK:
   - Creates Agora client
   - Sets up event handlers for remote users
   - Joins channel with token and user account
   - Creates and publishes local audio/video tracks
   - Displays local video

### Step 6: Video/Audio Streams Established

**Both Clients**:
- Admin (HOST): Publishes audio/video streams
- Flutter User (AUDIENCE): Subscribes to admin's streams
- Agora handles peer-to-peer communication
- Both users can see and hear each other

### Step 7: Call Ends

**Either User**:
- Clicks "End Call" button
- Cleanup process:
  - Stops local tracks
  - Unpublishes streams
  - Leaves Agora channel
  - Releases resources
- Returns to previous screen

## 📁 Key Files

### Backend (NestJS)

1. **Call Service** (`services/call-service/src/calls/calls.service.ts`)
   - Creates call sessions
   - Generates Agora tokens
   - Manages call lifecycle

2. **Call Gateway** (`services/call-service/src/gateway/call.gateway.ts`)
   - WebSocket server (Socket.IO)
   - Emits call invitations
   - Handles real-time events

3. **Agora Service** (`services/call-service/src/agora/agora.service.ts`)
   - Generates Agora tokens
   - Manages App ID and Certificate

### Frontend - Admin Panel (Next.js)

1. **Users Page** (`web/admin-panel/src/app/admin/users/page.tsx`)
   - Displays user list
   - Initiates calls
   - Manages call state

2. **Call Overlay** (`web/admin-panel/src/components/CallOverlay.tsx`)
   - Video call UI
   - Agora Web SDK integration
   - Handles local/remote video

3. **Call API** (`web/admin-panel/src/services/callApi.ts`)
   - API client for call service
   - Creates sessions
   - Requests tokens

### Frontend - Flutter

1. **Home Screen** (`mobile/flutter_app/lib/screens/home_screen.dart`)
   - Initializes call listener
   - Shows incoming call dialog
   - Navigates to call screen

2. **Call Screen** (`mobile/flutter_app/lib/screens/call_screen.dart`)
   - Video call UI
   - Agora Flutter SDK integration
   - Handles local/remote video

3. **Call Socket Service** (`mobile/flutter_app/lib/services/call_socket_service.dart`)
   - WebSocket client (Socket.IO)
   - Listens for call invitations
   - Streams invitations to UI

4. **Call Service** (`mobile/flutter_app/lib/services/call_service.dart`)
   - API client for call service
   - Joins calls
   - Requests tokens

## 🔧 Configuration

### Environment Variables

**Backend**:
```bash
AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_app_certificate
AGORA_TOKEN_TTL=3600
DATABASE_URL=postgresql://...
JWT_SECRET=your_jwt_secret
```

**Frontend - Admin Panel**:
```bash
CALL_SERVICE_URL=http://31.97.58.62:3010
NEXT_PUBLIC_CALL_SERVICE_URL=http://31.97.58.62:3010
```

**Frontend - Flutter**:
```dart
// In call_config.dart
static const String baseUrl = 'http://31.97.58.62:3010/api/v1';
static const String websocketUrl = 'http://31.97.58.62:3010';
```

## ✅ Implementation Checklist

### Backend
- [x] Call session creation
- [x] Agora token generation
- [x] WebSocket gateway for invitations
- [x] Channel name generation (<= 64 bytes)
- [x] User account-based tokens
- [x] Call status management
- [x] Database schema (Prisma)
- [x] Error handling and logging

### Admin Panel
- [x] Call initiation UI
- [x] Agora Web SDK integration
- [x] Video call overlay component
- [x] Local video display
- [x] Remote video display
- [x] Call controls (end call)
- [x] Error handling
- [x] Cleanup on unmount

### Flutter App
- [x] WebSocket connection
- [x] Call invitation listener
- [x] Incoming call dialog
- [x] Agora Flutter SDK integration
- [x] Video call screen
- [x] Local video display
- [x] Remote video display
- [x] Call controls (end call)
- [x] Permission handling
- [x] Error handling
- [x] Cleanup on dispose

## 🐛 Common Issues & Fixes

### Issue: Channel Name Too Long
**Fix**: Channel names are now limited to 64 bytes using shortened format

### Issue: Web Security Restriction
**Fix**: nginx with SSL configured for HTTPS (required for Agora Web SDK)

### Issue: WebSocket Connection Failed
**Fix**: Ensure Socket.IO namespace `/ws/calls` is included in URL

### Issue: Token Expired
**Fix**: Tokens are regenerated when user joins call

### Issue: Permission Denied
**Fix**: Permissions are requested before initializing Agora

## 🧪 Testing the Workflow

1. **Start Services**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Test Admin Panel**:
   - Login to admin panel
   - Navigate to Users page
   - Click "Call" button on a user
   - Verify call overlay opens
   - Verify local video displays

3. **Test Flutter App**:
   - Login to Flutter app
   - Wait for call invitation (from admin)
   - Accept call
   - Verify call screen opens
   - Verify local and remote video

4. **Test End-to-End**:
   - Admin initiates call
   - Flutter user receives invitation
   - Both users join Agora channel
   - Video/audio streams work
   - Call can be ended properly

## 📊 Flow Diagram

```
Admin Panel                    Call Service                    Flutter App
     │                              │                               │
     │ 1. POST /calls/session       │                               │
     ├─────────────────────────────>│                               │
     │                              │                               │
     │                              │ 2. Create session             │
     │                              │    Generate token (HOST)      │
     │                              │    Emit WebSocket event       │
     │                              │                               │
     │                              │ 3. WebSocket: call_invitation │
     │                              ├───────────────────────────────>│
     │                              │                               │
     │ 4. Return session + token    │                               │
     │<────────────────────────────┤                               │
     │                              │                               │
     │ 5. Join Agora channel        │                               │
     │    (with HOST token)         │                               │
     │                              │                               │
     │                              │                               │ 6. Show dialog
     │                              │                               │    User accepts
     │                              │                               │
     │                              │ 7. POST /calls/session/{id}/token
     │                              │<───────────────────────────────┤
     │                              │                               │
     │                              │ 8. Generate token (AUDIENCE)   │
     │                              │    Return credential          │
     │                              ├───────────────────────────────>│
     │                              │                               │
     │                              │                               │ 9. Join Agora channel
     │                              │                               │    (with AUDIENCE token)
     │                              │                               │
     │ 10. Video/Audio Streams      │                               │
     │     Peer-to-Peer via Agora   │                               │
     │<─────────────────────────────┼───────────────────────────────>│
     │                              │                               │
     │ 11. End Call                 │                               │ 11. End Call
     │     Cleanup & Leave          │                               │     Cleanup & Leave
```

## 🎯 Key Features Implemented

1. ✅ **Real-time Call Invitations** via WebSocket
2. ✅ **Secure Token Generation** on backend
3. ✅ **User Account-based Authentication** for Agora
4. ✅ **Channel Name Validation** (64-byte limit)
5. ✅ **Proper Resource Cleanup** on call end
6. ✅ **Error Handling** throughout workflow
7. ✅ **Permission Management** (camera/microphone)
8. ✅ **Call Status Tracking** in database
9. ✅ **Cross-platform Support** (Web + Mobile)
10. ✅ **HTTPS Support** for web (via nginx)

## 📝 Notes

- All Agora tokens are generated server-side (never exposed to clients)
- Channel names are automatically validated and shortened if needed
- WebSocket connections are authenticated with JWT tokens
- Call sessions are stored in PostgreSQL database
- Both HOST and AUDIENCE roles can publish/subscribe streams
- Proper cleanup ensures no memory leaks or resource issues

