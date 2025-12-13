import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/auth_models.dart';

class AuthNotifier extends StateNotifier<UserDto?> {
  final LocalStorage _storage;

  AuthNotifier(this._storage) : super(_storage.getUser());

  UserDto? get currentUser => state;

  bool get isAuthenticated => state != null;

  void setUser(UserDto user) {
    state = user;
    _storage.saveUser(user);
  }

  void clearUser() {
    state = null;
    _storage.clearAll();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, UserDto?>((ref) {
  return AuthNotifier(LocalStorage());
});

