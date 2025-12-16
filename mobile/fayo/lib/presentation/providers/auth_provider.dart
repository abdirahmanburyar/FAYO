import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/auth_models.dart';
import '../../core/router/app_router.dart';

class AuthNotifier extends StateNotifier<UserDto?> {
  final LocalStorage _storage;

  AuthNotifier(this._storage) : super(_storage.getUser());

  UserDto? get currentUser => state;

  bool get isAuthenticated => state != null;

  void setUser(UserDto user) {
    state = user;
    _storage.saveUser(user);
  }

  Future<void> clearUser() async {
    state = null;
    await _storage.clearAll();
    AppRouter.refreshAuthState();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, UserDto?>((ref) {
  return AuthNotifier(LocalStorage());
});

