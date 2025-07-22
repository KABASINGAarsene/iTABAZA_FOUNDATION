import { baseURL, getAuthHeaders, handleApiResponse } from './baseURL.js';

document.addEventListener('DOMContentLoaded', function() {
    const doctorLoginForm = document.getElementById('doctorLoginForm');
    const doctorEmail = document.getElementById('doctorEmail');
    const doctorPassword = document.getElementById('doctorPassword');
    const forgotPassword = document.getElementById('forgotPassword');

    // Check if doctor is already logged in
    const doctorToken = localStorage.getItem('doctorToken') || sessionStorage.getItem('doctorToken');
    if (doctorToken) {
        window.location.href = './unified-login.html';
        return;
    }

    // Handle doctor login form submission
    doctorLoginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = doctorEmail.value.trim();
        const password = doctorPassword.value.trim();

        if (!email || !password) {
            swal("Error", "Please enter both email and password", "error");
            return;
        }

        try {
            // Show loading
            swal("Logging in...", "Please wait while we verify your credentials", "info", {
                buttons: false,
                closeOnEsc: false,
                closeOnClickOutside: false,
            });

            // Make API call to doctor login endpoint
            const response = await fetch(`${baseURL}/api/dashboard/doctor/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await handleApiResponse(response);

            if (data.success) {
                // Store doctor token and info
                localStorage.setItem('doctorToken', data.token);
                localStorage.setItem('doctorInfo', JSON.stringify(data.doctor));
                
                swal("Success", "Login successful! Redirecting to dashboard...", "success", {
                    timer: 2000,
                    buttons: false
                });

                // Redirect to doctor dashboard
                setTimeout(() => {
                    window.location.href = './unified-login.html';
                }, 2000);
            } else {
                throw new Error(data.message || 'Login failed');
            }

        } catch (error) {
            console.error('Login error:', error);
            swal("Error", error.message || "Failed to login. Please check your credentials.", "error");
        }
    });

    // Handle forgot password
    forgotPassword.addEventListener('click', function(e) {
        e.preventDefault();
        swal("Forgot Password", "Please contact the administrator to reset your password.", "info");
    });

    // Add input focus effects (similar to admin login)
    const inputs = document.querySelectorAll('.input_field input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focus');
        });

        input.addEventListener('blur', function() {
            if (this.value === '') {
                this.parentElement.classList.remove('focus');
            }
        });

        // Check if input has value on page load
        if (input.value !== '') {
            input.parentElement.classList.add('focus');
        }
    });
});

// Function to logout doctor
export function logoutDoctor() {
    // Remove all possible doctor and user session keys
    localStorage.removeItem('doctorToken');
    localStorage.removeItem('doctorInfo');
    localStorage.removeItem('userName');
    localStorage.removeItem('doctorId');
    localStorage.removeItem('userEmail');
    sessionStorage.removeItem('doctorToken');
    sessionStorage.removeItem('doctorInfo');
    sessionStorage.removeItem('doctorId');
    sessionStorage.removeItem('userEmail');
    // Optionally clear more keys if needed
    window.location.href = './unified-login.html';
}

// Function to get current doctor info
export function getCurrentDoctor() {
    const doctorInfo = localStorage.getItem('doctorInfo');
    return doctorInfo ? JSON.parse(doctorInfo) : null;
}

// Function to check if doctor is authenticated
export function isDoctorAuthenticated() {
    const token = localStorage.getItem('doctorToken') || sessionStorage.getItem('doctorToken');
    const doctorInfo = localStorage.getItem('doctorInfo') || sessionStorage.getItem('doctorInfo');
    return !!(token && doctorInfo);
}
