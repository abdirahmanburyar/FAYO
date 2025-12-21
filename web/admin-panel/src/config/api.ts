// API Configuration for Admin Panel
// Unified API Service - All endpoints now use api-service on port 3001

// Helper function to get unified API service URL
const getApiServiceUrl = (): string => {
  // Check if we're in browser (client-side)
  if (typeof window !== 'undefined') {
    // Client-side: use NEXT_PUBLIC_API_URL env variable
    const envValue = process.env.NEXT_PUBLIC_API_URL;
    if (envValue) {
      // Remove /api/v1 suffix if present, we'll add it per endpoint
      return envValue.replace('/api/v1', '');
    }
    
    // Fallback: construct URL from current window location
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      // Production: use same hostname as the current page
      return `http://${window.location.hostname}:3001`;
    }
    
    return 'http://localhost:3001';
  } else {
    // Server-side: use API_SERVICE_URL environment variable (read at runtime)
    const envValue = process.env.API_SERVICE_URL;
    if (envValue) {
      return envValue;
    }
    
    // Default to Docker service name for server-side calls
    return 'http://api-service:3001';
  }
};

// Unified API service URL getter
const API_SERVICE_URL = getApiServiceUrl();

// Use getter functions for backward compatibility - all now point to unified api-service
export const API_CONFIG = {
  get USER_SERVICE_URL() {
    return API_SERVICE_URL;
  },
  get HOSPITAL_SERVICE_URL() {
    return API_SERVICE_URL;
  },
  get DOCTOR_SERVICE_URL() {
    return API_SERVICE_URL;
  },
  get APPOINTMENT_SERVICE_URL() {
    return API_SERVICE_URL;
  },
  get SPECIALTY_SERVICE_URL() {
    return API_SERVICE_URL;
  },
  get ADS_SERVICE_URL() {
    return API_SERVICE_URL;
  },
  get PAYMENT_SERVICE_URL() {
    return API_SERVICE_URL;
  },
  ENDPOINTS: {
    ADMIN_LOGIN: '/api/v1/auth/admin-login',
    USERS: '/api/v1/users',
    HOSPITALS: '/api/v1/hospitals',
    DOCTORS: '/api/v1/doctors',
    SPECIALTIES: '/api/v1/specialties',
    APPOINTMENTS: '/api/v1/appointments',
    ADS: '/api/v1/ads',
    REPORTS: '/api/v1/reports',
  },
};
