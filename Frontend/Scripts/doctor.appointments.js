import { getAuthHeaders, handleApiResponse } from './baseURL.js';
import { logoutDoctor, getCurrentDoctor, isDoctorAuthenticated } from './doctor.login.js';

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!isDoctorAuthenticated()) {
        window.location.href = './unified-login.html';
        return;
    }

    // Load appointments data
    loadAppointmentsData();

    // Set up event listeners
    setupEventListeners();
});

function setupEventListeners() {
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
}

async function loadAppointmentsData() {
    try {
        const doctor = getCurrentDoctor();
        if (!doctor) return;

        const response = await fetch(`/appointment/byDoctor/${doctor.id}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });
        const data = await handleApiResponse(response);
        displayAppointments(data || []);
    } catch (error) {
        console.error('Error loading appointments:', error);
        document.getElementById('appointmentsList').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load appointments</p>
            </div>
        `;
    }
}

function displayAppointments(appointments) {
    const container = document.getElementById('appointmentsList');

    if (!appointments || appointments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <p>No appointments found</p>
            </div>
        `;
        return;
    }

    container.innerHTML = appointments.map((appointment) => `
        <div class="appointment-item">
            <div class="appointment-info">
                <h4>${appointment.patient_name || 'Unknown Patient'}</h4>
                <p><i class="fas fa-calendar"></i> ${appointment.appointment_date || 'No date'}</p>
                <p><i class="fas fa-clock"></i> ${appointment.appointment_time || 'No time'}</p>
                <p><i class="fas fa-notes-medical"></i> ${appointment.problem_description || 'No description'}</p>
            </div>
            <div class="appointment-status ${getStatusClass(appointment.status)}">
                ${getStatusText(appointment.status)}
            </div>
        </div>
    `).join('');
}

function getStatusClass(status) {
    switch (status) {
        case true: return 'status-completed';
        case false: return 'status-pending';
        default: return 'status-pending';
    }
}

function getStatusText(status) {
    switch (status) {
        case true: return 'Completed';
        case false: return 'Pending';
        default: return 'Unknown';
    }
}
