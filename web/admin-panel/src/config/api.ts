// API Configuration for Admin Panel
// Force HTTP for development - HTTPS disabled

// Helper function to get service URL (reads env vars at runtime)
const getServiceUrl = (servicePath: string, directPort: string): string => {
  // Check if we're in browser (client-side)
  if (typeof window !== 'undefined') {
    // Client-side: use NEXT_PUBLIC_ env variable (available at build time)
    const envKey = `NEXT_PUBLIC_${servicePath.toUpperCase().replace('-', '_')}_SERVICE_URL`;
    const envValue = process.env[envKey];
    
    if (envValue) {
      return envValue;
    }
    
    // Fallback: construct URL from current window location
    // This works in production when env vars might not be set at build time
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      // Production: use same hostname as the current page
      return `http://${window.location.hostname}:${directPort}`;
    }
    
    // Development fallback
    return `http://localhost:${directPort}`;
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
  get SPECIALTY_SERVICE_URL() {
    return getServiceUrl('specialty-service', '3004');
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
