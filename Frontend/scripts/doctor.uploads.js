import { baseURL, getAuthHeaders, handleApiResponse } from './baseURL.js';
import { logoutDoctor, getCurrentDoctor, isDoctorAuthenticated } from './doctor.login.js';

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!isDoctorAuthenticated()) {
            window.location.href = './unified-login.html';
            return;
        }
    
    // Initialize the page
    initializePage();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load documents
    loadDocuments();
});

function initializePage() {
    const doctor = getCurrentDoctor();
    if (doctor) {
        document.getElementById('doctorName').textContent = doctor.doctor_name || 'Dr. Unknown';
        document.getElementById('doctorEmail').textContent = doctor.email || 'unknown@email.com';
        }
}

function setupEventListeners() {
    // Logout button