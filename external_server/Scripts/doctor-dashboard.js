// Doctor Dashboard JavaScript for logout functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Doctor Dashboard loaded');
    
    // Setup all necessary event listeners
    setupEventListeners();
    
    // Initialize dashboard
    initializeDashboard();
});

function setupEventListeners() {
    // Logout functionality
    const logoutBtn = document.querySelector('button[onclick="logout()"]');
    if (logoutBtn) {
        // Remove the onclick attribute and add proper event listener
        logoutBtn.removeAttribute('onclick');
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            showSection(section);
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(navLink => {
                navLink.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
    
    // Refresh button
    const refreshBtn = document.querySelector('button[onclick="refreshData()"]');
    if (refreshBtn) {
        refreshBtn.removeAttribute('onclick');
        refreshBtn.addEventListener('click', handleRefresh);
    }
}

function initializeDashboard() {
    // Load doctor info
    loadDoctorInfo();
    
    // Load dashboard data
    loadDashboardData();
}

function loadDoctorInfo() {
    // Try to get doctor info from various storage locations
    let doctorInfo = null;
    
    try {
        doctorInfo = JSON.parse(localStorage.getItem('doctorInfo')) || 
                    JSON.parse(sessionStorage.getItem('doctorInfo')) ||
                    JSON.parse(localStorage.getItem('userInfo'));
    } catch (e) {
        console.error('Error parsing doctor info:', e);
    }
    
    if (doctorInfo) {
        // Update doctor name display
        const doctorNameEl = document.getElementById('doctorName');
        if (doctorNameEl) {
            const name = doctorInfo.doctor_name || doctorInfo.name || 'Dr. Unknown';
            doctorNameEl.textContent = name;
        }
        
        // Update specialty display
        const doctorSpecialtyEl = document.getElementById('doctorSpecialty');
        if (doctorSpecialtyEl) {
            const specialty = doctorInfo.qualifications || doctorInfo.specialty || 'General Practitioner';
            doctorSpecialtyEl.textContent = specialty;
        }
    }
}

function loadDashboardData() {
    // Load dashboard statistics and recent data
    // This would typically make API calls to get real data
    console.log('Loading dashboard data...');
    
    // For now, just set some default values
    document.getElementById('totalAppointments').textContent = '0';
    document.getElementById('todayAppointments').textContent = '0';
    document.getElementById('totalPatients').textContent = '0';
    document.getElementById('totalDocuments').textContent = '0';
    
    // Clear recent appointments loading
    const recentAppointments = document.getElementById('recentAppointments');
    if (recentAppointments) {
        recentAppointments.innerHTML = '<tr><td colspan="5" class="no-data">No recent appointments</td></tr>';
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        performLogout();
    }
}

function performLogout() {
    try {
        // Clear all possible authentication and session data
        const keysToRemove = [
            // Doctor-specific keys
            'doctorToken',
            'doctorInfo',
            'doctorId',
            'doctorSessionId',
            
            // General user keys
            'token',
            'userToken',
            'authToken',
            'accessToken',
            'userInfo',
            'userData',
            'userName',
            'userEmail',
            'userId',
            'sessionToken',
            'refreshToken',
            
            // Admin keys
            'admin',
            'adminToken',
            'adminInfo',
            
            // Patient keys
            'patientToken',
            'patientInfo',
            'patientId',
            
            // Any other potential session keys
            'isLoggedIn',
            'loginTime',
            'userRole',
            'userType',
            'profileImage',
            'userProfileImage'
        ];
        
        // Clear from localStorage
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        // Clear from sessionStorage
        keysToRemove.forEach(key => {
            sessionStorage.removeItem(key);
        });
        
        // Also clear any other storage that might exist
        try {
            // Clear all localStorage if needed (commented out for safety)
            // localStorage.clear();
            // sessionStorage.clear();
        } catch (e) {
            console.error('Error clearing storage:', e);
        }
        
        // Make logout API call to server (if backend supports it)
        try {
            fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include' // Include cookies
            }).catch(e => {
                console.log('Logout API call failed (this is normal if not implemented):', e);
            });
        } catch (e) {
            console.log('Could not make logout API call:', e);
        }
        
        // Show logout message
        showAlert('You have been successfully logged out', 'success');
        
        // Force reload to clear any cached data and redirect
        setTimeout(() => {
            // Clear any remaining data
            window.location.replace('/login.html');
        }, 1000);
        
    } catch (error) {
        console.error('Error during logout:', error);
        // Even if there's an error, still redirect to login
        window.location.replace('/login.html');
    }
}

function handleRefresh() {
    showAlert('Refreshing dashboard...', 'info');
    loadDashboardData();
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'appointments': 'Appointments',
        'documents': 'Documents',
        'support': 'Support'
    };
    
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = titles[sectionId] || 'Dashboard';
    }
}

function showAlert(message, type = 'info') {
    const alertEl = document.getElementById('alertMessage');
    if (alertEl) {
        alertEl.textContent = message;
        alertEl.className = `alert alert-${type}`;
        alertEl.style.display = 'block';
        
        // Hide alert after 3 seconds
        setTimeout(() => {
            alertEl.style.display = 'none';
        }, 3000);
    } else {
        // Fallback to console log if no alert element
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

// Global functions for backward compatibility
function logout() {
    handleLogout();
}

function refreshData() {
    handleRefresh();
}

// Add CSS for alerts if not already present
const style = document.createElement('style');
style.textContent = `
    .alert {
        padding: 10px;
        margin: 10px 0;
        border-radius: 4px;
        display: none;
    }
    .alert-success {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }
    .alert-error {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }
    .alert-info {
        background-color: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
    }
    .no-data {
        text-align: center;
        color: #6c757d;
        font-style: italic;
    }
`;
document.head.appendChild(style);
