import 'package:flutter/material.dart';

class ConnectionStatusBanner extends StatelessWidget {
  final bool isConnected;
  final String status;

  const ConnectionStatusBanner({
    super.key,
    required this.isConnected,
    required this.status,
  });

  @override
  Widget build(BuildContext context) {
    // Always show the banner to display connection status
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: _getStatusColor(),
      child: Row(
        children: [
          Icon(
            _getStatusIcon(),
            size: 16,
            color: Colors.white,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _getStatusMessage(),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor() {
    switch (status) {
      case 'connected':
        return Colors.green;
      case 'connecting':
        return Colors.orange;
      case 'error':
      case 'failed':
        return Colors.red;
      case 'disconnected':
      default:
        return Colors.grey[600]!;
    }
  }

  IconData _getStatusIcon() {
    switch (status) {
      case 'connected':
        return Icons.wifi;
      case 'connecting':
        return Icons.wifi_find;
      case 'error':
      case 'failed':
        return Icons.wifi_off;
      case 'disconnected':
      default:
        return Icons.wifi_off;
    }
  }

  String _getStatusMessage() {
    switch (status) {
      case 'connected':
        return 'Connected to live updates';
      case 'connecting':
        return 'Connecting to live updates...';
      case 'error':
        return 'Connection error - retrying...';
      case 'failed':
        return 'Failed to connect to live updates';
      case 'disconnected':
      default:
        return 'Disconnected from live updates';
    }
  }
}
