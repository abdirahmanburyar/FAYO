# Agora Web Implementation Guide

## Key Changes from Zoom to Agora

### 1. Package Import
```typescript
// Old (Zoom)
import ZoomVideo from '@zoom/videosdk';

// New (Agora)
import AgoraRTC from 'agora-rtc-sdk-ng';
```

### 2. Client Creation
```typescript
// Old (Zoom)
const client = ZoomVideo.createClient();

// New (Agora)
const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
```

### 3. Join Session/Channel
```typescript
// Old (Zoom)
await client.join(sessionName, token, userIdentity, password);

// New (Agora)
await client.join(appId, channelName, token, uid);
```

### 4. Get Local Tracks
```typescript
// Old (Zoom)
const stream = client.getMediaStream();
await stream.startVideo({ videoElement });
await stream.startAudio();

// New (Agora)
const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
await client.publish([audioTrack, videoTrack]);
videoTrack.play(localVideoElement);
```

### 5. Handle Remote Users
```typescript
// Old (Zoom)
client.on('user-added', (payload) => {
  const stream = payload.stream;
  stream.play(remoteVideoElement);
});

// New (Agora)
client.on('user-published', async (user, mediaType) => {
  await client.subscribe(user, mediaType);
  if (mediaType === 'video') {
    user.videoTrack?.play(remoteVideoElement);
  }
  if (mediaType === 'audio') {
    user.audioTrack?.play();
  }
});
```

### 6. Toggle Video/Audio
```typescript
// Old (Zoom)
stream.muteVideo();
stream.unmuteVideo();
stream.muteAudio();
stream.unmuteAudio();

// New (Agora)
videoTrack.setEnabled(false);
videoTrack.setEnabled(true);
audioTrack.setEnabled(false);
audioTrack.setEnabled(true);
```

### 7. Leave Session
```typescript
// Old (Zoom)
await client.leave();

// New (Agora)
await client.leave();
videoTrack?.close();
audioTrack?.close();
```

## Complete Implementation Pattern

```typescript
import AgoraRTC, { IAgoraRTCClient, ILocalVideoTrack, ILocalAudioTrack } from 'agora-rtc-sdk-ng';

// State
const [client, setClient] = useState<IAgoraRTCClient | null>(null);
const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack | null>(null);
const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | null>(null);
const [remoteUsers, setRemoteUsers] = useState<any[]>([]);

// Initialize
const init = async () => {
  const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
  setClient(agoraClient);

  // Join channel
  await agoraClient.join(
    credential.appId,
    credential.channelName,
    credential.token,
    credential.uid || null
  );

  // Create and publish local tracks
  const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
  setLocalVideoTrack(videoTrack);
  setLocalAudioTrack(audioTrack);
  
  await agoraClient.publish([audioTrack, videoTrack]);
  videoTrack.play(localVideoElement);

  // Handle remote users
  agoraClient.on('user-published', async (user, mediaType) => {
    await agoraClient.subscribe(user, mediaType);
    
    if (mediaType === 'video') {
      setRemoteUsers(prev => [...prev, user]);
      user.videoTrack?.play(remoteVideoElement);
    }
    if (mediaType === 'audio') {
      user.audioTrack?.play();
    }
  });

  agoraClient.on('user-unpublished', (user, mediaType) => {
    if (mediaType === 'video') {
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    }
  });
};

// Cleanup
const cleanup = async () => {
  if (localVideoTrack) {
    localVideoTrack.stop();
    localVideoTrack.close();
  }
  if (localAudioTrack) {
    localAudioTrack.stop();
    localAudioTrack.close();
  }
  if (client) {
    await client.leave();
  }
};
```

## Next Steps

1. Replace entire `CallPageContent.tsx` with Agora implementation
2. Update all credential references (sessionName → channelName, etc.)
3. Test video/audio functionality
4. Test remote user handling

