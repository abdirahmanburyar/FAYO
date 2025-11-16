class ApiConfig {
  // Production VPS IP address - User Service endpoint (direct connection, no gateway)
  static const String baseUrl = 'http://31.97.58.62:3001/api/v1';
  
  // Alternative IPs for development:
  // static const String baseUrl = 'http://10.0.2.2:3001/api/v1'; // For Android emulator
  // static const String baseUrl = 'http://localhost:3001/api/v1'; // For web/desktop
  
  // Timeout settings
  static const Duration connectTimeout = Duration(seconds: 10);
  static const Duration receiveTimeout = Duration(seconds: 30);
  
  // JWT Configuration
  static const String jwtSecret = 'your-super-secret-jwt-key-change-in-production-fayo-healthcare-2024';
}
