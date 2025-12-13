import 'package:flutter/material.dart';
import '../../data/models/appointment_models.dart';
import '../../core/theme/app_colors.dart';

class CallInvitationDialog extends StatelessWidget {
  final CallInvitationDto invitation;
  final VoidCallback onAccept;
  final VoidCallback onDecline;

  const CallInvitationDialog({
    super.key,
    required this.invitation,
    required this.onAccept,
    required this.onDecline,
  });

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Icon
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.skyBlue100,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.video_call,
                size: 40,
                color: AppColors.skyBlue600,
              ),
            ),
            const SizedBox(height: 24),
            // Title
            Text(
              'Incoming Call',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'You have an incoming video call',
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            // Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: onDecline,
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      side: const BorderSide(color: AppColors.errorRed),
                    ),
                    child: const Text(
                      'Decline',
                      style: TextStyle(color: AppColors.errorRed),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: onAccept,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: AppColors.successGreen,
                    ),
                    child: const Text('Accept'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

