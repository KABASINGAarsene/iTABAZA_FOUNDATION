import { baseURL, handleApiResponse, getAuthHeaders } from './baseURL.js';

// Doctor-specific authentication functions
function getDoctorAuthHeaders() {
    const token = localStorage.getItem('doctorToken') || sessionStorage.getItem('doctorToken');
    return {
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}

function getCurrentDoctorFromStorage() {
    const doctorInfo = localStorage.getItem('doctorInfo') || sessionStorage.getItem('doctorInfo');
    return doctorInfo ? JSON.parse(doctorInfo) : null;
}

document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const patientItems = document.querySelectorAll('.patient-item');
    const selectedPatientInput = document.getElementById('selectedPatient');
    const patientIdInput = document.getElementById('patientId');
    const documentFileInput = document.getElementById('documentFile');
    const fileDisplay = document.getElementById('fileDisplay');
    const alertMessage = document.getElementById('alertMessage');
    const uploadBtn = document.getElementById('uploadBtn');

    // Load doctor info from storage or set fallback for testing
    const doctorInfo = getCurrentDoctorFromStorage() || {
        id: 'sample-doctor-id',
        doctor_name: 'Dr. Sample User',
        name: 'Dr. Sample User',
        email: 'sample.doctor@hospital.com'
    };

    // Load patients list
    loadPatientsList();

    // Patient selection
    patientItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove selection from all items
            patientItems.forEach(i => i.classList.remove('selected'));
            
            // Add selection to clicked item
            this.classList.add('selected');
            
            // Update form fields
            const patientName = this.querySelector('.patient-name').textContent;
            const patientId = this.dataset.patientId;
            
            selectedPatientInput.value = patientName;
            patientIdInput.value = patientId;
        });
    });

    // File input handling
    documentFileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            fileDisplay.classList.add('has-file');
            fileDisplay.innerHTML = `
                <i class="fas fa-file-alt"></i>
                <p><strong>${file.name}</strong></p>
                <small>Size: ${formatFileSize(file.size)}</small>
            `;
        } else {
            fileDisplay.classList.remove('has-file');
            fileDisplay.innerHTML = `
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Click to select file or drag and drop</p>
                <small>Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 5MB)</small>
            `;
        }
    });

    // Form submission
    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const patientId = patientIdInput.value;
        const documentType = document.getElementById('documentType').value;
        const documentCategory = document.getElementById('documentCategory').value;
        const documentFile = documentFileInput.files[0];
        const description = document.getElementById('description').value;
        const medicalNotes = document.getElementById('medicalNotes').value;
        const doctorComments = document.getElementById('doctorComments').value;

        // Validation
        if (!patientId) {
            showAlert('Please select a patient', 'error');
            return;
        }

        if (!documentType) {
            showAlert('Please select a document type', 'error');
            return;
        }

        if (!documentFile) {
            showAlert('Please select a file to upload', 'error');
            return;
        }

        // File size validation (5MB limit)
        if (documentFile.size > 5 * 1024 * 1024) {
            showAlert('File size must be less than 5MB', 'error');
            return;
        }

        // Prepare form data
        const formData = new FormData();
        formData.append('document', documentFile);
        formData.append('patientId', patientId);
        formData.append('documentType', documentType);
        formData.append('documentCategory', documentCategory);
        formData.append('description', description);
        formData.append('medicalNotes', medicalNotes);
        formData.append('doctorComments', doctorComments);

        try {
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

            const response = await fetch(`${baseURL}/api/dashboard/doctor/${doctorInfo.id}/documents/upload`, {
                method: 'POST',
                headers: getDoctorAuthHeaders(),
                body: formData
            });

            const result = await handleApiResponse(response);

            if (result.success) {
                showAlert('Document uploaded successfully!', 'success');
                uploadForm.reset();
                fileDisplay.classList.remove('has-file');
                fileDisplay.innerHTML = `
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>Click to select file or drag and drop</p>
                    <small>Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 5MB)</small>
                `;
                
                // Clear patient selection
                patientItems.forEach(i => i.classList.remove('selected'));
                selectedPatientInput.value = '';
                patientIdInput.value = '';
            } else {
                showAlert(result.error || 'Upload failed', 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showAlert('Upload failed: ' + error.message, 'error');
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Document';
        }
    });

    // Load patients list from API
    async function loadPatientsList() {
        try {
            const response = await fetch(`${baseURL}/user/get-all-users`, {
                headers: getDoctorAuthHeaders()
            });

            const result = await handleApiResponse(response);

            if (result.success && result.data) {
                renderPatientsList(result.data);
            }
        } catch (error) {
            console.error('Error loading patients:', error);
            // Keep the sample data if API fails
        }
    }

    function renderPatientsList(patients) {
        const patientsList = document.getElementById('patientsList');
        patientsList.innerHTML = '';

        patients.forEach(patient => {
            const patientItem = document.createElement('div');
            patientItem.className = 'patient-item';
            patientItem.dataset.patientId = patient.id;
            patientItem.innerHTML = `
                <div class="patient-name">${patient.first_name} ${patient.last_name}</div>
                <div class="patient-email">${patient.email}</div>
            `;

            patientItem.addEventListener('click', function() {
                // Remove selection from all items
                document.querySelectorAll('.patient-item').forEach(i => i.classList.remove('selected'));
                
                // Add selection to clicked item
                this.classList.add('selected');
                
                // Update form fields
                const patientName = `${patient.first_name} ${patient.last_name}`;
                const patientId = patient.id;
                
                selectedPatientInput.value = patientName;
                patientIdInput.value = patientId;
            });

            patientsList.appendChild(patientItem);
        });
    }

    function showAlert(message, type) {
        alertMessage.textContent = message;
        alertMessage.className = `alert ${type}`;
        alertMessage.style.display = 'block';

        setTimeout(() => {
            alertMessage.style.display = 'none';
        }, 5000);
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
});
