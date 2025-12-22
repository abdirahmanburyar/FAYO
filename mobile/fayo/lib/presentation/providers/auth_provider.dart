import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/auth_models.dart';
import '../../core/router/app_router.dart';
import '../../services/fcm_service.dart';

class AuthNotifier extends StateNotifier<UserDto?> {
  final LocalStorage _storage;

  AuthNotifier(this._storage) : super(_storage.getUser());

  UserDto? get currentUser => state;

  bool get isAuthenticated => state != null;

  void setUser(UserDto user) {
    debugPrint('👤 [Auth] setUser called');
    debugPrint('   User ID: ${user.id}');
    debugPrint('   Email: ${user.email}');
    
    state = user;
    _storage.saveUser(user);
    
    debugPrint('🔔 [Auth] Initializing FCM for user ${user.id}...');
    
    // Initialize FCM and register token for this user
    FcmService().initialize(userId: user.id).then((_) {
      debugPrint('✅ [Auth] FCM initialized, registering token...');
      FcmService().registerTokenForUser(user.id);
    }).catchError((error, stackTrace) {
      debugPrint('❌ [Auth] Error initializing FCM: $error');
      debugPrint('❌ [Auth] Stack trace: $stackTrace');
    });
  }

  Future<void> clearUser() async {
    // Unregister FCM token before clearing user
    await FcmService().unregisterToken();
    
    state = null;
    await _storage.clearAll();
    AppRouter.refreshAuthState();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, UserDto?>((ref) {
  return AuthNotifier(LocalStorage());
});

