# Call Acceptance Flow in Patient Mobile App

## Overview
This document explains how video call invitations are received and accepted in the patient mobile app.

## Flow Diagram

```
Admin Panel → Backend → WebSocket → Mobile App → Dialog → Call Screen
```

## Step-by-Step Process

### 1. **Admin Initiates Call**
- Admin clicks "Start Video Call" button in appointments page
- Backend creates a Zoom session and generates credentials
- Backend broadcasts `call.invitation` event via WebSocket

### 2. **WebSocket Connection (Already Set Up)**
- Mobile app connects to: `ws://{server}:3005/api/v1/ws/appointments`
- On app start, `HomeViewModel` automatically starts observing call invitations
- App joins patient-specific room: `patient_{patientId}`

**Location**: `mobile/kmp/shared/src/commonMain/kotlin/com/fayo/healthcare/data/api/ApiClient.kt`
- Function: `observeCallInvitations(patientId: String)`
- Listens for: `call.invitation` events
- Extracts: Credentials, session name, appointment ID

### 3. **HomeViewModel Receives Invitation**
**Location**: `mobile/kmp/androidApp/src/main/java/com/fayo/healthcare/ui/screens/home/HomeViewModel.kt`

```kotlin
// Automatically starts when HomeViewModel is created
private fun startObservingCallInvitations() {
    val patientId = tokenStorage.getUserId()
    apiClient.observeCallInvitations(patientId)
        .collect { event ->
            when (event) {
                is CallInvitationEvent.InvitationReceived -> {
                    // Updates UI state with invitation
                    _uiState.value = HomeUiState(callInvitation = event)
                }
            }
        }
}
```

### 4. **HomeScreen Shows Dialog**
**Location**: `mobile/kmp/androidApp/src/main/java/com/fayo/healthcare/ui/screens/home/HomeScreen.kt`

```kotlin
// Observes UI state for call invitations
val uiState by viewModel.uiState.collectAsState()
val callInvitation = uiState.callInvitation

// Shows dialog when invitation is received
callInvitation?.let { invitation ->
    if (invitation.invitation.credentials != null) {
        CallInvitationDialog(
            invitation = invitation.invitation,
            onAccept = {
                viewModel.clearCallInvitation()
                onNavigateToCall(invitation.invitation.credentials!!)
            },
            onDecline = {
                viewModel.clearCallInvitation()
            }
        )
    }
}
```

**Dialog Features**:
- Shows "Incoming Video Call" title
- Displays session information
- "Accept" button (green) - navigates to call screen
- "Decline" button (red) - dismisses dialog

### 5. **Navigation to Call Screen**
**Location**: `mobile/kmp/androidApp/src/main/java/com/fayo/healthcare/ui/navigation/NavGraph.kt`

When patient clicks "Accept":
```kotlin
onNavigateToCall = { credentials ->
    // Pass credentials via savedStateHandle
    navController.currentBackStackEntry?.savedStateHandle?.set("credentials", credentials)
    navController.navigate("call/${credentials.sessionName}/${credentials.userIdentity}/${credentials.role}")
}
```

### 6. **CallScreen Initializes Zoom SDK**
**Location**: `mobile/kmp/androidApp/src/main/java/com/fayo/healthcare/ui/screens/call/CallScreen.kt`

```kotlin
LaunchedEffect(credentials) {
    // 1. Initialize Zoom SDK
    zoomVideoService.initialize()
    
    // 2. Join session with credentials
    zoomVideoService.joinSession(credentials)
    
    // 3. Update UI state
    isJoined = true
}
```

**Credentials Used**:
- `sessionName`: Zoom session name
- `token`: JWT token for authentication
- `userIdentity`: Patient user ID
- `sdkKey`: Zoom SDK key (for initialization)
- `role`: "PARTICIPANT"

### 7. **Call Controls**
Once joined, patient can:
- Toggle video on/off
- Toggle audio on/off
- End call (leaves session and navigates back)

## Key Components

### WebSocket Message Format
```json
{
  "type": "call.invitation",
  "appointmentId": "appointment-id",
  "patientId": "patient-id",
  "sessionName": "appointment-xxx-1234567890",
  "callSession": {
    "id": "call-session-id",
    "sessionName": "appointment-xxx-1234567890",
    "status": "ACTIVE"
  },
  "credentials": {
    "participant": {
      "token": "jwt-token",
      "sessionName": "appointment-xxx-1234567890",
      "userIdentity": "patient-id",
      "role": "PARTICIPANT",
      "sdkKey": "zoom-sdk-key"
    }
  }
}
```

### State Management
- **HomeViewModel**: Manages call invitation state
- **HomeScreen**: Observes state and shows dialog
- **CallScreen**: Manages Zoom session state

## Testing the Flow

1. **Start Mobile App**
   - App automatically connects to WebSocket
   - `HomeViewModel` starts observing invitations

2. **Admin Creates Call**
   - In admin panel, click "Start Video Call" on an appointment
   - Backend sends `call.invitation` to patient room

3. **Patient Receives Invitation**
   - Dialog appears on HomeScreen
   - Shows "Incoming Video Call" with session info

4. **Patient Accepts**
   - Clicks "Accept" button
   - Navigates to CallScreen
   - Zoom SDK initializes and joins session

5. **Call Active**
   - Video/audio controls available
   - Patient can toggle video/audio
   - Patient can end call

## Important Notes

- **WebSocket Connection**: Automatically reconnects if disconnected
- **Patient ID**: Must be stored in `AndroidTokenStorage` for WebSocket to work
- **Credentials**: Automatically extracted from WebSocket message
- **Zoom SDK**: Currently has placeholder implementation - add actual SDK dependency to complete

## Troubleshooting

### Dialog Not Showing
- Check WebSocket connection logs: `📞 [CallWebSocket]`
- Verify patient ID matches the invitation
- Check `HomeViewModel` is observing invitations

### Call Not Joining
- Verify credentials are present in invitation
- Check Zoom SDK initialization logs
- Ensure Zoom SDK dependency is added (currently placeholder)

### WebSocket Not Connecting
- Check server URL in `ApiClient`
- Verify patient is logged in (patient ID available)
- Check network connectivity

