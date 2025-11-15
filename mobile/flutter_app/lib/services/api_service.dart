import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

class ApiService {
  static const String baseUrl = ApiConfig.baseUrl;
  
  // Headers for API requests
  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Headers with authorization token
  Map<String, String> _headersWithAuth(String token) => {
    ..._headers,
    'Authorization': 'Bearer $token',
  };


  // Send OTP to phone number
  Future<ApiResponse> sendOtp(String phoneNumber) async {
    try {
      const url = '$baseUrl/otp/generate';
      final requestBody = {
        'phone': phoneNumber,
      };
      
      print('📤 [API] Sending OTP generation request');
      print('   🌐 URL: $url');
      print('   📱 Phone: $phoneNumber');
      print('   📦 Request Body: ${jsonEncode(requestBody)}');
      
      final response = await http.post(
        Uri.parse(url),
        headers: _headers,
        body: jsonEncode(requestBody),
      ).timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          throw Exception('Request timeout after 30 seconds');
        },
      );

      print('📡 [API] OTP generation response received');
      print('   📊 Status Code: ${response.statusCode}');
      print('   📄 Response Body: ${response.body}');

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        print('✅ [API] OTP generation successful');
        return ApiResponse(
          success: true,
          message: data['message'] ?? 'OTP sent successfully',
          data: data,
        );
      } else {
        print('❌ [API] OTP generation failed');
        // Handle both string and array error messages
        String errorMessage = 'Failed to send OTP';
        if (data['message'] != null) {
          if (data['message'] is List) {
            errorMessage = (data['message'] as List).join(', ');
          } else {
            errorMessage = data['message'].toString();
          }
        }
        return ApiResponse(
          success: false,
          message: errorMessage,
          data: data,
        );
      }
    } catch (e) {
      print('❌ [API] Network error during OTP generation: $e');
      return ApiResponse(
        success: false,
        message: 'Network error: $e',
        data: null,
      );
    }
  }

  // Verify OTP
  Future<ApiResponse> verifyOtp(String phoneNumber, String otp) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/otp/verify'),
        headers: _headers,
        body: jsonEncode({
          'phone': phoneNumber,
          'otp': otp,
        }),
      );

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        return ApiResponse(
          success: true,
          message: data['message'] ?? 'OTP verified successfully',
          data: data,
        );
      } else {
        return ApiResponse(
          success: false,
          message: data['message'] ?? 'Invalid OTP',
          data: data,
        );
      }
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Network error: $e',
        data: null,
      );
    }
  }

  // Login with OTP
  Future<ApiResponse> loginWithOtp(String phoneNumber, String otp) async {
    try {
      const url = '$baseUrl/auth/login/otp';
      final requestBody = {
        'phone': phoneNumber,
        'code': otp,
      };
      
      print('🔍 [API] Sending OTP verification request');
      print('   🌐 URL: $url');
      print('   📱 Phone: $phoneNumber');
      print('   🔢 OTP: $otp');
      print('   📦 Request Body: ${jsonEncode(requestBody)}');
      
      final response = await http.post(
        Uri.parse(url),
        headers: _headers,
        body: jsonEncode(requestBody),
      ).timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          throw Exception('Request timeout after 30 seconds');
        },
      );

      print('📡 [API] OTP verification response received');
      print('   📊 Status Code: ${response.statusCode}');
      print('   📄 Response Body: ${response.body}');

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        print('✅ [API] OTP verification successful');
        return ApiResponse(
          success: true,
          message: data['message'] ?? 'Login successful',
          data: data,
        );
      } else {
        print('❌ [API] OTP verification failed');
        // Handle both string and array error messages
        String errorMessage = 'Login failed';
        if (data['message'] != null) {
          if (data['message'] is List) {
            errorMessage = (data['message'] as List).join(', ');
          } else {
            errorMessage = data['message'].toString();
          }
        }
        return ApiResponse(
          success: false,
          message: errorMessage,
          data: data,
        );
      }
    } catch (e) {
      print('❌ [API] Network error during OTP verification: $e');
      return ApiResponse(
        success: false,
        message: 'Network error: $e',
        data: null,
      );
    }
  }

  // Check OTP status
  Future<ApiResponse> checkOtpStatus(String phoneNumber) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/otp/status/$phoneNumber'),
        headers: _headers,
      );

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        return ApiResponse(
          success: true,
          message: 'OTP status retrieved',
          data: data,
        );
      } else {
        return ApiResponse(
          success: false,
          message: data['message'] ?? 'Failed to check OTP status',
          data: data,
        );
      }
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Network error: $e',
        data: null,
      );
    }
  }

  // Get user profile
  Future<ApiResponse> getUserProfile(String token) async {
    try {
      print('👤 [API] Fetching user profile...');
      print('   🎫 Token: ${token.substring(0, 20)}...');
      print('   📋 Headers: ${_headersWithAuth(token)}');
      
      final response = await http.get(
        Uri.parse('$baseUrl/users/profile/me'),
        headers: _headersWithAuth(token),
      ).timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          throw Exception('Request timeout after 30 seconds');
        },
      );

      print('📡 [API] Profile response received');
      print('   📊 Status Code: ${response.statusCode}');
      print('   📄 Response Body: ${response.body}');

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        return ApiResponse(
          success: true,
          message: 'Profile retrieved successfully',
          data: data,
        );
      } else {
        return ApiResponse(
          success: false,
          message: _extractErrorMessage(data),
          data: data,
        );
      }
    } catch (e) {
      print('❌ [API] Error fetching profile: $e');
      return ApiResponse(
        success: false,
        message: 'Network error: $e',
        data: null,
      );
    }
  }

  // Refresh token
  Future<ApiResponse> refreshToken(String refreshToken) async {
    try {
      print('🔄 [API] Refreshing token...');
      print('   🔄 Refresh Token: ${refreshToken.substring(0, 20)}...');
      
      final response = await http.post(
        Uri.parse('$baseUrl/auth/refresh'),
        headers: _headers,
        body: jsonEncode({
          'refreshToken': refreshToken,
        }),
      ).timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          throw Exception('Request timeout after 30 seconds');
        },
      );

      print('📡 [API] Token refresh response received');
      print('   📊 Status Code: ${response.statusCode}');
      print('   📄 Response Body: ${response.body}');

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        return ApiResponse(
          success: true,
          message: 'Token refreshed successfully',
          data: data,
        );
      } else {
        return ApiResponse(
          success: false,
          message: data['message'] ?? 'Failed to refresh token',
          data: data,
        );
      }
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Network error: $e',
        data: null,
      );
    }
  }

  // Update user profile
  Future<ApiResponse> updateUserProfile(String token, Map<String, dynamic> profileData) async {
    try {
      print('👤 [API] Updating user profile...');
      print('   🎫 Token: ${token.substring(0, 20)}...');
      print('   📦 Profile Data: $profileData');
      
      final response = await http.patch(
        Uri.parse('$baseUrl/users/profile/me'),
        headers: _headersWithAuth(token),
        body: jsonEncode(profileData),
      ).timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          throw Exception('Request timeout after 30 seconds');
        },
      );

      print('📡 [API] Profile update response received');
      print('   📊 Status Code: ${response.statusCode}');
      print('   📄 Response Body: ${response.body}');

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        return ApiResponse(
          success: true,
          message: 'Profile updated successfully',
          data: data,
        );
      } else if (response.statusCode == 400) {
        return ApiResponse(
          success: false,
          message: 'Validation error: ${_extractErrorMessage(data)}',
          data: data,
        );
      } else if (response.statusCode == 409) {
        return ApiResponse(
          success: false,
          message: 'Conflict: ${_extractErrorMessage(data)}',
          data: data,
        );
      } else if (response.statusCode == 404) {
        return ApiResponse(
          success: false,
          message: 'User not found',
          data: data,
        );
      } else {
        return ApiResponse(
          success: false,
          message: _extractErrorMessage(data),
          data: data,
        );
      }
    } catch (e) {
      print('❌ [API] Error updating profile: $e');
      return ApiResponse(
        success: false,
        message: 'Network error: $e',
        data: null,
      );
    }
  }

  String _extractErrorMessage(dynamic errorData) {
    if (errorData is Map<String, dynamic>) {
      if (errorData['message'] is String) {
        return errorData['message'];
      } else if (errorData['message'] is List) {
        return errorData['message'].join(', ');
      } else if (errorData['error'] is String) {
        return errorData['error'];
      }
    }
    return 'An error occurred';
  }

}

class ApiResponse {
  final bool success;
  final String message;
  final dynamic data;

  ApiResponse({
    required this.success,
    required this.message,
    this.data,
  });
}