'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  Monitor,
  Settings,
  Users,
  Maximize2,
  Minimize2,
  Clock,
  X
} from 'lucide-react';
import { CallCredential } from '@/services/callApi';
import { getAppointmentWebSocketService } from '@/services/appointmentWebSocket';
import AgoraRTC, { IAgoraRTCClient, ILocalVideoTrack, ILocalAudioTrack, IRemoteVideoTrack, IRemoteAudioTrack, UID } from 'agora-rtc-sdk-ng';

type ViewMode = 'grid' | 'speaker';

interface CallPageContentProps {
  appointmentId: string;
  credential: CallCredential;
}

interface RemoteUser {
  uid: UID;
  hasVideo: boolean;
  hasAudio: boolean;
  videoTrack?: IRemoteVideoTrack;
  audioTrack?: IRemoteAudioTrack;
}

export default function CallPageContent({ appointmentId, credential }: CallPageContentProps) {
  const router = useRouter();

  // Agora RTC SDK state
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
  
  // UI state
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [micMuted, setMicMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('speaker');
  const [showSettings, setShowSettings] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const localVideoRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoRefs = useRef<Map<UID, HTMLDivElement>>(new Map());
  const callStartTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const agoraClientRef = useRef<IAgoraRTCClient | null>(null);
  const hasJoinedRef = useRef<boolean>(false);
  const isJoiningRef = useRef<boolean>(false);

  // Set up WebSocket listener for call.accepted
  useEffect(() => {
    const wsService = getAppointmentWebSocketService();
    const handleCallAccepted = async (event: any) => {
      console.log('📞 [CALL] Patient accepted call event received:', event);
      
      const eventAppointmentId = event?.appointmentId || event?.data?.appointmentId;
      
      if (eventAppointmentId === appointmentId) {
        if (agoraClientRef.current && !hasJoinedRef.current && !isJoiningRef.current) {
          console.log('📞 [CALL] Patient accepted, joining Agora channel...');
          isJoiningRef.current = true;
          
          try {
            const agoraClient = agoraClientRef.current;
            
            // Parse UID (can be number or string)
            const uid = credential.uid ? (typeof credential.uid === 'string' ? parseInt(credential.uid) || 0 : credential.uid) : 0;
            
            // Join channel
            await agoraClient.join(
              credential.appId,
              credential.channelName,
              credential.token,
              uid || null
            );
            
            console.log('✅ [AGORA] Joined channel after patient accepted');
            hasJoinedRef.current = true;
            
            // Create and publish local tracks
            try {
              const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
              setLocalAudioTrack(audioTrack);
              setLocalVideoTrack(videoTrack);
              
              await agoraClient.publish([audioTrack, videoTrack]);
              
              // Play local video
              if (localVideoRef.current) {
                videoTrack.play(localVideoRef.current);
                setVideoOff(false);
              }
              
              // Play local audio
              audioTrack.play();
              setMicMuted(false);
              
              console.log('✅ [AGORA] Local tracks published and playing');
            } catch (trackError) {
              console.error('❌ [AGORA] Error creating/publishing tracks:', trackError);
            }
            
            // Emit call.started event
            try {
              wsService.send('call.started', {
                appointmentId: appointmentId,
                channelName: credential.channelName,
                hostId: credential.uid?.toString() || '0',
              });
              console.log('📞 [CALL] Emitted call.started event');
            } catch (wsError) {
              console.warn('⚠️ [CALL] Failed to emit call.started event:', wsError);
            }
          } catch (joinError) {
            console.error('❌ [AGORA] Join error after call accepted:', joinError);
            setError('Failed to join call channel. Please try again.');
            setLoading(false);
          } finally {
            isJoiningRef.current = false;
          }
        } else if (hasJoinedRef.current) {
          console.log('✅ [CALL] Already joined, just updating UI state');
        }
        
        setConnectionState('Connected');
        setLoading(false);
        console.log('✅ [CALL] Updated connection state to Connected');
      } else {
        console.log('⚠️ [CALL] Event appointmentId mismatch:', eventAppointmentId, 'vs', appointmentId);
      }
    };
    
    console.log('📞 [CALL] Registering call.accepted handler for appointment:', appointmentId);
    wsService.on('call.accepted', handleCallAccepted);
    
    return () => {
      console.log('📞 [CALL] Unregistering call.accepted handler');
      wsService.off('call.accepted', handleCallAccepted);
    };
  }, [appointmentId, credential]);

  // Initialize call
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        
        // Check secure context (Agora works with HTTP too)
        // Force HTTP for development - HTTPS disabled
        const isSecureContext = window.isSecureContext || 
          location.hostname === 'localhost' || 
          location.hostname === '127.0.0.1';

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('getUserMedia is not supported');
        }

        // Create Agora RTC client
        console.log('📞 [AGORA] Creating Agora RTC client...');
        const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        agoraClientRef.current = agoraClient;
        setClient(agoraClient);

        // Set up event handlers
        agoraClient.on('user-published', async (user, mediaType) => {
          console.log('👤 [AGORA] User published:', user.uid, mediaType);
          
          await agoraClient.subscribe(user, mediaType);
          
          if (mediaType === 'video') {
            const remoteUser: RemoteUser = {
              uid: user.uid,
              hasVideo: true,
              hasAudio: user.hasAudio,
              videoTrack: user.videoTrack || undefined,
              audioTrack: user.audioTrack || undefined,
            };
            
            setRemoteUsers((prev) => {
              const exists = prev.some(u => u.uid === user.uid);
              if (exists) {
                return prev.map(u => u.uid === user.uid ? remoteUser : u);
              }
              return [...prev, remoteUser];
            });
            
            // Play remote video
            if (user.videoTrack) {
              const videoElement = remoteVideoRefs.current.get(user.uid);
              if (videoElement) {
                user.videoTrack.play(videoElement);
              } else {
                // Wait for element to be ready
                setTimeout(() => {
                  const retryElement = remoteVideoRefs.current.get(user.uid);
                  if (retryElement) {
                    user.videoTrack?.play(retryElement);
                  }
                }, 500);
              }
            }
          }
          
          if (mediaType === 'audio') {
            user.audioTrack?.play();
            
            setRemoteUsers((prev) => {
              const exists = prev.some(u => u.uid === user.uid);
              if (exists) {
                return prev.map(u => 
                  u.uid === user.uid 
                    ? { ...u, hasAudio: true, audioTrack: user.audioTrack || undefined }
                    : u
                );
              }
              return [...prev, {
                uid: user.uid,
                hasVideo: user.hasVideo,
                hasAudio: true,
                audioTrack: user.audioTrack || undefined,
              }];
            });
          }
        });

        agoraClient.on('user-unpublished', (user, mediaType) => {
          console.log('👤 [AGORA] User unpublished:', user.uid, mediaType);
          
          if (mediaType === 'video') {
            user.videoTrack?.stop();
            setRemoteUsers((prev) => 
              prev.map(u => u.uid === user.uid ? { ...u, hasVideo: false } : u)
            );
          }
          
          if (mediaType === 'audio') {
            user.audioTrack?.stop();
            setRemoteUsers((prev) => 
              prev.map(u => u.uid === user.uid ? { ...u, hasAudio: false } : u)
            );
          }
        });

        agoraClient.on('user-left', (user) => {
          console.log('👤 [AGORA] User left:', user.uid);
          user.videoTrack?.stop();
          user.audioTrack?.stop();
          setRemoteUsers((prev) => prev.filter(u => u.uid !== user.uid));
        });

        agoraClient.on('connection-state-change', (curState, revState) => {
          console.log('🔌 [AGORA] Connection state change:', curState, revState);
          setConnectionState(curState);
          
          if (curState === 'CONNECTED') {
            setLoading(false);
            hasJoinedRef.current = true;
          } else if (curState === 'DISCONNECTED' || curState === 'FAILED') {
            if (hasJoinedRef.current) {
              setError('Connection lost. Please try again.');
            }
          }
        });

        // Join immediately with HOST credentials (admin/doctor can join first)
        // Patient will join when they accept the call
        console.log('📞 [AGORA] Joining channel immediately as HOST...');
        setConnectionState('Connecting');
        
        try {
          const agoraClient = agoraClientRef.current;
          const uid = credential.uid ? (typeof credential.uid === 'string' ? parseInt(credential.uid) || 0 : credential.uid) : 0;
          
          await agoraClient.join(
            credential.appId,
            credential.channelName,
            credential.token,
            uid || null
          );
          
          console.log('✅ [AGORA] Joined channel as HOST');
          hasJoinedRef.current = true;
          
          // Create and publish local tracks immediately
          const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
          setLocalAudioTrack(audioTrack);
          setLocalVideoTrack(videoTrack);
          
          await agoraClient.publish([audioTrack, videoTrack]);
          
          // Play local video
          if (localVideoRef.current) {
            videoTrack.play(localVideoRef.current);
            setVideoOff(false);
          }
          
          // Play local audio
          audioTrack.play();
          setMicMuted(false);
          
          console.log('✅ [AGORA] Local tracks published and playing');
          setConnectionState('Connected');
          setLoading(false);
        } catch (joinError) {
          console.error('❌ [AGORA] Failed to join channel:', joinError);
          setError('Failed to join call channel. Please try again.');
          setLoading(false);
          setConnectionState('Failed');
        }

        // Start call timer
        callStartTimeRef.current = Date.now();
        durationIntervalRef.current = setInterval(() => {
          setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
        }, 1000);

        console.log('⏳ [CALL] Waiting for patient to accept call...');
      } catch (e) {
        console.error('❌ [AGORA] Failed to initialize call:', e);
        const errorMessage = e instanceof Error 
          ? e.message 
          : typeof e === 'object' && e !== null
          ? JSON.stringify(e, Object.getOwnPropertyNames(e))
          : String(e) || 'Failed to start call';
        setError(errorMessage);
        setLoading(false);
      }
    };

    init();

    return () => {
      cleanup();
      const wsService = getAppointmentWebSocketService();
      wsService.off('call.accepted');
    };
  }, [appointmentId, credential]);

  // Effect to play remote videos when elements are ready
  useEffect(() => {
    remoteUsers.forEach((user) => {
      if (user.videoTrack && user.hasVideo) {
        const videoElement = remoteVideoRefs.current.get(user.uid);
        if (videoElement) {
          user.videoTrack.play(videoElement);
        }
      }
    });
  }, [remoteUsers]);

  const cleanup = async () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

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
      
      // Leave channel
      if (agoraClientRef.current) {
        await agoraClientRef.current.leave();
      }
      
      // Reset refs
      hasJoinedRef.current = false;
      isJoiningRef.current = false;
      agoraClientRef.current = null;
      setLocalVideoTrack(null);
      setLocalAudioTrack(null);
      setRemoteUsers([]);
    } catch (error) {
      console.error('❌ [AGORA] Error cleaning up:', error);
    }
  };

  const handleEndCall = async () => {
    await cleanup();
    router.push('/admin/appointments');
  };

  const toggleMute = async () => {
    if (!localAudioTrack) return;
    
    try {
      if (micMuted) {
        await localAudioTrack.setEnabled(true);
        setMicMuted(false);
      } else {
        await localAudioTrack.setEnabled(false);
        setMicMuted(true);
      }
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const toggleVideo = async () => {
    if (!localVideoTrack || !localVideoRef.current) return;
    
    try {
      if (videoOff) {
        await localVideoTrack.setEnabled(true);
        localVideoTrack.play(localVideoRef.current);
        setVideoOff(false);
      } else {
        await localVideoTrack.setEnabled(false);
        setVideoOff(true);
      }
    } catch (error) {
      console.error('Error toggling video:', error);
    }
  };

  const toggleScreenShare = async () => {
    // Screen sharing implementation with Agora
    try {
      if (!screenSharing) {
        const screenTrack = await AgoraRTC.createScreenVideoTrack({}, 'video');
        if (client && localVideoTrack) {
          await client.unpublish([localVideoTrack]);
          await client.publish([screenTrack]);
          if (localVideoRef.current) {
            screenTrack.play(localVideoRef.current);
          }
          setScreenSharing(true);
        }
      } else {
        // Stop screen share and resume camera
        if (client && localVideoTrack) {
          await client.unpublish();
          await client.publish([localVideoTrack, localAudioTrack!]);
          if (localVideoRef.current) {
            localVideoTrack.play(localVideoRef.current);
          }
          setScreenSharing(false);
        }
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Connecting to call...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center bg-gray-900 p-8 rounded-lg max-w-md">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button
            onClick={() => router.push('/admin/appointments')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black text-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionState === 'CONNECTED' ? 'bg-green-500' : 
              connectionState === 'CONNECTING' ? 'bg-yellow-500' : 
              'bg-red-500'
            }`}></div>
            <span className="text-sm text-gray-400 capitalize">{connectionState.toLowerCase()}</span>
          </div>
          <div className="h-6 w-px bg-gray-700"></div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-mono">{formatDuration(callDuration)}</span>
          </div>
          {credential && (
            <>
              <div className="h-6 w-px bg-gray-700"></div>
              <span className="text-sm text-gray-400">Channel: {credential.channelName}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className={`p-2 rounded-lg transition-colors ${showParticipants ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
            title="Participants"
          >
            <Users className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 relative">
          {viewMode === 'speaker' && remoteUsers.length > 0 ? (
            <div className="absolute inset-0">
              {/* Main remote video */}
              {remoteUsers.map((user, index) => {
                return index === 0 && (
                  <div
                    key={String(user.uid)}
                    ref={(el) => {
                      if (el) {
                        remoteVideoRefs.current.set(user.uid, el);
                        if (user.videoTrack && user.hasVideo) {
                          user.videoTrack.play(el);
                        }
                      } else {
                        remoteVideoRefs.current.delete(user.uid);
                      }
                    }}
                    className="w-full h-full bg-gray-950"
                  >
                    {!user.hasVideo && (
                      <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl text-gray-400">
                              {String(user.uid).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <p className="text-gray-400">Video Off</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Local video thumbnail */}
              <div className="absolute bottom-4 right-4 w-64 h-48 bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-700 shadow-2xl">
                <div ref={localVideoRef} className="w-full h-full"></div>
                {videoOff && (
                  <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                    <X className="w-12 h-12 text-gray-600" />
                  </div>
                )}
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-2 p-2 h-full">
              {/* Local video */}
              <div className="relative bg-gray-950 rounded-lg overflow-hidden">
                <div ref={localVideoRef} className="w-full h-full"></div>
                {videoOff && (
                  <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                    <X className="w-16 h-16 text-gray-600" />
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-xs">
                  You {micMuted && '🔇'}
                </div>
              </div>
              {/* Remote videos */}
              {remoteUsers.map((user) => (
                <div
                  key={String(user.uid)}
                  ref={(el) => {
                    if (el) {
                      remoteVideoRefs.current.set(user.uid, el);
                      if (user.videoTrack && user.hasVideo) {
                        user.videoTrack.play(el);
                      }
                    } else {
                      remoteVideoRefs.current.delete(user.uid);
                    }
                  }}
                  className="relative bg-gray-950 rounded-lg overflow-hidden"
                >
                  {!user.hasVideo && (
                    <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                      <X className="w-16 h-16 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full max-w-4xl">
                <div ref={localVideoRef} className="w-full h-full bg-gray-950"></div>
                {videoOff && (
                  <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                    <X className="w-32 h-32 text-gray-600" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Side Panels */}
        {showParticipants && (
          <div className="w-80 bg-gray-900 border-l border-gray-800 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Participants ({remoteUsers.length + 1})</h3>
              <button onClick={() => setShowParticipants(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <X className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">You</p>
                  <p className="text-xs text-gray-400">Host</p>
                </div>
                <div className="flex gap-1">
                  {micMuted ? <MicOff className="w-4 h-4 text-red-500" /> : <Mic className="w-4 h-4 text-green-500" />}
                  {videoOff ? <VideoOff className="w-4 h-4 text-red-500" /> : <Video className="w-4 h-4 text-green-500" />}
                </div>
              </div>
              {remoteUsers.map((user) => (
                <div key={String(user.uid)} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                    <X className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">User {String(user.uid)}</p>
                    <p className="text-xs text-gray-400">Participant</p>
                  </div>
                  <div className="flex gap-1">
                    {user.hasAudio ? <Mic className="w-4 h-4 text-green-500" /> : <MicOff className="w-4 h-4 text-gray-500" />}
                    {user.hasVideo ? <Video className="w-4 h-4 text-green-500" /> : <VideoOff className="w-4 h-4 text-gray-500" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showSettings && (
          <div className="w-80 bg-gray-900 border-l border-gray-800 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Settings</h3>
              <button onClick={() => setShowSettings(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">View Mode</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('speaker')}
                    className={`flex-1 px-4 py-2 rounded-lg ${viewMode === 'speaker' ? 'bg-blue-600' : 'bg-gray-800'}`}
                  >
                    Speaker
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex-1 px-4 py-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-600' : 'bg-gray-800'}`}
                  >
                    Grid
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Call Info</label>
                <div className="bg-gray-800 p-3 rounded-lg space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Channel:</span>
                    <span>{credential?.channelName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="capitalize">{connectionState.toLowerCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Role:</span>
                    <span className="capitalize">{credential?.role.toLowerCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 border-t border-gray-800 px-6 py-4">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-all ${
              micMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-800 hover:bg-gray-700'
            }`}
            title={micMuted ? 'Unmute' : 'Mute'}
          >
            {micMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-all ${
              videoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-800 hover:bg-gray-700'
            }`}
            title={videoOff ? 'Turn on video' : 'Turn off video'}
          >
            {videoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-4 rounded-full transition-all ${
              screenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-800 hover:bg-gray-700'
            }`}
            title={screenSharing ? 'Stop sharing' : 'Share screen'}
          >
            <Monitor className="w-6 h-6" />
          </button>

          <button
            onClick={handleEndCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all"
            title="End call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
