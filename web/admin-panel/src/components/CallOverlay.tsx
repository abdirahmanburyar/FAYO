'use client';

import { useEffect, useRef, useState } from 'react';
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import type { CallSession, CallCredential } from '@/services/callApi';

interface CallOverlayProps {
  open: boolean;
  onClose: () => void;
  session: CallSession | null;
  credential: CallCredential | null;
}

const CallOverlay: React.FC<CallOverlayProps> = ({ open, onClose, session, credential }) => {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [micMuted, setMicMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  const localVideoRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || !credential || !session) return;

    let mounted = true;

    const init = async () => {
      try {
        console.log('🎥 [CALL] Initializing Agora client...', {
          appId: credential.appId,
          channelName: credential.channelName,
          hasToken: !!credential.token,
          rtcUserId: credential.rtcUserId,
        });

        const c = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        setClient(c);

        // Enable Agora debug logging
        AgoraRTC.setLogLevel(4); // 0-4, 4 = all logs

        c.on('user-published', async (user, mediaType) => {
          console.log('👤 [CALL] User published:', { uid: user.uid, mediaType });
          try {
            await c.subscribe(user, mediaType);
            if (mediaType === 'video' && remoteVideoRef.current) {
              console.log('📹 [CALL] Playing remote video for user:', user.uid);
              user.videoTrack?.play(remoteVideoRef.current);
            }
            if (mediaType === 'audio') {
              console.log('🔊 [CALL] Playing remote audio for user:', user.uid);
              user.audioTrack?.play();
            }
            setRemoteUsers((prev) => [...prev.filter((u) => u.uid !== user.uid), user]);
          } catch (error) {
            console.error('❌ [CALL] Error subscribing to user:', error);
          }
        });

        c.on('user-unpublished', (user) => {
          console.log('👤 [CALL] User unpublished:', user.uid);
          if (user.videoTrack) {
            user.videoTrack.stop();
          }
          if (user.audioTrack) {
            user.audioTrack.stop();
          }
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        });

        c.on('user-left', (user) => {
          console.log('👤 [CALL] User left:', user.uid);
          if (user.videoTrack) {
            user.videoTrack.stop();
          }
          if (user.audioTrack) {
            user.audioTrack.stop();
          }
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        });

        c.on('connection-state-change', (curState, revState) => {
          console.log('🔌 [CALL] Connection state changed:', { curState, revState });
          if (mounted) {
            setConnectionState(curState);
          }
        });

        c.on('exception', (evt) => {
          console.error('❌ [CALL] Agora exception:', evt);
        });

        // Join channel with token
        // Note: Web SDK join() accepts: appId, channel, token, uid (number or string userAccount)
        console.log('🚪 [CALL] Joining channel...', {
          appId: credential.appId,
          channel: credential.channelName,
          uid: credential.rtcUserId,
        });

        const uid = await c.join(
          credential.appId,
          credential.channelName,
          credential.token || null,
          credential.rtcUserId || null,
        );

        console.log('✅ [CALL] Joined channel successfully, UID:', uid);

        // Create and publish local tracks
        console.log('🎤 [CALL] Creating local audio/video tracks...');
        const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        
        if (!mounted) {
          console.log('⚠️ [CALL] Component unmounted, cleaning up tracks');
          micTrack.close();
          camTrack.close();
          return;
        }

        setLocalAudioTrack(micTrack);
        setLocalVideoTrack(camTrack);

        console.log('📤 [CALL] Publishing local tracks...');
        await c.publish([micTrack, camTrack]);
        console.log('✅ [CALL] Local tracks published successfully');

        if (localVideoRef.current) {
          console.log('📹 [CALL] Playing local video');
          camTrack.play(localVideoRef.current);
        } else {
          console.warn('⚠️ [CALL] Local video ref not available');
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to init Agora in admin panel:', e);
        if (mounted) {
          alert(`Failed to start video call: ${e instanceof Error ? e.message : 'Unknown error'}`);
          onClose();
        }
      }
    };

    init();

    return () => {
      mounted = false;
      const cleanup = async () => {
        try {
          // Stop and close local tracks
          if (localVideoTrack) {
            localVideoTrack.stop();
            localVideoTrack.close();
          }
          if (localAudioTrack) {
            localAudioTrack.stop();
            localAudioTrack.close();
          }
          
          // Unpublish and leave channel
          if (client) {
            await client.unpublish();
            await client.leave();
          }
          
          // Clear remote users
          setRemoteUsers([]);
        } catch (error) {
          console.error('Error cleaning up Agora:', error);
        }
      };
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, credential?.token, session?.id]);

  if (!open || !credential || !session) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
      <div className="w-full max-w-4xl h-[70vh] bg-gray-900 rounded-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <div>
            <p className="text-sm text-gray-300">Video call with</p>
            <p className="text-lg font-semibold text-white truncate">
              Session: {session.id}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${
                connectionState === 'CONNECTED' ? 'bg-green-500' :
                connectionState === 'CONNECTING' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}></span>
              <span className="text-xs text-gray-400">{connectionState}</span>
            </div>
          </div>
          <button
            onClick={async () => {
              // Cleanup before closing
              if (localVideoTrack) {
                localVideoTrack.stop();
                localVideoTrack.close();
              }
              if (localAudioTrack) {
                localAudioTrack.stop();
                localAudioTrack.close();
              }
              if (client) {
                await client.unpublish();
                await client.leave();
              }
              onClose();
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-red-700"
          >
            End Call
          </button>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-2 p-2">
          <div
            ref={remoteVideoRef}
            className="bg-black rounded-lg flex items-center justify-center text-gray-400 text-sm"
          >
            {remoteUsers.length === 0 && <span>Waiting for user to join...</span>}
          </div>
          <div className="flex flex-col gap-2">
            <div
              ref={localVideoRef}
              className="bg-black rounded-lg h-48 flex items-center justify-center text-gray-400 text-xs"
            >
              {!localVideoTrack && <span>Initializing camera...</span>}
            </div>
            <div className="flex-1 bg-gray-800 rounded-lg p-3 text-xs text-gray-300">
              <p className="font-semibold mb-1">Session details</p>
              <p>Channel: {session.channelName}</p>
              <p>Status: {session.status}</p>
              <p>Role: {credential.role}</p>
              <p>Connection: <span className={connectionState === 'CONNECTED' ? 'text-green-400' : 'text-yellow-400'}>{connectionState}</span></p>
              <p>Remote participants: {remoteUsers.length}</p>
            </div>
          </div>
        </div>

        {/* Call Controls */}
        <div className="flex justify-center items-center gap-4 p-4 bg-gray-800 border-t border-gray-700">
          <button
            onClick={() => {
              if (localAudioTrack) {
                localAudioTrack.setEnabled(micMuted);
                setMicMuted(!micMuted);
              }
            }}
            className={`p-3 rounded-full ${micMuted ? 'bg-red-600' : 'bg-gray-700'} text-white hover:opacity-80 transition-opacity`}
            title={micMuted ? 'Unmute' : 'Mute'}
          >
            {micMuted ? '🔇' : '🎤'}
          </button>
          <button
            onClick={() => {
              if (localVideoTrack) {
                localVideoTrack.setEnabled(videoOff);
                setVideoOff(!videoOff);
              }
            }}
            className={`p-3 rounded-full ${videoOff ? 'bg-red-600' : 'bg-gray-700'} text-white hover:opacity-80 transition-opacity`}
            title={videoOff ? 'Turn on video' : 'Turn off video'}
          >
            {videoOff ? '📹❌' : '📹'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallOverlay;


