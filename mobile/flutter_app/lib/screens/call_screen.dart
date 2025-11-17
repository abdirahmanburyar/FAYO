// IMPORTANT: This is a placeholder implementation for Zoom Video SDK
// The flutter_zoom_videosdk package API needs to be implemented according to official docs
// Reference: https://marketplace.zoom.us/docs/sdk/video/flutter
// Once you verify the correct API, replace this implementation

import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
// import 'package:flutter_zoom_videosdk/flutter_zoom_videosdk.dart';
import '../services/call_service.dart';

class CallScreen extends StatefulWidget {
  final CallCredential credential;

  const CallScreen({super.key, required this.credential});

  @override
  State<CallScreen> createState() => _CallScreenState();
}

class _CallScreenState extends State<CallScreen> {
  bool _isJoined = false;
  bool _isVideoOn = true;
  bool _isAudioOn = true;
  bool _hasRemoteUser = false;

  @override
  void initState() {
    super.initState();
    _initZoom();
  }

  Future<void> _initZoom() async {
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

      debugPrint("📞 [CALL] Initializing Zoom Video SDK...");
      debugPrint("📞 [CALL] SDK Key: ${widget.credential.sdkKey}");
      debugPrint("📞 [CALL] Session Name: ${widget.credential.sessionName}");
      debugPrint("📞 [CALL] User Identity: ${widget.credential.userIdentity}");
      debugPrint("📞 [CALL] Token: ${widget.credential.token.length > 20 ? widget.credential.token.substring(0, 20) + '...' : widget.credential.token}");

      // TODO: Implement Zoom Video SDK initialization
      // Example implementation needed here:
      // 1. Import the correct package
      // 2. Initialize ZoomVideoSdk
      // 3. Configure with initConfig
      // 4. Set up event listeners
      // 5. Join session with joinConfig
      
      // For now, show a message that SDK implementation is needed
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Zoom Video SDK implementation required. Please check the package documentation.'),
            backgroundColor: Colors.orange,
            duration: Duration(seconds: 5),
          ),
        );
      }

      // Simulate successful initialization for UI testing
      await Future.delayed(const Duration(seconds: 1));
      if (mounted) {
        setState(() {
          _isJoined = true;
        });
      }

      debugPrint("⚠️ [CALL] Zoom SDK integration incomplete - placeholder implementation active");
      
    } catch (e) {
      debugPrint("❌ [CALL] Failed to initialize Zoom: $e");
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to start call: $e'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 10),
          ),
        );
        Navigator.of(context).pop();
      }
    }
  }

  Future<void> _toggleVideo() async {
    // TODO: Implement video toggle with Zoom SDK
    setState(() {
      _isVideoOn = !_isVideoOn;
    });
    debugPrint("📹 [CALL] Video toggled: $_isVideoOn");
  }

  Future<void> _toggleAudio() async {
    // TODO: Implement audio toggle with Zoom SDK
    setState(() {
      _isAudioOn = !_isAudioOn;
    });
    debugPrint("🔊 [CALL] Audio toggled: $_isAudioOn");
  }

  Future<void> _leaveSession() async {
    // TODO: Implement session leave with Zoom SDK
    debugPrint("👋 [CALL] Leaving session");
    if (mounted) {
      Navigator.of(context).pop();
    }
  }

  @override
  void dispose() {
    _leaveSession();
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
            // Remote video placeholder (full screen)
            Center(
              child: _hasRemoteUser
                  ? Container(
                      color: Colors.grey[900],
                      child: const Center(
                        child: Icon(
                          Icons.person,
                          size: 100,
                          color: Colors.white54,
                        ),
                      ),
                    )
                  : Container(
                      color: Colors.black,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const CircularProgressIndicator(color: Colors.white),
                          const SizedBox(height: 16),
                          const Text(
                            'Waiting for remote user to join...',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                            ),
                          ),
                          const SizedBox(height: 32),
                          Container(
                            padding: const EdgeInsets.all(16),
                            margin: const EdgeInsets.symmetric(horizontal: 32),
                            decoration: BoxDecoration(
                              color: Colors.orange.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Colors.orange),
                            ),
                            child: Column(
                              children: [
                                const Icon(
                                  Icons.warning_amber_rounded,
                                  color: Colors.orange,
                                  size: 32,
                                ),
                                const SizedBox(height: 8),
                                const Text(
                                  'Zoom SDK Integration Required',
                                  style: TextStyle(
                                    color: Colors.orange,
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'This is a placeholder. Implement Zoom Video SDK according to:\nhttps://marketplace.zoom.us/docs/sdk/video/flutter',
                                  style: TextStyle(
                                    color: Colors.white.withOpacity(0.7),
                                    fontSize: 12,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
            ),
            // Local video placeholder (picture-in-picture)
            if (_isJoined)
              Positioned(
                right: 16,
                top: 16,
                width: 120,
                height: 160,
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.grey[800],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: Center(
                      child: Icon(
                        _isVideoOn ? Icons.videocam : Icons.videocam_off,
                        color: Colors.white54,
                        size: 40,
                      ),
                    ),
                  ),
                ),
              ),
            // Call controls
            Positioned(
              bottom: 32,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Mute/Unmute Audio
                  FloatingActionButton(
                    backgroundColor: _isAudioOn ? Colors.blue : Colors.grey,
                    onPressed: _toggleAudio,
                    heroTag: "audio",
                    child: Icon(
                      _isAudioOn ? Icons.mic : Icons.mic_off,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(width: 16),
                  // Toggle Video
                  FloatingActionButton(
                    backgroundColor: _isVideoOn ? Colors.blue : Colors.grey,
                    onPressed: _toggleVideo,
                    heroTag: "video",
                    child: Icon(
                      _isVideoOn ? Icons.videocam : Icons.videocam_off,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(width: 16),
                  // End Call
                  FloatingActionButton(
                    backgroundColor: Colors.red,
                    onPressed: _leaveSession,
                    heroTag: "end",
                    child: const Icon(Icons.call_end, color: Colors.white),
                  ),
                ],
              ),
            ),
            // SDK Info overlay
            Positioned(
              top: 200,
              left: 16,
              right: 16,
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.7),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Session Info:',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Session: ${widget.credential.sessionName}',
                      style: const TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                    Text(
                      'User: ${widget.credential.userIdentity}',
                      style: const TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                    Text(
                      'Role: ${widget.credential.role}',
                      style: const TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                    Text(
                      'SDK Key: ${widget.credential.sdkKey.substring(0, 10)}...',
                      style: const TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
