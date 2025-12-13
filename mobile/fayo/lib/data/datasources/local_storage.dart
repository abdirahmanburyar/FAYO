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
  }
}

