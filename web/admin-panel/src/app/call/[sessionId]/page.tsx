'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AgoraRTC, { 
  IAgoraRTCClient, 
  ICameraVideoTrack, 
  IMicrophoneAudioTrack,
  NetworkQuality,
  UID 
} from 'agora-rtc-sdk-ng';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  Monitor,
  Settings,
  Users,
  MessageSquare,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  User,
  Signal,
  Clock,
  X
} from 'lucide-react';
import { requestCallToken, CallSession, CallCredential } from '@/services/callApi';

type ViewMode = 'grid' | 'speaker' | 'focus';

export default function CallPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string;

  // Agora state
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  
  // UI state
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [micMuted, setMicMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('speaker');
  const [showSettings, setShowSettings] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Session data
  const [session, setSession] = useState<CallSession | null>(null);
  const [credential, setCredential] = useState<CallCredential | null>(null);

  // Refs
  const localVideoRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoRefs = useRef<Map<UID, HTMLDivElement>>(new Map());
  const callStartTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize call
  useEffect(() => {
    if (!sessionId) {
      setError('Session ID is required');
      setLoading(false);
      return;
    }

    const init = async () => {
      try {
        setLoading(true);
        
        // Get access token from localStorage
        const accessToken = localStorage.getItem('adminToken');
        if (!accessToken) {
          throw new Error('Not authenticated');
        }

        // Request call token
        const response = await requestCallToken(accessToken, sessionId, 'HOST');
        setSession(response.session);
        setCredential(response.credential);

        // Check secure context
        const isSecureContext = window.isSecureContext || 
          location.protocol === 'https:' || 
          location.hostname === 'localhost' || 
          location.hostname === '127.0.0.1';
        
        if (!isSecureContext) {
          throw new Error('Video calling requires HTTPS');
        }

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('getUserMedia is not supported');
        }

        // Create Agora client
        const c = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        setClient(c);
        AgoraRTC.setLogLevel(4);

        // Event handlers
        c.on('user-published', async (user, mediaType) => {
          console.log('👤 User published:', { uid: user.uid, mediaType });
          try {
            await c.subscribe(user, mediaType);
            if (mediaType === 'video') {
              // Wait for next render to ensure ref is available
              setTimeout(() => {
                const videoContainer = remoteVideoRefs.current.get(user.uid);
                if (videoContainer && user.videoTrack) {
                  user.videoTrack.play(videoContainer);
                }
              }, 100);
            }
            if (mediaType === 'audio') {
              user.audioTrack?.play();
            }
            setRemoteUsers((prev) => {
              const filtered = prev.filter((u) => u.uid !== user.uid);
              return [...filtered, user];
            });
          } catch (error) {
            console.error('Error subscribing:', error);
          }
        });

        c.on('user-unpublished', (user) => {
          console.log('👤 User unpublished:', user.uid);
          user.videoTrack?.stop();
          user.audioTrack?.stop();
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        });

        c.on('user-left', (user) => {
          console.log('👤 User left:', user.uid);
          user.videoTrack?.stop();
          user.audioTrack?.stop();
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        });

        c.on('connection-state-change', (curState) => {
          console.log('🔌 Connection state:', curState);
          setConnectionState(curState);
        });

        c.on('network-quality', (stats) => {
          setNetworkQuality(stats);
        });

        // Join channel
        await c.join(
          response.credential.appId,
          response.credential.channelName,
          response.credential.token || null,
          response.credential.rtcUserId || null,
        );

        // Create and publish local tracks
        const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
          {},
          { 
            encoderConfig: {
              width: 1280,
              height: 720,
              frameRate: 30,
              bitrateMax: 2000,
            }
          }
        );

        setLocalAudioTrack(micTrack);
        setLocalVideoTrack(camTrack);

        await c.publish([micTrack, camTrack]);

        if (localVideoRef.current) {
          camTrack.play(localVideoRef.current);
        }

        // Start call timer
        callStartTimeRef.current = Date.now();
        durationIntervalRef.current = setInterval(() => {
          setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
        }, 1000);

        setLoading(false);
      } catch (e) {
        console.error('Failed to initialize call:', e);
        setError(e instanceof Error ? e.message : 'Failed to start call');
        setLoading(false);
      }
    };

    init();

    return () => {
      cleanup();
    };
  }, [sessionId]);

  const cleanup = async () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    try {
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
    } catch (error) {
      console.error('Error cleaning up:', error);
    }
  };

  const handleEndCall = async () => {
    await cleanup();
    router.push('/admin/users');
  };

  const toggleMute = () => {
    if (localAudioTrack) {
      localAudioTrack.setEnabled(micMuted);
      setMicMuted(!micMuted);
    }
  };

  const toggleVideo = () => {
    if (localVideoTrack) {
      localVideoTrack.setEnabled(videoOff);
      setVideoOff(!videoOff);
    }
  };

  const toggleScreenShare = async () => {
    if (!client) return;
    
    try {
      if (!screenSharing) {
        const screenTrack = await AgoraRTC.createScreenVideoTrack({}, 'auto');
        await client.unpublish(localVideoTrack);
        await client.publish(screenTrack);
        if (localVideoRef.current) {
          screenTrack.play(localVideoRef.current);
        }
        setScreenSharing(true);
      } else {
        const [camTrack] = await AgoraRTC.createCameraVideoTrack({
          encoderConfig: {
            width: 1280,
            height: 720,
            frameRate: 30,
          }
        });
        await client.unpublish();
        await client.publish([localAudioTrack, camTrack]);
        if (localVideoRef.current) {
          camTrack.play(localVideoRef.current);
        }
        setLocalVideoTrack(camTrack);
        setScreenSharing(false);
      }
    } catch (error) {
      console.error('Screen share error:', error);
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

  // Handle video playback when remote users change
  useEffect(() => {
    remoteUsers.forEach((user) => {
      if (user.videoTrack) {
        const container = remoteVideoRefs.current.get(user.uid);
        if (container) {
          user.videoTrack.play(container);
        }
      }
    });
  }, [remoteUsers]);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getNetworkQualityColor = () => {
    if (!networkQuality) return 'bg-gray-500';
    const quality = Math.min(networkQuality.downlinkNetworkQuality, networkQuality.uplinkNetworkQuality);
    if (quality >= 4) return 'bg-green-500';
    if (quality >= 2) return 'bg-yellow-500';
    return 'bg-red-500';
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
            onClick={() => router.push('/admin/users')}
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
            <div className={`w-3 h-3 rounded-full ${getNetworkQualityColor()}`}></div>
            <span className="text-sm text-gray-400 capitalize">{connectionState.toLowerCase()}</span>
          </div>
          <div className="h-6 w-px bg-gray-700"></div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-mono">{formatDuration(callDuration)}</span>
          </div>
          {session && (
            <>
              <div className="h-6 w-px bg-gray-700"></div>
              <span className="text-sm text-gray-400">Channel: {session.channelName}</span>
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
              {remoteUsers.map((user, index) => (
                index === 0 && (
                  <div
                    key={user.uid}
                    ref={(el) => {
                      if (el) {
                        remoteVideoRefs.current.set(user.uid, el);
                        // Play video if track is already available
                        if (user.videoTrack) {
                          setTimeout(() => {
                            user.videoTrack?.play(el);
                          }, 100);
                        }
                      }
                    }}
                    className="w-full h-full bg-gray-950"
                  ></div>
                )
              ))}
              {/* Local video thumbnail */}
              <div className="absolute bottom-4 right-4 w-64 h-48 bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-700 shadow-2xl">
                <div ref={localVideoRef} className="w-full h-full"></div>
                {videoOff && (
                  <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-600" />
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
                    <User className="w-16 h-16 text-gray-600" />
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-xs">
                  You {micMuted && '🔇'}
                </div>
              </div>
              {/* Remote videos */}
              {remoteUsers.map((user) => (
                <div
                  key={user.uid}
                  ref={(el) => {
                    if (el) {
                      remoteVideoRefs.current.set(user.uid, el);
                      // Play video if track is already available
                      if (user.videoTrack) {
                        setTimeout(() => {
                          user.videoTrack?.play(el);
                        }, 100);
                      }
                    }
                  }}
                  className="relative bg-gray-950 rounded-lg overflow-hidden"
                >
                  {!user.videoTrack && (
                    <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                      <User className="w-16 h-16 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Waiting for participants to join...</p>
              </div>
            </div>
          )}

          {/* Local video when no remote users (speaker mode) */}
          {viewMode === 'speaker' && remoteUsers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full max-w-4xl">
                <div ref={localVideoRef} className="w-full h-full bg-gray-950"></div>
                {videoOff && (
                  <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                    <User className="w-32 h-32 text-gray-600" />
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
                  <User className="w-5 h-5" />
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
                <div key={user.uid} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">User {user.uid}</p>
                    <p className="text-xs text-gray-400">Participant</p>
                  </div>
                  <div className="flex gap-1">
                    {user.audioTrack ? <Mic className="w-4 h-4 text-green-500" /> : <MicOff className="w-4 h-4 text-gray-500" />}
                    {user.videoTrack ? <Video className="w-4 h-4 text-green-500" /> : <VideoOff className="w-4 h-4 text-gray-500" />}
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
                <label className="block text-sm font-medium mb-2">Network Quality</label>
                <div className="bg-gray-800 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Uplink</span>
                    <span className="text-sm">{networkQuality?.uplinkNetworkQuality ?? 'N/A'}/6</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Downlink</span>
                    <span className="text-sm">{networkQuality?.downlinkNetworkQuality ?? 'N/A'}/6</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Call Info</label>
                <div className="bg-gray-800 p-3 rounded-lg space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Channel:</span>
                    <span>{session?.channelName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="capitalize">{session?.status.toLowerCase()}</span>
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

