class AppConstants {
  // App Info
  static const String appName = "FAYO Healthcare";
  static const String appVersion = "1.0.0";
  
  // Storage Keys
  static const String tokenKey = "auth_token";
  static const String refreshTokenKey = "refresh_token";
  static const String userKey = "user_data";
  static const String isLoggedInKey = "is_logged_in";
  
  // Pagination
  static const int defaultPageSize = 10;
  static const int hospitalsPageSize = 5;
  
  // Timeouts
  static const int connectionTimeout = 30000; // 30 seconds
  static const int receiveTimeout = 30000; // 30 seconds
  
  // WebSocket
  static const int websocketReconnectDelay = 5000; // 5 seconds
  static const int websocketPingInterval = 30000; // 30 seconds
  
  // OTP
  static const int otpLength = 6;
  static const int otpResendDelay = 60; // seconds
  
  // Date Formats
  static const String dateFormat = "yyyy-MM-dd";
  static const String timeFormat = "HH:mm";
  static const String dateTimeFormat = "yyyy-MM-dd HH:mm:ss";
  
  // Appointment
  static const int defaultAppointmentDuration = 30; // minutes
  static const String defaultConsultationType = "IN_PERSON";
  
  // Payment
  static const String defaultCurrency = "USD";
  
  // Agora RTC
  static const int agoraTokenExpiry = 3600; // 1 hour in seconds
}

