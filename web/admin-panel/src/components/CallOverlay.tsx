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

  const localVideoRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || !credential || !session) return;

    let mounted = true;

    const init = async () => {
      try {
        const c = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        setClient(c);

        c.on('user-published', async (user, mediaType) => {
          await c.subscribe(user, mediaType);
          if (mediaType === 'video' && remoteVideoRef.current) {
            user.videoTrack?.play(remoteVideoRef.current);
          }
          if (mediaType === 'audio') {
            user.audioTrack?.play();
          }
          setRemoteUsers((prev) => [...prev.filter((u) => u.uid !== user.uid), user]);
        });

        c.on('user-unpublished', (user) => {
          if (user.videoTrack) {
            user.videoTrack.stop();
          }
          if (user.audioTrack) {
            user.audioTrack.stop();
          }
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        });

        c.on('user-left', (user) => {
          if (user.videoTrack) {
            user.videoTrack.stop();
          }
          if (user.audioTrack) {
            user.audioTrack.stop();
          }
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        });

        // Join channel with token
        // Note: Web SDK uses UID (number) or userAccount (string)
        // Since backend generates token with user account, we can use either
        await c.join(credential.appId, credential.channelName, credential.token || null, credential.rtcUserId || null);

        // Create and publish local tracks
        const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        if (!mounted) {
          micTrack.close();
          camTrack.close();
          return;
        }

        setLocalAudioTrack(micTrack);
        setLocalVideoTrack(camTrack);

        await c.publish([micTrack, camTrack]);

        if (localVideoRef.current) {
          camTrack.play(localVideoRef.current);
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
              <p>Remote participants: {remoteUsers.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallOverlay;


