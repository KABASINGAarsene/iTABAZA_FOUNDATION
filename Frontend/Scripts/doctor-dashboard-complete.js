import { baseURL, handleApiResponse, getAuthHeaders } from './baseURL.js';
import { logoutDoctor } from './doctor.login.js';

// Doctor-specific authentication functions
function getDoctorAuthHeaders() {
    const token = localStorage.getItem('doctorToken') || sessionStorage.getItem('doctorToken');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}

function getCurrentDoctorFromStorage() {
    const doctorInfo = localStorage.getItem('doctorInfo') || sessionStorage.getItem('doctorInfo');
    return doctorInfo ? JSON.parse(doctorInfo) : null;
}

// Fetch and populate appointments
async function loadAppointments(doctorId) {
    try {
        showAppointmentsLoading();
        console.log('Loading appointments for doctor:', doctorId);
        
        const response = await fetch(`${baseURL}/appointment/doctor/${doctorId}`, {
            method: 'GET',
            headers: getDoctorAuthHeaders()
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('API response:', result);
        
        if (result.success && result.data && result.data.length > 0) {
            renderAppointments(result.data, result.stats);
        } else {
            showNoAppointmentsFound();
            updateStatsToZero();
        }
    } catch (error) {
        console.error('Failed to load appointments:', error);
        showAlert('Failed to load appointments: ' + error.message, 'error');
        showNoAppointmentsFound();
        updateStatsToZero();
    }
}

function showAppointmentsLoading() {
    document.getElementById('appointmentsLoading').style.display = 'block';
    document.getElementById('appointmentsTable').style.display = 'none';
    document.getElementById('noAppointments').style.display = 'none';
}

function renderAppointments(appointments, stats = null) {
    const tableBody = document.getElementById('appointmentsTableBody');
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Calculate stats if not provided
    const calculatedStats = stats || {
        total: appointments.length,
        pending: appointments.filter(app => app.status === 'pending').length,
        confirmed: appointments.filter(app => app.status === 'confirmed').length,
        completed: appointments.filter(app => app.status === 'completed').length,
        cancelled: appointments.filter(app => app.status === 'cancelled').length,
        today: appointments.filter(app => {
            const today = new Date().toISOString().split('T')[0];
            return app.appointment_date === today;
        }).length
    };

    appointments.forEach(appointment => {
        const row = document.createElement('tr');
        const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString();
        const paymentStatus = appointment.payment_status ? 'Paid' : 'Unpaid';
        const paymentClass = appointment.payment_status ? 'text-success' : 'text-warning';
        
        row.innerHTML = `
            <td>${appointmentDate}</td>
            <td>${appointment.slot_time || appointment.appointment_time || 'N/A'}</td>
            <td>${appointment.patient_first_name || 'N/A'}</td>
            <td>${(appointment.problem_description || '').substring(0, 50)}${appointment.problem_description && appointment.problem_description.length > 50 ? '...' : ''}</td>
            <td><span class="status-badge status-${appointment.status}">${appointment.status}</span></td>
            <td class="${paymentClass}">${paymentStatus}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="viewAppointment('${appointment.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="completeAppointment('${appointment.id}')" title="Mark Complete">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="rescheduleAppointment('${appointment.id}')" title="Reschedule">
                        <i class="fas fa-calendar-alt"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="cancelAppointment('${appointment.id}')" title="Cancel">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    updateStats(calculatedStats);
    document.getElementById('appointmentsLoading').style.display = 'none';
    document.getElementById('appointmentsTable').style.display = 'block';
}

function showNoAppointmentsFound() {
    document.getElementById('appointmentsLoading').style.display = 'none';
    document.getElementById('appointmentsTable').style.display = 'none';
    document.getElementById('noAppointments').style.display = 'block';
}

// Update dashboard statistics
function updateStats(stats) {
    document.getElementById('totalAppointments').textContent = stats.total;
    document.getElementById('todayAppointments').textContent = stats.today || 0;
    document.getElementById('pendingAppointments').textContent = stats.pending;
    document.getElementById('completedAppointments').textContent = stats.completed;
}

function updateStatsToZero() {
    updateStats({ total: 0, today: 0, pending: 0, completed: 0 });
}

function showAlert(message, type) {
    const alertMessage = document.getElementById('alertMessage');
    alertMessage.textContent = message;
    alertMessage.className = `alert ${type}`;
    alertMessage.style.display = 'block';

    setTimeout(() => {
        alertMessage.style.display = 'none';
    }, 5000);
}

// Global functions for appointment actions
window.viewAppointment = function(appointmentId) {
    console.log('Viewing appointment:', appointmentId);
    showAlert(`Viewing appointment details for ${appointmentId}`, 'info');
    // TODO: Implement appointment viewing modal
};

window.completeAppointment = async function(appointmentId) {
    try {
        const response = await fetch(`${baseURL}/appointment/approve/${appointmentId}`, {
            method: 'PATCH',
            headers: getDoctorAuthHeaders()
        });
        
        if (response.ok) {
            showAlert('Appointment marked as completed!', 'success');
            const doctorInfo = getCurrentDoctorFromStorage();
            if (doctorInfo) {
                loadAppointments(doctorInfo.id);
            }
        } else {
            throw new Error('Failed to update appointment');
        }
    } catch (error) {
        console.error('Error completing appointment:', error);
        showAlert('Failed to complete appointment', 'error');
    }
};

window.rescheduleAppointment = function(appointmentId) {
    console.log('Rescheduling appointment:', appointmentId);
    showAlert(`Rescheduling appointment ${appointmentId}`, 'warning');
    // TODO: Implement reschedule modal
};

window.cancelAppointment = async function(appointmentId) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
        try {
            const response = await fetch(`${baseURL}/appointment/reject/${appointmentId}`, {
                method: 'DELETE',
                headers: getDoctorAuthHeaders()
            });
            
            if (response.ok) {
                showAlert('Appointment cancelled successfully!', 'success');
                const doctorInfo = getCurrentDoctorFromStorage();
                if (doctorInfo) {
                    loadAppointments(doctorInfo.id);
                }
            } else {
                throw new Error('Failed to cancel appointment');
            }
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            showAlert('Failed to cancel appointment', 'error');
        }
    }
};

// Global refresh function
window.refreshAppointments = function() {
    const doctorInfo = getCurrentDoctorFromStorage();
    if (doctorInfo) {
        loadAppointments(doctorInfo.id);
    }
};

// Load patients for the documents page
async function loadPatientsList() {
    try {
        const response = await fetch(`${baseURL}/user/get-all-users`, {
            headers: getDoctorAuthHeaders()
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                renderPatientsList(result.data);
            }
        }
    } catch (error) {
        console.error('Error loading patients:', error);
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
            
            document.getElementById('selectedPatient').value = patientName;
            document.getElementById('patientId').value = patientId;
        });

        patientsList.appendChild(patientItem);
    });
}

// Document upload functionality
function initializeDocumentUpload() {
    const uploadForm = document.getElementById('uploadForm');
    const documentFileInput = document.getElementById('documentFile');
    const fileDisplay = document.getElementById('fileDisplay');
    const uploadBtn = document.getElementById('uploadBtn');

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
        
        const doctorInfo = getCurrentDoctorFromStorage();
        if (!doctorInfo) {
            showAlert('Doctor information not found. Please login again.', 'error');
            return;
        }

        const patientId = document.getElementById('patientId').value;
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
                headers: {
                    ...getDoctorAuthHeaders(),
                    // Remove Content-Type for FormData to set boundary automatically
                },
                body: formData
            });

            delete formData.headers['Content-Type']; // Let browser set Content-Type for FormData

            if (response.ok) {
                const result = await response.json();
                showAlert('Document uploaded successfully!', 'success');
                uploadForm.reset();
                fileDisplay.classList.remove('has-file');
                fileDisplay.innerHTML = `
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>Click to select file or drag and drop</p>
                    <small>Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 5MB)</small>
                `;
                
                // Clear patient selection
                document.querySelectorAll('.patient-item').forEach(i => i.classList.remove('selected'));
                document.getElementById('selectedPatient').value = '';
                document.getElementById('patientId').value = '';
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showAlert('Upload failed: ' + error.message, 'error');
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Document';
        }
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Initialize current date display
function initializeCurrentDate() {
    const currentDateElement = document.getElementById('currentDate');
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    currentDateElement.textContent = now.toLocaleDateString(undefined, options);
}

// Load doctor profile information
function loadDoctorProfile() {
    const doctorInfo = getCurrentDoctorFromStorage();
    if (doctorInfo) {
        document.getElementById('doctorName').textContent = doctorInfo.doctor_name || doctorInfo.name || 'Dr. Unknown';
        document.getElementById('doctorSpecialty').textContent = doctorInfo.qualifications || 'Medical Doctor';
        
        // Update profile form if on profile page
        if (document.getElementById('profileName')) {
            document.getElementById('profileName').value = doctorInfo.doctor_name || doctorInfo.name || '';
            document.getElementById('profileEmail').value = doctorInfo.email || '';
            document.getElementById('profilePhone').value = doctorInfo.phone_no || '';
            document.getElementById('profileSpecialty').value = doctorInfo.qualifications || '';
            document.getElementById('profileExperience').value = doctorInfo.experience || '';
            document.getElementById('profileCity').value = doctorInfo.city || '';
        }
    }
}

// Global logout function
window.logout = function() {
    if (confirm('Are you sure you want to logout?')) {
        logoutDoctor();
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // Initialize current date
    initializeCurrentDate();
    
    // Load doctor profile
    loadDoctorProfile();
    
    // Load initial data
    const doctorInfo = getCurrentDoctorFromStorage();
    if (doctorInfo && doctorInfo.id) {
        loadAppointments(doctorInfo.id);
        loadPatientsList();
    } else {
        showAlert('Doctor information not found. Please login again.', 'error');
        setTimeout(() => {
            window.location.href = './login.html';
        }, 3000);
        return;
    }

    // Initialize document upload functionality
    initializeDocumentUpload();

    // Navigation functionality
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
    const pageSections = document.querySelectorAll('.page-section');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Hide all page sections
            pageSections.forEach(section => section.classList.remove('active'));
            
            // Show selected page section
            const page = link.dataset.page;
            const targetSection = document.getElementById(page + '-page');
            if (targetSection) {
                targetSection.classList.add('active');
            }

            // Update page title
            document.getElementById('pageTitle').textContent = link.querySelector('span').textContent;
            
            // Load page-specific data
            if (page === 'appointments') {
                loadAppointments(doctorInfo.id);
            } else if (page === 'documents') {
                loadPatientsList();
            }
        });
    });

    // Appointment filter functionality
    const appointmentFilter = document.getElementById('appointmentFilter');
    if (appointmentFilter) {
        appointmentFilter.addEventListener('change', function() {
            const filterValue = this.value;
            const rows = document.querySelectorAll('#appointmentsTableBody tr');
            
            rows.forEach(row => {
                if (filterValue === 'all') {
                    row.style.display = '';
                } else {
                    const statusCell = row.querySelector('.status-badge');
                    if (statusCell && statusCell.textContent.toLowerCase() === filterValue) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                }
            });
        });
    }
});
