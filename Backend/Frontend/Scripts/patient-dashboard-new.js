import { baseURL, handleApiResponse, getAuthHeaders } from './baseURL.js';

// Patient-specific authentication functions
function getPatientAuthHeaders() {
    const token = localStorage.getItem('patientToken') || sessionStorage.getItem('patientToken');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}

function getCurrentPatientFromStorage() {
    const patientInfo = localStorage.getItem('patientInfo') || sessionStorage.getItem('patientInfo');
    return patientInfo ? JSON.parse(patientInfo) : null;
}

document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.sidebar-menu .nav-link');
    const pageContents = document.querySelectorAll('.page-content');
    const patientNameElem = document.getElementById('patientName');
    const patientEmailElem = document.getElementById('patientEmail');
    const appointmentGrid = document.getElementById('appointmentGrid');
    const documentsTableBody = document.getElementById('documentsTableBody');

    const patientInfo = getCurrentPatient();
    if (!patientInfo) {
        console.log('❌ No patient info found, redirecting to login');
        logout();
        return;
    }

    console.log('✅ Patient info loaded:', patientInfo);
    patientNameElem.textContent = `${patientInfo.first_name} ${patientInfo.last_name}`;
    patientEmailElem.textContent = patientInfo.email;
    refreshDashboard();

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            setActivePage(link.dataset.page);
        });
    });

    async function refreshDashboard() {
        try {
            console.log('🔍 Refreshing dashboard for patient:', patientInfo.id);
            const response = await fetch(`${baseURL}/api/dashboard/patient/${patientInfo.id}/dashboard`, {
                headers: getPatientAuthHeaders(),
            });
            
            console.log('Dashboard response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await handleApiResponse(response);
            console.log('Dashboard data received:', data);
            
            if (!data.success) {
                throw new Error('Failed to fetch dashboard data');
            }

            const dashboardData = data.data;
            document.getElementById('totalAppointments').textContent = dashboardData.total_appointments || 0;
            document.getElementById('upcomingAppointments').textContent = dashboardData.upcoming_appointments || 0;
            document.getElementById('totalDocuments').textContent = dashboardData.total_documents || 0;
            document.getElementById('supportTickets').textContent = dashboardData.support_tickets || 0;

            console.log('✅ Dashboard stats updated successfully');
            await populateAppointments();
            await populateDocuments();
        } catch (error) {
            console.error('❌ Error fetching dashboard data:', error);
            showErrorMessage('Failed to load dashboard data. Please try again.');
        }
    }

    function setActivePage(pageId) {
        navLinks.forEach(link => link.classList.remove('active'));
        pageContents.forEach(content => content.classList.remove('active'));

        const activeLink = [...navLinks].find(link => link.dataset.page === pageId);
        const activeContent = document.getElementById(`${pageId}-page`);

        if (activeLink && activeContent) {
            activeLink.classList.add('active');
            activeContent.classList.add('active');
            document.getElementById('pageTitle').textContent = activeLink.querySelector('span').textContent;
            document.getElementById('pageSubtitle').textContent = `View your ${pageId}`;
        }
    }

    async function populateAppointments() {
        try {
            const response = await fetch(`${baseURL}/api/dashboard/patient/${patientInfo.id}/appointments?status=booked&limit=10`, {
                headers: getPatientAuthHeaders(),
            });
            const data = await handleApiResponse(response);
            
            if (!data.success || !data.data || data.data.length === 0) {
                appointmentGrid.innerHTML = '<div class="empty-state"><p>No appointments found</p></div>';
                return;
            }

            appointmentGrid.innerHTML = '';
            
            data.data.forEach(appointment => {
                const appointmentCard = createAppointmentCard(appointment);
                appointmentGrid.appendChild(appointmentCard);
            });
            // Add event listeners for View buttons
            document.querySelectorAll('.view-appointment-btn').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const appointmentId = this.getAttribute('data-appointment-id');
                    await showAppointmentDetailsModal(appointmentId);
                });
            });
        } catch (error) {
            console.error('Error fetching appointments:', error);
            appointmentGrid.innerHTML = '<div class="error-state"><p>Error loading appointments. Please try again.</p></div>';
        }
    }

    async function populateDocuments() {
        try {
            console.log('📄 Fetching documents for patient:', patientInfo.id);
            const response = await fetch(`${baseURL}/api/dashboard/patient/${patientInfo.id}/documents`, {
                headers: getPatientAuthHeaders(),
            });
            
            console.log('Documents response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await handleApiResponse(response);
            console.log('Documents data received:', data);
            
            if (!data.success) {
                throw new Error('Failed to fetch documents');
            }

            documentsTableBody.innerHTML = '';
            if (!data.data || data.data.length === 0) {
                console.log('⚠️ No documents found for patient');
                documentsTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No documents available</td></tr>';
                return;
            }

            console.log(`✅ Found ${data.data.length} document(s) for patient`);
            data.data.forEach((document, index) => {
                console.log(`Document ${index + 1}:`, document);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${document.document_name}</td>
                    <td>${document.document_type}</td>
                    <td>${document.doctor_name || 'N/A'}</td>
                    <td>${document.document_date || 'N/A'}</td>
                    <td>
                        <button class='btn btn-secondary' onclick='viewDocument("${document.file_url}")'>View</button>
                        <button class='btn btn-primary' onclick='downloadDocument("${document.file_url}", "${document.document_name}")'>Download</button>
                    </td>
                `;
                documentsTableBody.appendChild(row);
            });
            
            console.log('✅ Documents table populated successfully');
        } catch (error) {
            console.error('❌ Error fetching documents:', error);
            documentsTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Error loading documents</td></tr>';
        }
    }

    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.onclick = logout;

    function logout() {
        localStorage.removeItem('patientToken');
        localStorage.removeItem('patientInfo');
        sessionStorage.removeItem('patientToken');
        sessionStorage.removeItem('patientInfo');
        window.location.href = './login.html';
    }

    function getCurrentPatient() {
        return getCurrentPatientFromStorage();
    }

    // Support form submission
    const supportForm = document.getElementById('supportForm');
    if (supportForm) {
        supportForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const supportData = {
                userId: patientInfo.id,
                userType: 'patient',
                userName: `${patientInfo.first_name} ${patientInfo.last_name}`,
                userEmail: patientInfo.email,
                ticketType: formData.get('ticketType'),
                subject: formData.get('subject'),
                description: formData.get('description'),
                priority: formData.get('priority')
            };
            
            try {
                const response = await fetch(`${baseURL}/api/dashboard/support/ticket`, {
                    method: 'POST',
                    headers: getPatientAuthHeaders(),
                    body: JSON.stringify(supportData)
                });
                
                const result = await handleApiResponse(response);
                if (result.success) {
                    showSuccessMessage('Support ticket submitted successfully!');
                    this.reset();
                } else {
                    showErrorMessage('Failed to submit support ticket. Please try again.');
                }
            } catch (error) {
                console.error('Error submitting support ticket:', error);
                showErrorMessage('Error submitting support ticket. Please try again.');
            }
        });
    }

    function createAppointmentCard(appointment) {
        const card = document.createElement('div');
        card.className = `appointment-card ${appointment.status}`;

        const statusBadge = getStatusBadge(appointment.status);
        const typeBadge = getTypeBadge(appointment.consultation_type);

        card.innerHTML = `
            <div class="appointment-header">
                <h3 class="appointment-doctor">Dr. ${appointment.doc_first_name}</h3>
                <div class="appointment-time">${appointment.appointment_date} ${appointment.appointment_time || ''}</div>
            </div>
            <div class="appointment-details">
                <div class="appointment-detail">
                    <i class="fas fa-calendar-day"></i>
                    <span>${appointment.appointment_date}</span>
                </div>
                <div class="appointment-detail">
                    <i class="fas fa-clock"></i>
                    <span>${appointment.slot_time}</span>
                </div>
                <div class="appointment-detail">
                    <i class="fas fa-notes-medical"></i>
                    <span>${appointment.problem_description.substring(0, 30)}...</span>
                </div>
                <div class="appointment-detail">
                    ${statusBadge}
                    ${typeBadge}
                </div>
            </div>
            <div style="text-align:right; margin-top:10px;">
                <button class="btn btn-secondary view-appointment-btn" data-appointment-id="${appointment.id}">View</button>
            </div>
        `;
        return card;
    }

    function getStatusBadge(status) {
        const badges = {
            'pending': '<span class="badge status-pending">Pending</span>',
            'confirmed': '<span class="badge status-confirmed">Confirmed</span>',
            'completed': '<span class="badge status-completed">Completed</span>',
            'cancelled': '<span class="badge status-cancelled">Cancelled</span>'
        };
        return badges[status] || '<span class="badge">Unknown</span>';
    }

    function getTypeBadge(type) {
        const badges = {
            'video-call': '<span class="badge type-virtual">Virtual</span>',
            'in-person': '<span class="badge type-in-person">In-Person</span>'
        };
        return badges[type] || '<span class="badge">Unknown</span>';
    }

    // Utility functions
    function showSuccessMessage(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success';
        alert.textContent = message;
        alert.style.position = 'fixed';
        alert.style.top = '20px';
        alert.style.right = '20px';
        alert.style.zIndex = '9999';
        alert.style.padding = '10px 20px';
        alert.style.backgroundColor = '#d4edda';
        alert.style.color = '#155724';
        alert.style.borderRadius = '5px';
        document.body.appendChild(alert);
        
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    function showErrorMessage(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-error';
        alert.textContent = message;
        alert.style.position = 'fixed';
        alert.style.top = '20px';
        alert.style.right = '20px';
        alert.style.zIndex = '9999';
        alert.style.padding = '10px 20px';
        alert.style.backgroundColor = '#f8d7da';
        alert.style.color = '#721c24';
        alert.style.borderRadius = '5px';
        document.body.appendChild(alert);
        
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    // Global functions for document viewing
    window.viewDocument = function(documentUrl) {
        window.open(documentUrl, '_blank');
    };

    window.downloadDocument = function(documentUrl, documentName) {
        const link = document.createElement('a');
        link.href = documentUrl;
        link.download = documentName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Refresh button functionality
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshDashboard);
    }

    // Modal logic
    async function showAppointmentDetailsModal(appointmentId) {
        const modal = document.getElementById('appointmentDetailsModal');
        const body = document.getElementById('appointmentDetailsBody');
        const docsList = document.getElementById('appointmentDocumentsList');
        body.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading details...</div>';
        docsList.innerHTML = '';
        modal.style.display = 'flex';
        // Fetch appointment details
        try {
            const response = await fetch(`${baseURL}/api/dashboard/patient/${patientInfo.id}/appointments/${appointmentId}`, {
                headers: getPatientAuthHeaders(),
            });
            const data = await handleApiResponse(response);
            if (!data.success || !data.data) throw new Error('No details found');
            const appt = data.data;
            body.innerHTML = `
                <strong>Date:</strong> ${appt.appointment_date}<br>
                <strong>Time:</strong> ${appt.slot_time || appt.appointment_time || 'TBD'}<br>
                <strong>Doctor:</strong> Dr. ${appt.doc_first_name} ${appt.doc_last_name || ''}<br>
                <strong>Type:</strong> ${appt.consultation_type}<br>
                <strong>Status:</strong> ${appt.status}<br>
                <strong>Description:</strong> ${appt.problem_description || ''}<br>
            `;
            // Fetch related documents
            const docsResponse = await fetch(`${baseURL}/api/dashboard/patient/${patientInfo.id}/appointments/${appointmentId}/documents`, {
                headers: getPatientAuthHeaders(),
            });
            const docsData = await handleApiResponse(docsResponse);
            if (docsData.success && docsData.data && docsData.data.length > 0) {
                docsList.innerHTML = '';
                docsData.data.forEach(doc => {
                    const li = document.createElement('li');
                    li.innerHTML = `<a href="${doc.file_url}" target="_blank">${doc.document_name}</a> (${doc.document_type})`;
                    docsList.appendChild(li);
                });
            } else {
                docsList.innerHTML = '<li>No documents found for this appointment.</li>';
            }
        } catch (err) {
            body.innerHTML = '<span style="color:red;">Failed to load appointment details.</span>';
            docsList.innerHTML = '';
        }
    }
    // Modal close logic
    const closeModalBtn = document.getElementById('closeAppointmentModal');
    if (closeModalBtn) {
        closeModalBtn.onclick = function() {
            document.getElementById('appointmentDetailsModal').style.display = 'none';
        };
    }
    window.onclick = function(event) {
        const modal = document.getElementById('appointmentDetailsModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
});

