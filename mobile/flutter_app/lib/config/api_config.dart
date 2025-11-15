class ApiConfig {
  // Your actual IP address - Use this for physical devices on the same network
  static const String baseUrl = 'http://10.153.4.69:3001/api/v1';
  
  // Alternative IPs to try if the above doesn't work:
  // static const String baseUrl = 'http://10.0.2.2:3001/api/v1'; // For Android emulator
  // static const String baseUrl = 'http://localhost:3001/api/v1'; // For web/desktop
  
  // Timeout settings
  static const Duration connectTimeout = Duration(seconds: 10);
  static const Duration receiveTimeout = Duration(seconds: 30);
  
  // JWT Configuration
  static const String jwtSecret = 'your-super-secret-jwt-key-change-in-production-fayo-healthcare-2024';
}
