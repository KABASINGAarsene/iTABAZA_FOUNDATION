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
    document.getElementById('logoutBtn').addEventListener('click', function() {
        swal({
            title: "Are you sure?",
            text: "You will be logged out of your account",
            icon: "warning",
            buttons: true,
                        dangerMode: true,
                    }).then((willLogout) => {
                        if (willLogout) {
                            logoutDoctor();
                            }
        });
    });


    // Upload area interactions
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const uploadNewBtn = document.getElementById('uploadNewBtn');
// Browse button
    browseBtn.addEventListener('click', () => fileInput.click());
    uploadNewBtn.addEventListener('click', () => fileInput.click());

    // File input change
    fileInput.addEventListener('change', handleFileSelection);

    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    // Filter documents
    document.getElementById('filterType').addEventListener('change', filterDocuments);

    // Patient search
    document.getElementById('searchPatientBtn').addEventListener('click', searchPatientDocuments);
    document.getElementById('patientSearch').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchPatientDocuments();
            }
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    uploadFiles(files);