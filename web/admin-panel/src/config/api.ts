// API Configuration for Admin Panel
// When accessed via HTTPS, services are proxied through nginx to avoid mixed content
// When accessed via HTTP (development), services are accessed directly

// Helper function to get service URL
const getServiceUrl = (servicePath: string, directPort: string): string => {
  // Check if we're in browser (client-side)
  if (typeof window !== 'undefined') {
    const isHTTPS = window.location.protocol === 'https:';
    const baseUrl = window.location.origin;
    
    if (isHTTPS) {
      // Use nginx proxy route (HTTPS) - removes mixed content issues
      return `${baseUrl}/api/${servicePath}`;
    } else {
      // Development/HTTP: use direct URL or env variable
      const envKey = `NEXT_PUBLIC_${servicePath.toUpperCase().replace('-', '_')}_SERVICE_URL`;
      return process.env[envKey] || `http://31.97.58.62:${directPort}`;
    }
  } else {
    // Server-side: use environment variable or direct URL
    const envKey = `${servicePath.toUpperCase().replace('-', '_')}_SERVICE_URL`;
    return process.env[envKey] || `http://31.97.58.62:${directPort}`;
  }
};

// Get WebSocket URL for call service
const getWebSocketUrl = (): string => {
  if (typeof window !== 'undefined') {
    const isHTTPS = window.location.protocol === 'https:';
    const protocol = isHTTPS ? 'wss:' : 'ws:';
    const host = window.location.host;
    
    if (isHTTPS) {
      // Use nginx WebSocket proxy (WSS)
      return `${protocol}//${host}/ws/calls`;
    } else {
      // Development: direct WebSocket connection
      return `ws://31.97.58.62:3010/ws/calls`;
    }
  } else {
    // Server-side: not applicable
    return '';
  }
};

export const API_CONFIG = {
  USER_SERVICE_URL: getServiceUrl('user-service', '3001'),
  HOSPITAL_SERVICE_URL: getServiceUrl('hospital-service', '3002'),
  DOCTOR_SERVICE_URL: getServiceUrl('doctor-service', '3003'),
  SHARED_SERVICE_URL: getServiceUrl('shared-service', '3004'),
  CALL_SERVICE_URL: getServiceUrl('call-service', '3010'),
  CALL_WEBSOCKET_URL: getWebSocketUrl(),
  ENDPOINTS: {
    ADMIN_LOGIN: '/api/v1/auth/admin-login',
    USERS: '/api/v1/users',
    HOSPITALS: '/api/v1/hospitals',
    DOCTORS: '/api/v1/doctors',
    SPECIALTIES: '/api/v1/specialties',
    APPOINTMENTS: '/api/v1/appointments',
    REPORTS: '/api/v1/reports',
  },
};
