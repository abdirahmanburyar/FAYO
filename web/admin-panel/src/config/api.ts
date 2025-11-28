// API Configuration for Admin Panel
// Force HTTP for development - HTTPS disabled

// Helper function to get service URL (reads env vars at runtime)
const getServiceUrl = (servicePath: string, directPort: string): string => {
  // Always use direct HTTP URL for development
  // Check if we're in browser (client-side)
  if (typeof window !== 'undefined') {
    // Client-side: use NEXT_PUBLIC_ env variable
    const envKey = `NEXT_PUBLIC_${servicePath.toUpperCase().replace('-', '_')}_SERVICE_URL`;
    return process.env[envKey] || `http://localhost:${directPort}`;
  } else {
    // Server-side: use environment variable (read at runtime)
    const envKey = `${servicePath.toUpperCase().replace('-', '_')}_SERVICE_URL`;
    // Read from process.env at runtime, not at module load time
    const envValue = process.env[envKey];
    if (envValue) {
      return envValue;
    }
    // Default to Docker service name for server-side calls
    // Use the servicePath as-is (e.g., 'user-service' -> 'user-service')
    return `http://${servicePath}:${directPort}`;
  }
};

// Call service and WebSocket functionality have been removed

// Use getter functions to read env vars at runtime
export const API_CONFIG = {
  get USER_SERVICE_URL() {
    return getServiceUrl('user-service', '3001');
  },
  get HOSPITAL_SERVICE_URL() {
    return getServiceUrl('hospital-service', '3002');
  },
  get DOCTOR_SERVICE_URL() {
    return getServiceUrl('doctor-service', '3003');
  },
  get APPOINTMENT_SERVICE_URL() {
    return getServiceUrl('appointment-service', '3005');
  },
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
