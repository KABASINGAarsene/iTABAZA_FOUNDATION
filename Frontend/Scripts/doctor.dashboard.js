import { baseURL, getAuthHeaders, handleApiResponse } from './baseURL.js';
import { logoutDoctor, getCurrentDoctor, isDoctorAuthenticated } from './doctor.login.js';

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!isDoctorAuthenticated()) {
        window.location.href = './unified-login.html';
        return;
    }

    // Initialize dashboard
    initializeDashboard();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load dashboard data
    loadDashboardData();
});

function initializeDashboard() {
    const doctor = getCurrentDoctor();
    if (doctor) {
        // Update doctor info in navigation
        document.getElementById('doctorName').textContent = doctor.doctor_name || 'Dr. Unknown';
        document.getElementById('doctorEmail').textContent = doctor.email || 'unknown@email.com';
        document.getElementById('welcomeDoctorName').textContent = doctor.doctor_name || 'Doctor';
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

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', function() {
        loadDashboardData();
        swal("Refreshed!", "Dashboard data has been updated", "success", { timer: 1500 });
    });

    // Quick action buttons
    document.getElementById('viewTodaySchedule').addEventListener('click', function() {
        window.location.href = './doctor.appointments.html';
    });

    document.getElementById('updateProfile').addEventListener('click', function() {
        swal("Update Profile", "Profile update feature coming soon!", "info");
    });

    document.getElementById('manageAvailability').addEventListener('click', function() {
        swal("Manage Availability", "Availability management feature coming soon!", "info");
    });

    document.getElementById('viewPatientHistory').addEventListener('click', function() {
        swal("Patient History", "Patient history feature coming soon!", "info");
    });
}

async function loadDashboardData() {
    try {
        const doctor = getCurrentDoctor();
        if (!doctor) return;

        // Load appointments for this doctor
        await loadAppointments(doctor.id);
        
        // Load statistics
        await loadStatistics(doctor.id);
        
        // Initialize chart
        initializeChart();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        swal("Error", "Failed to load dashboard data", "error");
    }
}

async function loadAppointments(doctorId) {
    try {
        const response = await fetch(`${baseURL}/doctor/appointments/${doctorId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('doctorToken')}`
            }
        });

        const data = await handleApiResponse(response);
        displayRecentAppointments(data.appointments || []);
        
    } catch (error) {
        console.error('Error loading appointments:', error);
        document.getElementById('recentAppointments').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load appointments</p>
            </div>
        `;
    }
}

function displayRecentAppointments(appointments) {
    const container = document.getElementById('recentAppointments');
    
    if (!appointments || appointments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <p>No recent appointments found</p>
            </div>
        `;
        return;
    }

    // Show only the 5 most recent appointments
    const recentAppointments = appointments.slice(0, 5);
    
    container.innerHTML = recentAppointments.map(appointment => `
        <div class="appointment-item">
            <div class="appointment-info">
                <h4>${appointment.patient_name || 'Unknown Patient'}</h4>
                <p><i class="fas fa-calendar"></i> ${appointment.appointment_date || 'No date'}</p>
                <p><i class="fas fa-clock"></i> ${appointment.appointment_time || 'No time'}</p>
                <p><i class="fas fa-notes-medical"></i> ${appointment.problem_description ? appointment.problem_description.substring(0, 50) + '...' : 'No description'}</p>
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

async function loadStatistics(doctorId) {
    try {
        // For now, we'll use mock data since we need to implement the backend endpoints
        const stats = {
            totalPatients: 45,
            todayAppointments: 8,
            pendingAppointments: 3,
            monthlyEarnings: '$4,200'
        };

        document.getElementById('totalPatients').textContent = stats.totalPatients;
        document.getElementById('todayAppointments').textContent = stats.todayAppointments;
        document.getElementById('pendingAppointments').textContent = stats.pendingAppointments;
        document.getElementById('monthlyEarnings').textContent = stats.monthlyEarnings;
        
    } catch (error) {
        console.error('Error loading statistics:', error);
        // Set default values
        document.getElementById('totalPatients').textContent = '0';
        document.getElementById('todayAppointments').textContent = '0';
        document.getElementById('pendingAppointments').textContent = '0';
        document.getElementById('monthlyEarnings').textContent = '$0';
    }
}

function initializeChart() {
    const ctx = document.getElementById('appointmentChart');
    if (!ctx) return;

    // Sample data for the chart
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Appointments',
                data: [12, 19, 3, 5, 2, 3],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#f0f0f0'
                    }
                },
                x: {
                    grid: {
                        color: '#f0f0f0'
                    }
                }
            }
        }
    });
}
