class CallConfig {
  // Call Service base URL (NestJS call-service)
  // Services are accessed directly on their ports (not through nginx proxy)
  // nginx is only used for SSL on the admin panel, not for backend services
  static const String baseUrl = 'http://31.97.58.62:3010/api/v1';

  // Socket.IO endpoint for calls (uses http/https, not ws/wss)
  // Direct access to call service on port 3010
  static const String websocketUrl = 'http://31.97.58.62:3010';
}


