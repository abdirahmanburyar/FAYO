import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../data/models/appointment_models.dart';

class CallScreen extends StatefulWidget {
  final CallCredentialsDto credentials;

  const CallScreen({super.key, required this.credentials});

  @override
  State<CallScreen> createState() => _CallScreenState();
}

class _CallScreenState extends State<CallScreen> {
  bool _isVideoOn = true;
  bool _isAudioOn = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Video view placeholder
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.videocam,
                  size: 64,
                  color: Colors.white,
                ),
                const SizedBox(height: 16),
                const Text(
                  'Video Call',
                  style: TextStyle(color: Colors.white, fontSize: 24),
                ),
                const SizedBox(height: 8),
                Text(
                  'Channel: ${widget.credentials.channelName}',
                  style: const TextStyle(color: Colors.white70),
                ),
              ],
            ),
          ),
          // Controls
          Positioned(
            bottom: 32,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                IconButton(
                  icon: Icon(
                    _isVideoOn ? Icons.videocam : Icons.videocam_off,
                    color: Colors.white,
                    size: 32,
                  ),
                  onPressed: () => setState(() => _isVideoOn = !_isVideoOn),
                ),
                IconButton(
                  icon: Icon(
                    _isAudioOn ? Icons.mic : Icons.mic_off,
                    color: Colors.white,
                    size: 32,
                  ),
                  onPressed: () => setState(() => _isAudioOn = !_isAudioOn),
                ),
                IconButton(
                  icon: const Icon(
                    Icons.call_end,
                    color: Colors.red,
                    size: 32,
                  ),
                  onPressed: () => context.pop(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

