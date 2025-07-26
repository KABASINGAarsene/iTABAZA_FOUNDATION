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
    }

function handleFileSelection(e) {
    const files = Array.from(e.target.files);
    uploadFiles(files);
    }

async function uploadFiles(files) {
    if (!files || files.length === 0) return;

    const doctor = getCurrentDoctor();
        if (!doctor) return;
    
        for (const file of files) {
            if (!validateFile(file)) continue;
            
        try {
            swal("Uploading...", `Uploading ${file.name}`, "info", {
                buttons: false,
                closeOnEsc: false,
                closeOnClickOutside: false,
            });

            const formData = new FormData();
            formData.append('file', file);
            formData.append('doctorId', doctor.id);
                        formData.append('fileName', file.name);
                        formData.append('fileType', file.type);
            
                        const response = await fetch(`${baseURL}/doctor/upload-document`, {
                            method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('doctorToken')}`
                },
                body: formData
                });
                
                            const data = await handleApiResponse(response);
                            
                            swal("Success!", `${file.name} uploaded successfully`, "success", { timer: 2000 });
                            
            // Reload documents
            loadDocuments();
            
        } catch (error) {
            console.error('Upload error:', error);
            swal("Error", `Failed to upload ${file.name}`, "error");
        }
    }
}