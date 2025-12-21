class ApiConstants {
  // Base configuration
  static const bool useHttps = false; // Set to true for production with HTTPS
  static const String baseHost = "72.62.51.50"; // Production server IP
  
  // For production with HTTPS, you might use a domain name instead of IP
  // Example: static const String baseHost = "api.yourdomain.com";
  
  static String get protocol => useHttps ? "https" : "http";
  
  // Unified API Service URL (all services now on port 3001)
  static String get apiBaseUrl => "$protocol://$baseHost:3001/api/v1";
  
  // Service URLs (all pointing to unified API service)
  static String get userBaseUrl => apiBaseUrl;
  static String get hospitalBaseUrl => apiBaseUrl;
  static String get appointmentBaseUrl => apiBaseUrl;
  static String get doctorBaseUrl => apiBaseUrl;
  static String get paymentBaseUrl => apiBaseUrl;
  static String get adsBaseUrl => apiBaseUrl;
  
  // WebSocket URLs (unified API service)
  // Note: Hospital WebSocket may not be implemented yet
  static String get hospitalWebSocketUrl {
    final base = apiBaseUrl.replaceFirst("/api/v1", "");
    return base.replaceFirst("http", "ws").replaceFirst("https", "wss") + "/ws/hospitals";
  }
  
  static String get appointmentWebSocketUrl {
    final base = apiBaseUrl.replaceFirst("/api/v1", "");
    return base.replaceFirst("http", "ws").replaceFirst("https", "wss") + "/api/v1/ws/appointments";
  }
  
  static String get adsWebSocketUrl {
    final base = apiBaseUrl.replaceFirst("/api/v1", "");
    return base.replaceFirst("http", "ws").replaceFirst("https", "wss") + "/api/v1/ws/ads";
  }
  
  // Auth Endpoints
  static String get sendOtpEndpoint => "$userBaseUrl/otp/generate";
  static String get verifyOtpEndpoint => "$userBaseUrl/auth/login/otp";
  static String get userProfileEndpoint => "$userBaseUrl/users/profile/me";
  
  // Hospital Endpoints
  static String get hospitalsEndpoint => "$hospitalBaseUrl/hospitals";
  static String hospitalByIdEndpoint(String id) => "$hospitalBaseUrl/hospitals/$id";
  static String hospitalDoctorsEndpoint(String hospitalId) => 
      "$hospitalBaseUrl/hospitals/$hospitalId/doctors";
  
  // Doctor Endpoints
  static String get doctorsEndpoint => "$apiBaseUrl/doctors";
  static String doctorByIdEndpoint(String id) => "$apiBaseUrl/doctors/$id";
  
  // Appointment Endpoints
  static String get appointmentsEndpoint => "$appointmentBaseUrl/appointments";
  static String callAcceptEndpoint(String appointmentId) => 
      "$appointmentBaseUrl/calls/$appointmentId/accept";
  static String participantCredentialsEndpoint(String appointmentId) => 
      "$appointmentBaseUrl/calls/participant/$appointmentId";
  
  // Payment Endpoints
  static String qrCodeEndpoint(String appointmentId) => 
      "$paymentBaseUrl/waafipay/appointment/$appointmentId/qr";
  static String get initiatePaymentEndpoint => "$paymentBaseUrl/waafipay/initiate";
  static String paymentStatusEndpoint(String paymentId) => 
      "$paymentBaseUrl/waafipay/status/$paymentId";
  static String get ussdInfoEndpoint => "$paymentBaseUrl/waafipay/ussd-info";
  
  // Ads Endpoints
  static String get activeAdsEndpoint => "$adsBaseUrl/ads/active";
  static String adViewEndpoint(String adId) => "$adsBaseUrl/ads/$adId/view";
  static String adClickEndpoint(String adId) => "$adsBaseUrl/ads/$adId/click";
}

