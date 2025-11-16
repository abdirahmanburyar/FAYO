// API Configuration for Admin Panel
export const API_CONFIG = {
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || 'http://31.97.58.62:3001',
  HOSPITAL_SERVICE_URL: process.env.HOSPITAL_SERVICE_URL || 'http://31.97.58.62:3002',
  DOCTOR_SERVICE_URL: process.env.DOCTOR_SERVICE_URL || 'http://31.97.58.62:3003',
  SHARED_SERVICE_URL: process.env.SHARED_SERVICE_URL || 'http://31.97.58.62:3004',
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
