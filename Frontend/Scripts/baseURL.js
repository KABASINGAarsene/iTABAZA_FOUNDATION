// Base URL for API endpoints
export const baseURL = 'http://localhost:8080';

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