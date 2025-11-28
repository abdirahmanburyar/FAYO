// API Configuration for Admin Panel
// Force HTTP for development - HTTPS disabled

// Helper function to get service URL
const getServiceUrl = (servicePath: string, directPort: string): string => {
  // Always use direct HTTP URL for development
  // Check if we're in browser (client-side)
  if (typeof window !== 'undefined') {
    // Development/HTTP: use direct URL or env variable
    const envKey = `NEXT_PUBLIC_${servicePath.toUpperCase().replace('-', '_')}_SERVICE_URL`;
    return process.env[envKey] || `http://localhost:${directPort}`;
  } else {
    // Server-side: use environment variable or direct URL
    const envKey = `${servicePath.toUpperCase().replace('-', '_')}_SERVICE_URL`;
    return process.env[envKey] || `http://localhost:${directPort}`;
  }
};

// Call service and WebSocket functionality have been removed

export const API_CONFIG = {
  USER_SERVICE_URL: getServiceUrl('user-service', '3001'),
  HOSPITAL_SERVICE_URL: getServiceUrl('hospital-service', '3002'),
  DOCTOR_SERVICE_URL: getServiceUrl('doctor-service', '3003'),
  APPOINTMENT_SERVICE_URL: getServiceUrl('appointment-service', '3005'),
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
