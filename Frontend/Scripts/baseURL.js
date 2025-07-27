// Dynamic base URL configuration for different deployment environments
const getBaseURL = () => {
    // Check if running in a browser environment
    if (typeof window !== 'undefined') {
        // Priority 1: Environment variable (if available)
        const envBaseURL = window.REACT_APP_API_BASE_URL || window.API_BASE_URL;
        if (envBaseURL) {
            return envBaseURL;
        }
        
        // Priority 2: Current domain and port for same-server deployment
        const { protocol, hostname, port } = window.location;
        
        // If accessing via standard HTTP/HTTPS ports or custom port
        if (port && port !== '80' && port !== '443') {
            return `${protocol}//${hostname}:${port}`;
        } else {
            return `${protocol}//${hostname}`;
        }
    }
    
    // Fallback for Node.js or non-browser environments
    return process.env.API_BASE_URL || 'http://localhost:8080';
};

// Base URL for API endpoints
export const baseURL = getBaseURL();

// Log the detected base URL for debugging
if (typeof window !== 'undefined') {
    console.log('iTABAZA API Base URL:', baseURL);
}

// API endpoints
export const API_ENDPOINTS = {
    // User endpoints
    USER_LOGIN: `${baseURL}/user/login`,
    USER_REGISTER: `${baseURL}/user/register`,
    USER_PROFILE: `${baseURL}/user/profile`,
    
    // Doctor endpoints
    DOCTOR_ALL: `${baseURL}/doctor/allDoctor`,
    DOCTOR_AVAILABLE: `${baseURL}/doctor/availableDoctors`,
    DOCTOR_BY_ID: (id) => `${baseURL}/doctor/${id}`,
    DOCTOR_BY_DEPARTMENT: (deptId) => `${baseURL}/doctor/allDoctor/${deptId}`,
    DOCTOR_LOGIN: `${baseURL}/doctor/login`,
    DOCTOR_APPOINTMENTS: (doctorId) => `${baseURL}/doctor/appointments/${doctorId}`,
    DOCTOR_STATS: (doctorId) => `${baseURL}/doctor/stats/${doctorId}`,
    DOCTOR_UPLOAD_DOCUMENT: `${baseURL}/doctor/upload-document`,
    
    // Department endpoints
    DEPARTMENT_ALL: `${baseURL}/department/all`,
    DEPARTMENT_BY_ID: (id) => `${baseURL}/department/${id}`,
    
    // Appointment endpoints
    APPOINTMENT_CREATE: (doctorId) => `${baseURL}/appointment/create/${doctorId}`,
    APPOINTMENT_ALL: `${baseURL}/appointment/allApp`,
    APPOINTMENT_BY_ID: (id) => `${baseURL}/appointment/getApp/${id}`,
    APPOINTMENT_CHECK_SLOT: (doctorId) => `${baseURL}/appointment/checkSlot/${doctorId}`,
    
    // Enhanced appointment endpoints
    ENHANCED_APPOINTMENT_CREATE: (doctorId) => `${baseURL}/enhanced-appointment/create/${doctorId}`,
    ENHANCED_APPOINTMENT_UPDATE_PAYMENT: (appointmentId) => `${baseURL}/enhanced-appointment/update-payment/${appointmentId}`,
    ENHANCED_APPOINTMENT_BY_TYPE: (consultationType) => `${baseURL}/enhanced-appointment/by-type/${consultationType}`,
    ENHANCED_APPOINTMENT_STATS: `${baseURL}/enhanced-appointment/stats`,
    ENHANCED_APPOINTMENT_AVAILABLE_SLOTS: (doctorId, date) => `${baseURL}/enhanced-appointment/available-slots/${doctorId}/${date}`,
    ENHANCED_APPOINTMENT_DETAILS: (appointmentId) => `${baseURL}/enhanced-appointment/details/${appointmentId}`,
    
    // Admin endpoints
    ADMIN_DASHBOARD: `${baseURL}/admin/dashboard`,
    ADMIN_APPOINTMENTS: `${baseURL}/admin/appointments`,
    
    // Health check
    HEALTH_CHECK: `${baseURL}/api/health`
};

// Helper function to get auth headers
export const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

// Helper function to handle API responses
export const handleApiResponse = async (response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};

// Helper function to make API requests
export const apiRequest = async (url, options = {}) => {
    const defaultOptions = {
        headers: getAuthHeaders(),
        ...options
    };
    
    const response = await fetch(url, defaultOptions);
    return handleApiResponse(response);
};