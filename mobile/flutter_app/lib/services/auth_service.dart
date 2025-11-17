import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';
import 'call_socket_service.dart';

class AuthService extends ChangeNotifier {
  String? _token;
  String? _refreshToken;
  String? _userId;
  String? _phoneNumber;
  String? _profileFirstName;
  String? _profileLastName;
  String? _profileRole;
  bool _isAuthenticated = false;
  
  // Using SharedPreferences for now (temporary fix for secure storage issue)

  String? get token => _token;
  String? get refreshToken => _refreshToken;
  String? get userId => _userId;
  String? get phoneNumber => _phoneNumber;
  String? get profileFirstName => _profileFirstName;
  String? get profileLastName => _profileLastName;
  String? get profileRole => _profileRole;
  bool get isAuthenticated => _isAuthenticated;

  AuthService() {
    _loadAuthData();
  }

  Future<void> _loadAuthData() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    _refreshToken = prefs.getString('refresh_token');
    _userId = prefs.getString('user_id');
    _phoneNumber = prefs.getString('phone_number');
    _profileFirstName = prefs.getString('profile_first_name');
    _profileLastName = prefs.getString('profile_last_name');
    _profileRole = prefs.getString('profile_role');
    _isAuthenticated = _token != null;
    notifyListeners();
  }

  Future<void> _saveAuthData() async {
    final prefs = await SharedPreferences.getInstance();
    if (_token != null) {
      await prefs.setString('auth_token', _token!);
    }
    if (_refreshToken != null) {
      await prefs.setString('refresh_token', _refreshToken!);
    }
    if (_userId != null) {
      await prefs.setString('user_id', _userId!);
    }
    if (_phoneNumber != null) {
      await prefs.setString('phone_number', _phoneNumber!);
    }
    if (_profileFirstName != null) {
      await prefs.setString('profile_first_name', _profileFirstName!);
    }
    if (_profileLastName != null) {
      await prefs.setString('profile_last_name', _profileLastName!);
    }
    if (_profileRole != null) {
      await prefs.setString('profile_role', _profileRole!);
    }
  }

  Future<void> _clearAuthData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('refresh_token');
    await prefs.remove('user_id');
    await prefs.remove('phone_number');
    await prefs.remove('profile_first_name');
    await prefs.remove('profile_last_name');
    await prefs.remove('profile_role');
  }

  Future<Map<String, dynamic>> sendOtp(String phoneNumber) async {
    try {
      if (kDebugMode) {
        print('📤 [AUTH] Starting OTP send process');
        print('   📱 Phone: $phoneNumber');
        print('   ⏰ Timestamp: ${DateTime.now().toIso8601String()}');
      }
      
      final apiService = ApiService();
      final response = await apiService.sendOtp(phoneNumber);
      
      if (kDebugMode) {
        print('📡 [AUTH] OTP Send API Response:');
        print('   ✅ Success: ${response.success}');
        print('   💬 Message: ${response.message}');
        print('   📦 Data: ${response.data}');
      }
      
      if (!response.success) {
        if (kDebugMode) {
          print('❌ [AUTH] OTP send failed: ${response.message}');
        }
        return {
          'success': false,
          'message': response.message,
        };
      }
      
      if (kDebugMode) {
        final data = response.data;
        final userCreated = data?['userCreated'] ?? false;
        print('✅ [AUTH] OTP sent successfully!');
        print('   💬 Message: ${response.message}');
        if (userCreated) {
          print('   👤 New user was created automatically');
        } else {
          print('   👤 Existing user, OTP sent');
        }
        print('   ⏱️ Expires in: ${data?['expiresIn'] ?? 'Unknown'}ms');
      }
      
      return {
        'success': true,
        'message': response.message,
        'data': response.data,
      };
    } catch (e) {
      if (kDebugMode) {
        print('❌ [AUTH] OTP send error: $e');
      }
      return {
        'success': false,
        'message': 'Failed to send OTP: $e',
      };
    }
  }

  Future<Map<String, dynamic>> verifyOtp(String phoneNumber, String otp) async {
    try {
      if (kDebugMode) {
        print('🔍 [AUTH] Starting OTP verification process');
        print('   📱 Phone: $phoneNumber');
        print('   🔢 OTP Code: $otp');
        print('   ⏰ Timestamp: ${DateTime.now().toIso8601String()}');
      }
      
      final apiService = ApiService();
      final response = await apiService.loginWithOtp(phoneNumber, otp);
      
      if (kDebugMode) {
        print('📡 [AUTH] API Response received:');
        print('   ✅ Success: ${response.success}');
        print('   💬 Message: ${response.message}');
        print('   📦 Data: ${response.data}');
      }
      
      if (!response.success) {
        if (kDebugMode) {
          print('❌ [AUTH] OTP verification failed: ${response.message}');
        }
        return {
          'success': false,
          'message': response.message,
        };
      }
      
      // Extract token and user data from response
      final data = response.data;
      if (kDebugMode) {
        print('🔍 [AUTH] Response data structure:');
        print('   📦 Full data: $data');
        print('   🔑 access_token: ${data['access_token']}');
        print('   🔑 accessToken: ${data['accessToken']}');
        print('   🔑 token: ${data['token']}');
        print('   🔄 refresh_token: ${data['refresh_token']}');
        print('   🔄 refreshToken: ${data['refreshToken']}');
        print('   👤 user: ${data['user']}');
        print('   📋 payload: ${data['payload']}');
      }
      
      // Extract JWT tokens from response
      _token = data['access_token'] ?? data['accessToken'] ?? data['token'];
      _refreshToken = data['refresh_token'] ?? data['refreshToken'];
      
      if (kDebugMode) {
        print('🔑 [AUTH] JWT tokens extracted:');
        print('   🎫 Access Token: ${_token?.substring(0, 20)}...');
        print('   🔄 Refresh Token: ${_refreshToken?.substring(0, 20)}...');
      }
      
      _userId = data['user']?['id'] ?? data['userId'] ?? data['payload']?['sub'];
      _phoneNumber = phoneNumber;
      _isAuthenticated = true;

      // Store profile details if available
      final user = data['user'];
      if (user != null) {
        _profileFirstName = user['firstName'];
        _profileLastName = user['lastName'];
        _profileRole = user['role'];
      }
      
      if (kDebugMode) {
        print('🔑 [AUTH] Tokens extracted:');
        print('   🎫 Access Token: ${_token?.substring(0, 20)}...');
        print('   🔄 Refresh Token: ${_refreshToken?.substring(0, 20)}...');
        print('   👤 User ID: $_userId');
        print('   📱 Phone: $_phoneNumber');
        print('   ✅ Authenticated: $_isAuthenticated');
      }
      
      await _saveAuthData();
      notifyListeners();
      
      if (kDebugMode) {
        print('✅ [AUTH] OTP verification completed successfully!');
        print('   💾 Auth data saved to secure storage');
        print('   🔔 Listeners notified');
        print('   🎯 User is now authenticated: $_isAuthenticated');
        print('   🎫 Token available: ${_token != null}');
      }
      
      return {
        'success': true,
        'message': response.message,
        'data': response.data,
      };
    } catch (e) {
      if (kDebugMode) {
        print('❌ [AUTH] OTP verification error: $e');
      }
      return {
        'success': false,
        'message': 'Failed to verify OTP: $e',
      };
    }
  }

  Future<void> logout() async {
    // Disconnect call socket service before logout
    try {
      await CallSocketService().disconnect();
      if (kDebugMode) {
        print('✅ [AUTH] Call socket disconnected');
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ [AUTH] Error disconnecting call socket: $e');
      }
    }
    _token = null;
    _userId = null;
    _phoneNumber = null;
    _profileFirstName = null;
    _profileLastName = null;
    _profileRole = null;
    _isAuthenticated = false;
    
    await _clearAuthData();
    notifyListeners();
  }

  Future<void> refreshAuthToken() async {
    if (!_isAuthenticated || _refreshToken == null) return;
    
    try {
      final apiService = ApiService();
      final response = await apiService.refreshToken(_refreshToken!);
      
      if (!response.success) {
        throw Exception(response.message);
      }
      
      // Extract new token from response
      final data = response.data;
      _token = data['access_token'] ?? data['accessToken'] ?? data['token'];
      _refreshToken = data['refresh_token'] ?? data['refreshToken'];
      
      if (kDebugMode) {
        print('🔄 [AUTH] Tokens refreshed:');
        print('   🎫 New Access Token: ${_token?.substring(0, 20)}...');
        print('   🔄 New Refresh Token: ${_refreshToken?.substring(0, 20)}...');
      }
      
      await _saveAuthData();
      notifyListeners();
      
      if (kDebugMode) {
        print('Token refreshed successfully');
      }
    } catch (e) {
      // If refresh fails, logout the user
      await logout();
      throw Exception('Failed to refresh token: $e');
    }
  }

  Future<Map<String, dynamic>> getUserProfile() async {
    if (!_isAuthenticated || _token == null) {
      print('❌ [AUTH] User not authenticated or token is null');
      print('   🔐 Is Authenticated: $_isAuthenticated');
      print('   🎫 Token: $_token');
      return {
        'success': false,
        'message': 'User not authenticated',
      };
    }

    try {
      print('👤 [AUTH] Fetching user profile...');
      print('   🎫 Using token: ${_token!.substring(0, 20)}...');
      final apiService = ApiService();
      final response = await apiService.getUserProfile(_token!);
      
      if (response.success) {
        print('✅ [AUTH] Profile fetched successfully');
        final data = response.data;
        _profileFirstName = data['firstName'];
        _profileLastName = data['lastName'];
        _profileRole = data['role'];
        await _saveAuthData();
        notifyListeners();
        return {
          'success': true,
          'message': 'Profile fetched successfully',
          'data': data,
        };
      } else {
        print('❌ [AUTH] Failed to fetch profile: ${response.message}');
        return {
          'success': false,
          'message': response.message,
        };
      }
    } catch (e) {
      print('❌ [AUTH] Error fetching profile: $e');
      return {
        'success': false,
        'message': 'Failed to fetch profile: $e',
      };
    }
  }

  Future<Map<String, dynamic>> updateUserProfile(Map<String, dynamic> profileData) async {
    if (!_isAuthenticated || _token == null) {
      if (kDebugMode) {
        print('❌ [AUTH] User not authenticated or token is null');
        print('   🔐 Is Authenticated: $_isAuthenticated');
        print('   🎫 Token: $_token');
      }
      return {
        'success': false,
        'message': 'User not authenticated',
      };
    }

    try {
      if (kDebugMode) {
        print('👤 [AUTH] Updating user profile...');
        print('   🎫 Using token: ${_token!.substring(0, 20)}...');
        print('   📦 Profile Data: $profileData');
      }
      
      final apiService = ApiService();
      final response = await apiService.updateUserProfile(_token!, profileData);
      
      if (response.success) {
        if (kDebugMode) {
          print('✅ [AUTH] Profile updated successfully');
        }
        
        final data = response.data;
        
        // Update local profile data
        if (data['firstName'] != null) _profileFirstName = data['firstName'];
        if (data['lastName'] != null) _profileLastName = data['lastName'];
        if (data['phone'] != null) _phoneNumber = data['phone'];
        if (data['role'] != null) _profileRole = data['role'];
        
        await _saveAuthData();
        notifyListeners();
        
        if (kDebugMode) {
          print('💾 [AUTH] Profile data saved to secure storage');
          print('🔔 [AUTH] Listeners notified');
        }
        
        return {
          'success': true,
          'message': 'Profile updated successfully',
          'data': data,
        };
      } else {
        if (kDebugMode) {
          print('❌ [AUTH] Failed to update profile: ${response.message}');
        }
        return {
          'success': false,
          'message': response.message,
        };
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ [AUTH] Error updating profile: $e');
      }
      return {
        'success': false,
        'message': 'Failed to update profile: $e',
      };
    }
  }
}
