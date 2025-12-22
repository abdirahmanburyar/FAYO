import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants/app_constants.dart';
import '../models/auth_models.dart';

class LocalStorage {
  static final LocalStorage _instance = LocalStorage._internal();
  factory LocalStorage() => _instance;
  LocalStorage._internal();

  SharedPreferences? _prefs;

  Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  // Token Management
  Future<void> saveToken(String token) async {
    await _prefs?.setString(AppConstants.tokenKey, token);
  }

  String? getToken() {
    return _prefs?.getString(AppConstants.tokenKey);
  }

  Future<void> saveRefreshToken(String refreshToken) async {
    await _prefs?.setString(AppConstants.refreshTokenKey, refreshToken);
  }

  String? getRefreshToken() {
    return _prefs?.getString(AppConstants.refreshTokenKey);
  }

  Future<void> clearTokens() async {
    await _prefs?.remove(AppConstants.tokenKey);
    await _prefs?.remove(AppConstants.refreshTokenKey);
  }

  // User Management
  Future<void> saveUser(UserDto user) async {
    final userJson = jsonEncode(user.toJson());
    await _prefs?.setString(AppConstants.userKey, userJson);
    await _prefs?.setBool(AppConstants.isLoggedInKey, true);
  }

  UserDto? getUser() {
    final userJson = _prefs?.getString(AppConstants.userKey);
    if (userJson == null) return null;
    try {
      final userMap = jsonDecode(userJson) as Map<String, dynamic>;
      return UserDto.fromJson(userMap);
    } catch (e) {
      return null;
    }
  }

  Future<void> clearUser() async {
    await _prefs?.remove(AppConstants.userKey);
    await _prefs?.setBool(AppConstants.isLoggedInKey, false);
  }

  bool isLoggedIn() {
    return _prefs?.getBool(AppConstants.isLoggedInKey) ?? false;
  }

  Future<void> clearAll() async {
    await clearTokens();
    await clearUser();
    await clearNotifications();
  }

  // Notifications Management
  static const String _notificationsKey = 'unread_notifications';

  Future<void> saveNotification(Map<String, dynamic> notification) async {
    final notifications = getNotifications();
    // Add unique ID if not present
    if (!notification.containsKey('id')) {
      notification['id'] = DateTime.now().millisecondsSinceEpoch.toString();
    }
    // Add timestamp if not present
    if (!notification.containsKey('timestamp')) {
      notification['timestamp'] = DateTime.now().toIso8601String();
    }
    // Mark as unread
    notification['isRead'] = false;
    
    // Add to the beginning of the list
    notifications.insert(0, notification);
    
    // Save to SharedPreferences
    final notificationsJson = jsonEncode(notifications);
    await _prefs?.setString(_notificationsKey, notificationsJson);
  }

  List<Map<String, dynamic>> getNotifications() {
    final notificationsJson = _prefs?.getString(_notificationsKey);
    if (notificationsJson == null) return [];
    try {
      final List<dynamic> notificationsList = jsonDecode(notificationsJson);
      return notificationsList
          .map((item) => Map<String, dynamic>.from(item))
          .toList();
    } catch (e) {
      return [];
    }
  }

  Future<void> markNotificationAsRead(String notificationId) async {
    final notifications = getNotifications();
    notifications.removeWhere((notification) => notification['id'] == notificationId);
    
    final notificationsJson = jsonEncode(notifications);
    await _prefs?.setString(_notificationsKey, notificationsJson);
  }

  Future<void> markAllNotificationsAsRead() async {
    await _prefs?.remove(_notificationsKey);
  }

  Future<void> clearNotifications() async {
    await _prefs?.remove(_notificationsKey);
  }

  int getUnreadNotificationCount() {
    final notifications = getNotifications();
    return notifications.where((n) => !(n['isRead'] ?? false)).length;
  }
}

