import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import '../services/call_service.dart';

class CallScreen extends StatefulWidget {
  final CallCredential credential;

  const CallScreen({super.key, required this.credential});

  @override
  State<CallScreen> createState() => _CallScreenState();
}

class _CallScreenState extends State<CallScreen> {
  late final RtcEngine _engine;
  int? _remoteUid;
  bool _localJoined = false;

  @override
  void initState() {
    super.initState();
    _initAgora();
  }

  Future<void> _initAgora() async {
    try {
      // Request permissions
      final statuses = await [Permission.camera, Permission.microphone].request();
      if (statuses[Permission.camera] != PermissionStatus.granted ||
          statuses[Permission.microphone] != PermissionStatus.granted) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Camera and microphone permissions are required for video calls'),
              backgroundColor: Colors.red,
            ),
          );
        }
        return;
      }

      _engine = createAgoraRtcEngine();
      await _engine.initialize(RtcEngineContext(
        appId: widget.credential.appId,
      ));

      _engine.registerEventHandler(
        RtcEngineEventHandler(
          onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
            debugPrint("✅ [CALL] Local user joined channel: ${connection.localUid}, elapsed: ${elapsed}ms");
            debugPrint("📊 [CALL] Connection info: channelId=${connection.channelId}, localUid=${connection.localUid}");
            if (mounted) {
              setState(() {
                _localJoined = true;
              });
            }
          },
          onUserJoined: (RtcConnection connection, int remoteUid, int elapsed) {
            debugPrint("✅ [CALL] Remote user joined: uid=$remoteUid, elapsed=${elapsed}ms");
            debugPrint("📊 [CALL] Connection: channelId=${connection.channelId}, localUid=${connection.localUid}");
            if (mounted) {
              setState(() {
                _remoteUid = remoteUid;
              });
            }
          },
          onUserOffline: (RtcConnection connection, int remoteUid, UserOfflineReasonType reason) {
            debugPrint("❌ [CALL] Remote user left: uid=$remoteUid, reason=$reason");
            if (mounted) {
              setState(() {
                _remoteUid = null;
              });
            }
          },
          onConnectionStateChanged: (RtcConnection connection, ConnectionStateType state, ConnectionChangedReasonType reason) {
            debugPrint("🔌 [CALL] Connection state changed: state=$state, reason=$reason");
          },
          onNetworkQuality: (RtcConnection connection, int remoteUid, QualityType txQuality, QualityType rxQuality) {
            debugPrint("📶 [CALL] Network quality: remoteUid=$remoteUid, tx=$txQuality, rx=$rxQuality");
          },
          onError: (ErrorCodeType err, String msg) {
            debugPrint("❌ [CALL] Error: code=$err, message=$msg");
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Call error: $msg (code: $err)'),
                  backgroundColor: Colors.red,
                  duration: const Duration(seconds: 5),
                ),
              );
            }
          },
          onTokenPrivilegeWillExpire: (RtcConnection connection, String token) {
            debugPrint("⚠️ [CALL] Token will expire soon, channelId=${connection.channelId}");
          },
          onFirstRemoteVideoDecoded: (RtcConnection connection, int remoteUid, int width, int height, int elapsed) {
            debugPrint("🎥 [CALL] First remote video decoded: uid=$remoteUid, size=${width}x${height}, elapsed=${elapsed}ms");
          },
          onFirstRemoteAudioFrame: (RtcConnection connection, int remoteUid, int elapsed) {
            debugPrint("🔊 [CALL] First remote audio frame: uid=$remoteUid, elapsed=${elapsed}ms");
          },
        ),
      );

      await _engine.enableVideo();
      await _engine.startPreview();

      debugPrint("📞 [CALL] Joining channel: ${widget.credential.channelName} with userAccount: ${widget.credential.rtcUserId}");
      
      // Use joinChannelWithUserAccount since token was generated with user account
      final token = widget.credential.token.isEmpty ? "" : widget.credential.token;
      await _engine.joinChannelWithUserAccount(
        token: token,
        channelId: widget.credential.channelName,
        userAccount: widget.credential.rtcUserId,
        options: const ChannelMediaOptions(
          clientRoleType: ClientRoleType.clientRoleBroadcaster,
        ),
      );
    } catch (e) {
      debugPrint("❌ [CALL] Failed to initialize Agora: $e");
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to start call: $e'),
            backgroundColor: Colors.red,
          ),
        );
        Navigator.of(context).pop();
      }
    }
  }

  @override
  void dispose() {
    try {
      _engine.leaveChannel();
      _engine.release();
    } catch (e) {
      debugPrint("⚠️ [CALL] Error disposing engine: $e");
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text('Video Call'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: Stack(
          children: [
            // Remote video (full screen)
            Center(
              child: _remoteUid != null
                  ? AgoraVideoView(
                      controller: VideoViewController.remote(
                        rtcEngine: _engine,
                        canvas: VideoCanvas(uid: _remoteUid),
                        connection: RtcConnection(channelId: widget.credential.channelName),
                      ),
                    )
                  : Container(
                      color: Colors.black,
                      child: const Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            CircularProgressIndicator(color: Colors.white),
                            SizedBox(height: 16),
                            Text(
                              'Waiting for remote user to join...',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
            ),
            // Local video (picture-in-picture)
            Positioned(
              right: 16,
              top: 16,
              width: 120,
              height: 160,
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.white, width: 2),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: _localJoined
                      ? AgoraVideoView(
                          controller: VideoViewController(
                            rtcEngine: _engine,
                            canvas: const VideoCanvas(uid: 0),
                          ),
                        )
                      : const Center(
                          child: CircularProgressIndicator(color: Colors.white),
                        ),
                ),
              ),
            ),
            // Call controls
            Positioned(
              bottom: 32,
              left: 0,
              right: 0,
              child: Center(
                child: FloatingActionButton(
                  backgroundColor: Colors.red,
                  onPressed: () async {
                    try {
                      await _engine.leaveChannel();
                      if (mounted) {
                        Navigator.of(context).pop();
                      }
                    } catch (e) {
                      debugPrint("⚠️ [CALL] Error leaving channel: $e");
                      if (mounted) {
                        Navigator.of(context).pop();
                      }
                    }
                  },
                  child: const Icon(Icons.call_end, color: Colors.white),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}


