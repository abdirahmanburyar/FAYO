class ApiConstants {
  // Base configuration
  static const bool useHttps = false; // Set to true for production with HTTPS
  static const String baseHost = "72.62.51.50"; // Production server IP
  
  // For production with HTTPS, you might use a domain name instead of IP
  // Example: static const String baseHost = "api.yourdomain.com";
  
  static String get protocol => useHttps ? "https" : "http";
  
  // Service URLs
  static String get userBaseUrl => "$protocol://$baseHost:3001/api/v1";
  static String get hospitalBaseUrl => "$protocol://$baseHost:3002/api/v1";
  static String get appointmentBaseUrl => "$protocol://$baseHost:3005/api/v1";
  static String get doctorBaseUrl => "$protocol://$baseHost:3003";
  static String get paymentBaseUrl => "$protocol://$baseHost:3006/api/v1";
  static String get adsBaseUrl => "$protocol://$baseHost:3007/api/v1";
  
  // WebSocket URLs
  static String get hospitalWebSocketUrl => 
      hospitalBaseUrl.replaceFirst("http", "ws").replaceFirst("https", "wss") + "/ws";
  
  static String get appointmentWebSocketUrl {
    final base = appointmentBaseUrl.replaceFirst("/api/v1", "");
    return base.replaceFirst("http", "ws").replaceFirst("https", "wss") + "/api/v1/ws/appointments";
  }
  
  static String get adsWebSocketUrl {
    final base = adsBaseUrl.replaceFirst("/api/v1", "");
    return base.replaceFirst("http", "ws").replaceFirst("https", "wss") + "/ws/ads";
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
  static String get doctorsEndpoint => "$doctorBaseUrl/api/v1/doctors";
  static String doctorByIdEndpoint(String id) => "$doctorBaseUrl/api/v1/doctors/$id";
  
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

