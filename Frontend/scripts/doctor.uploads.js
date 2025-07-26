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

function validateFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/jpg'];

    if (file.size > maxSize) {
        swal("Error", `File ${file.name} is too large. Maximum size is 10MB.`, "error");
        return false;
    }

    if (!allowedTypes.includes(file.type)) {
        swal("Error", `File type ${file.type} is not supported.`, "error");
        return false;
    }

      return true;
}

async function loadDocuments() {
    try {
        const doctor = getCurrentDoctor();
                if (!doctor) return;
        
                // For now, show sample documents since we need to implement the backend
                const sampleDocuments = [
                    {
                id: 1,
                name: 'Medical_Certificate.pdf',
                type: 'pdf',
                size: '2.5 MB',
                uploadDate: '2024-01-15',
                url: '#'
            },
            {
                id: 2,
                name: 'Patient_Report.docx',
                type: 'document',
                size: '1.2 MB',
                uploadDate: '2024-01-14',
                url: '#'
                },
            {
                id: 3,
                name: 'X-Ray_Image.jpg',
                type: 'image',
                size: '3.8 MB',
                uploadDate: '2024-01-13',
                url: '#'
            }
        ];
        
        displayDocuments(sampleDocuments);
        
    } catch (error) {
        console.error('Error loading documents:', error);
        document.getElementById('documentsGrid').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load documents</p>
            </div>
             `;
    }
}

function displayDocuments(documents) {
    const container = document.getElementById('documentsGrid');
    
    if (!documents || documents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
             <i class="fas fa-folder-open"></i>
                <p>No documents found</p>
            </div>
        `;
        return;