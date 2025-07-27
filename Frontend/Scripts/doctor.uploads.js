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
    }

    container.innerHTML = documents.map(doc => `
        <div class="document-card" data-type="${doc.type}">
            <div class="document-icon">
                <i class="fas ${getDocumentIcon(doc.type)}"></i>
            </div>
            <div class="document-info">
                <h4>${doc.name}</h4>
                <p>Size: ${doc.size}</p>
                <p>Uploaded: ${doc.uploadDate}</p>
            </div>
            <div class="document-actions">
                <button class="action-btn view-btn" onclick="viewDocument('${doc.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn download-btn" onclick="downloadDocument('${doc.id}')">
                    <i class="fas fa-download"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteDocument('${doc.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function getDocumentIcon(type) {
    switch (type) {
        case 'pdf': return 'fa-file-pdf';
        case 'document': return 'fa-file-word';
        case 'image': return 'fa-file-image';
        default: return 'fa-file';
    }
}

function filterDocuments() {
    const filterValue = document.getElementById('filterType').value;
    const documentCards = document.querySelectorAll('.document-card');
    
    documentCards.forEach(card => {
        const cardType = card.getAttribute('data-type');
        if (filterValue === 'all' || cardType === filterValue) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

async function searchPatientDocuments() {
    const searchTerm = document.getElementById('patientSearch').value.trim();
    
    if (!searchTerm) {
        swal("Error", "Please enter a patient name to search", "error");
        return;
    }

    try {
        swal("Searching...", "Looking for patient documents", "info", {
            buttons: false,
            closeOnEsc: false,
            closeOnClickOutside: false,
        });

        // For now, show sample patient documents
        const samplePatientDocs = [
            {
                patientName: searchTerm,
                documents: [
                    { name: 'Medical_History.pdf', date: '2024-01-10' },
                    { name: 'Lab_Results.pdf', date: '2024-01-08' },
                    { name: 'Prescription.pdf', date: '2024-01-05' }
                ]
            }
        ];

        swal.close();
        displayPatientDocuments(samplePatientDocs);
        
    } catch (error) {
        console.error('Error searching patient documents:', error);
        swal("Error", "Failed to search patient documents", "error");
    }
}

function displayPatientDocuments(patientData) {
    const container = document.getElementById('patientDocumentsList');
    
    if (!patientData || patientData.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>No documents found for this patient</p>
            </div>
        `;
        return;
    }

    container.innerHTML = patientData.map(patient => `
        <div class="patient-section">
            <h3>Documents for ${patient.patientName}</h3>
            <div class="patient-documents">
                ${patient.documents.map(doc => `
                    <div class="patient-document-item">
                        <div class="document-info">
                            <i class="fas fa-file-pdf"></i>
                            <span>${doc.name}</span>
                        </div>
                        <div class="document-date">
                            ${doc.date}
                        </div>
                        <div class="document-actions">
                            <button class="action-btn view-btn">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-btn download-btn">
                                <i class="fas fa-download"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Global functions for document actions
window.viewDocument = function(docId) {
    swal("View Document", "Document viewer coming soon!", "info");
};

window.downloadDocument = function(docId) {
    swal("Download", "Document download starting...", "success", { timer: 1500 });
};

window.deleteDocument = function(docId) {
    swal({
        title: "Are you sure?",
        text: "This document will be permanently deleted",
        icon: "warning",
        buttons: true,
        dangerMode: true,
    }).then((willDelete) => {
        if (willDelete) {
            swal("Deleted!", "Document has been deleted", "success");
            loadDocuments(); // Reload documents
        }
    });
};
