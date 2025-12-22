import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/datasources/local_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:timeago/timeago.dart' as timeago;

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  final LocalStorage _localStorage = LocalStorage();
  bool _isLoading = true;
  List<Map<String, dynamic>> _notifications = [];

  @override
  void initState() {
    super.initState();
    _initializeStorage();
  }

  Future<void> _initializeStorage() async {
    await _localStorage.init();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() => _isLoading = true);
    try {
      // Load notifications from local storage
      final notifications = _localStorage.getNotifications();
      
      // Sort by timestamp (newest first)
      notifications.sort((a, b) {
        final timestampA = a['timestamp'] as String? ?? '';
        final timestampB = b['timestamp'] as String? ?? '';
        return timestampB.compareTo(timestampA);
      });
      
      setState(() {
        _notifications = notifications;
      });
    } catch (e) {
      debugPrint('Error loading notifications: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.gray900),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Notifications',
          style: TextStyle(
            color: AppColors.gray900,
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
        actions: [
          if (_notifications.isNotEmpty)
            TextButton(
              onPressed: () async {
                await _localStorage.markAllNotificationsAsRead();
                await _loadNotifications();
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('All notifications marked as read')),
                  );
                }
              },
              child: const Text(
                'Mark all read',
                style: TextStyle(color: AppColors.skyBlue600),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _notifications.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: _loadNotifications,
                  color: AppColors.skyBlue600,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _notifications.length,
                    itemBuilder: (context, index) {
                      return _buildNotificationItem(_notifications[index]);
                    },
                  ),
                ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.notifications_none,
            size: 80,
            color: AppColors.gray300,
          ),
          const SizedBox(height: 16),
          Text(
            'No Notifications',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: AppColors.gray900,
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'You\'re all caught up!\nNew notifications will appear here.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.gray600,
                ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _loadNotifications,
            icon: const Icon(Icons.refresh),
            label: const Text('Refresh'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.skyBlue600,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationItem(Map<String, dynamic> notification) {
    final isRead = notification['isRead'] ?? false;
    final title = notification['title'] ?? 'Notification';
    final body = notification['body'] ?? '';
    final timestamp = notification['timestamp'];
    final type = notification['type'];
    final data = notification['data'] ?? {};

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isRead ? Colors.transparent : AppColors.skyBlue200,
          width: isRead ? 0 : 1,
        ),
      ),
      color: isRead ? Colors.white : AppColors.skyBlue50,
      child: InkWell(
        onTap: () async {
          // Mark notification as read and remove from storage
          final notificationId = notification['id'] as String?;
          if (notificationId != null && !isRead) {
            await _localStorage.markNotificationAsRead(notificationId);
            await _loadNotifications();
          }
          // Navigate to relevant screen
          _handleNotificationTap(type, data);
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Icon
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: _getNotificationColor(type).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  _getNotificationIcon(type),
                  color: _getNotificationColor(type),
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                  fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
                                  color: AppColors.gray900,
                                ),
                          ),
                        ),
                        if (!isRead)
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: AppColors.skyBlue600,
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      body,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.gray600,
                          ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (timestamp != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        _formatTimestamp(timestamp),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.gray500,
                              fontSize: 11,
                            ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _handleNotificationTap(String? type, Map<String, dynamic> data) {
    if (type == null) return;

    switch (type) {
      case 'NEW_DOCTOR_AT_HOSPITAL':
        final hospitalId = data['hospitalId'];
        if (hospitalId != null) {
          context.go('/hospitals/$hospitalId');
        }
        break;
      case 'APPOINTMENT_REMINDER':
      case 'APPOINTMENT_CONFIRMED':
      case 'APPOINTMENT_CANCELLED':
        final appointmentId = data['appointmentId'];
        if (appointmentId != null) {
          // TODO: Navigate to appointment details when route is available
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Appointment: $appointmentId')),
          );
        }
        break;
      case 'PAYMENT_CONFIRMED':
        final paymentId = data['paymentId'];
        if (paymentId != null) {
          // TODO: Navigate to payment details when route is available
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Payment: $paymentId')),
          );
        }
        break;
      default:
        break;
    }
  }

  IconData _getNotificationIcon(String? type) {
    switch (type) {
      case 'NEW_DOCTOR_AT_HOSPITAL':
        return Icons.person_add;
      case 'APPOINTMENT_REMINDER':
      case 'APPOINTMENT_CONFIRMED':
      case 'APPOINTMENT_CANCELLED':
        return Icons.calendar_today;
      case 'PAYMENT_CONFIRMED':
        return Icons.payment;
      default:
        return Icons.notifications;
    }
  }

  Color _getNotificationColor(String? type) {
    switch (type) {
      case 'NEW_DOCTOR_AT_HOSPITAL':
        return AppColors.blue500;
      case 'APPOINTMENT_REMINDER':
      case 'APPOINTMENT_CONFIRMED':
      case 'APPOINTMENT_CANCELLED':
        return AppColors.green500;
      case 'PAYMENT_CONFIRMED':
        return AppColors.purple500;
      default:
        return AppColors.skyBlue600;
    }
  }

  String _formatTimestamp(dynamic timestamp) {
    try {
      DateTime dateTime;
      if (timestamp is String) {
        dateTime = DateTime.parse(timestamp);
      } else if (timestamp is int) {
        dateTime = DateTime.fromMillisecondsSinceEpoch(timestamp);
      } else {
        return 'Just now';
      }
      return timeago.format(dateTime);
    } catch (e) {
      return 'Just now';
    }
  }
}

