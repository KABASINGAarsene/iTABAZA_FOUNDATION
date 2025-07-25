import { baseURL } from './baseURL.js';

class PaymentManager {
    constructor() {
        this.appointmentDetails = {};
        this.paymentAmount = 0;
        this.init();
    }

    init() {
        this.loadStoredData();
        this.setupEventListeners();
        this.updateSummary();
        this.calculatePaymentAmount();
    }

    loadStoredData() {
        const appointmentDetails = sessionStorage.getItem('appointmentDetails');
        
        if (!appointmentDetails) {
            // Redirect back if missing data
            window.location.href = 'book.appointment.html';
            return;
        }
        
        this.appointmentDetails = JSON.parse(appointmentDetails);
    }

    setupEventListeners() {
        const form = document.getElementById('payment-form');
        const paymentMethods = document.querySelectorAll('.payment-method');

        // Payment method selection
        paymentMethods.forEach(method => {
            method.addEventListener('click', () => {
                paymentMethods.forEach(m => m.classList.remove('selected'));
                method.classList.add('selected');
                const radio = method.querySelector('input[type="radio"]');
                radio.checked = true;
            });
        });

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePaymentSubmission();
        });
    }

    updateSummary() {
        if (!this.appointmentDetails.doctor) return;

        document.getElementById('summary-doctor').textContent = this.appointmentDetails.doctor.doctor_name;
        document.getElementById('summary-date').textContent = this.formatDate(this.appointmentDetails.date);
        document.getElementById('summary-time').textContent = this.appointmentDetails.slot;
        
        const consultationTypeText = this.appointmentDetails.consultationType === 'video-call' ? 'Video Call' : 'In-Person';
        document.getElementById('summary-type').textContent = consultationTypeText;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    calculatePaymentAmount() {
        // Base consultation fee
        let baseAmount = 5000; // 5000 RWF base fee
        
        // Add consultation type premium
        if (this.appointmentDetails.consultationType === 'video-call') {
            baseAmount += 2000; // Additional 2000 RWF for video call
        } else {
            baseAmount += 1000; // Additional 1000 RWF for in-person
        }
        
        // Add specialty premium (if applicable)
        const specialty = this.appointmentDetails.doctor.qualifications.toLowerCase();
        if (specialty.includes('cardiology') || specialty.includes('neurology')) {
            baseAmount += 3000; // Premium for specialized fields
        } else if (specialty.includes('dermatology') || specialty.includes('orthopedic')) {
            baseAmount += 2000; // Standard premium
        }
        
        this.paymentAmount = baseAmount;
        document.getElementById('payment-amount').textContent = `${baseAmount.toLocaleString()} RWF`;
    }

    async handlePaymentSubmission() {
        const form = document.getElementById('payment-form');
        const formData = new FormData(form);
        
        // Validate required fields
        const transactionId = formData.get('transactionId');
        const simcardHolder = formData.get('simcardHolder');
        const paymentPhoneNumber = formData.get('phoneNumber');
        const paymentOwnerName = formData.get('ownerName');
        const paymentMethod = formData.get('paymentMethod');
        
        if (!transactionId || !simcardHolder || !paymentPhoneNumber || !paymentOwnerName) {
            alert('Please fill in all required payment fields.');
            return;
        }

        if (transactionId.trim().length < 5) {
            alert('Please enter a valid transaction ID.');
            return;
        }

        // --- Robust doctorId and user checks ---
        const doctor = this.appointmentDetails.doctor;
        const doctorId = doctor && doctor.id;
        if (!doctorId) {
            alert('No doctor selected. Please go back and select a doctor.');
            window.location.href = 'book.appointment.html';
            return;
        }
        const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        if (!userId) {
            alert('You must be logged in to book an appointment.');
            window.location.href = 'login.html';
            return;
        }
        const userEmail = this.getCurrentUserEmail();
        if (!userEmail) {
            alert('Could not retrieve user email. Please log in again.');
            window.location.href = 'login.html';
            return;
        }
        const authToken = this.getAuthToken();
        if (!authToken) {
            alert('Authentication error. Please log in again.');
            window.location.href = 'login.html';
            return;
        }
        // --- End robust checks ---

        // Show loading state
        const submitBtn = document.getElementById('confirm-payment-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitBtn.disabled = true;

        try {
            // Prepare appointment data for backend
            const appointmentData = {
                userID: userId,
                email: userEmail,
                doctorId: doctorId,
                ageOfPatient: this.appointmentDetails.patientAge,
                gender: this.appointmentDetails.patientGender,
                address: this.getCurrentUserAddress(),
                problemDescription: this.appointmentDetails.problemDescription,
                appointmentDate: this.appointmentDetails.date,
                appointmentTime: this.appointmentDetails.slot,
                consultationType: this.appointmentDetails.consultationType,
                symptoms: this.appointmentDetails.symptoms,
                medicalHistory: this.appointmentDetails.medicalHistory,
                medications: this.appointmentDetails.medications,
                paymentDetails: {
                    transactionId: transactionId,
                    simcardHolder: simcardHolder,
                    phoneNumber: paymentPhoneNumber,
                    paymentMethod: paymentMethod,
                    amount: this.paymentAmount,
                    currency: 'RWF'
                }
            };

            // Submit appointment to backend
            const success = await this.submitAppointment(appointmentData, authToken);
            
            if (success) {
                // Clear session storage
                this.clearSessionStorage();
                
                // Show success message and redirect
                this.showSuccessMessage();
            } else {
                throw new Error('Failed to book appointment');
            }
            
        } catch (error) {
            console.error('Payment submission error:', error);
            alert('Payment processing failed. Please try again or contact support.');
        } finally {
            // Reset button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async submitAppointment(appointmentData, authToken) {
        try {
            // Use enhanced appointment endpoint for better payment handling
            const response = await fetch(`${baseURL}/enhanced-appointment/create/${appointmentData.doctorId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    userID: appointmentData.userID,
                    email: appointmentData.email,
                    ageOfPatient: appointmentData.ageOfPatient,
                    gender: appointmentData.gender,
                    address: appointmentData.address,
                    problemDescription: appointmentData.problemDescription,
                    appointmentDate: appointmentData.appointmentDate,
                    appointmentTime: appointmentData.appointmentTime,
                    consultationType: appointmentData.consultationType,
                    symptoms: appointmentData.symptoms || [],
                    medicalHistory: appointmentData.medicalHistory || '',
                    medications: appointmentData.medications || '',
                    paymentDetails: {
                        transactionId: appointmentData.paymentDetails.transactionId,
                        simcardHolder: appointmentData.paymentDetails.simcardHolder,
                        ownerName: appointmentData.paymentDetails.ownerName,
                        phoneNumber: appointmentData.paymentDetails.phoneNumber,
                        paymentMethod: appointmentData.paymentDetails.paymentMethod,
                        amount: appointmentData.paymentDetails.amount,
                        currency: appointmentData.paymentDetails.currency
                    }
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Enhanced appointment booked successfully:', result);
                return true;
            } else {
                const error = await response.json();
                console.error('Enhanced appointment booking failed:', error);
                alert(`Booking failed: ${error.msg || 'Please check your payment details and try again.'}`);
                return false;
            }
        } catch (error) {
            console.error('Network error:', error);
            alert('Network error: Please check your internet connection and try again.');
            return false;
        }
    }

    getCurrentUserId() {
        // Check both sessionStorage and localStorage for userId, then appointmentDetails.patientId
        return sessionStorage.getItem('userId') || localStorage.getItem('userId') || this.appointmentDetails.patientId || 'temp-user-id';
    }

    getCurrentUserAddress() {
        // This should get the current user's address from their profile
        // For now, return a placeholder
        return sessionStorage.getItem('userAddress') || 'Address not specified';
    }

    getAuthToken() {
        // This should get the authentication token from the user session
        return sessionStorage.getItem('authToken') || localStorage.getItem('authToken') || sessionStorage.getItem('token') || localStorage.getItem('token');
    }

    getCurrentUserEmail() {
        // Try to get the user's email from sessionStorage or localStorage
        return sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail') || '';
    }

    clearSessionStorage() {
        // Clear appointment-related data from session storage
        sessionStorage.removeItem('selectedDoctor');
        sessionStorage.removeItem('selectedSlot');
        sessionStorage.removeItem('selectedDate');
        sessionStorage.removeItem('consultationType');
        sessionStorage.removeItem('appointmentDetails');
    }

    showSuccessMessage() {
        // Create success modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;
        
        modal.innerHTML = `
            <div style="
                background: white;
                padding: 40px;
                border-radius: 15px;
                text-align: center;
                max-width: 500px;
                margin: 20px;
            ">
                <div style="
                    width: 80px;
                    height: 80px;
                    background: #28a745;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                    color: white;
                    font-size: 40px;
                ">
                    <i class="fas fa-check"></i>
                </div>
                <h2 style="color: #28a745; margin-bottom: 15px;">Appointment Booked Successfully!</h2>
                <p style="color: #666; margin-bottom: 25px;">
                    Your appointment has been confirmed. You will receive a confirmation email shortly.
                </p>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
                    <p style="margin: 5px 0;"><strong>Doctor:</strong> ${this.appointmentDetails.doctor.doctor_name}</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${this.formatDate(this.appointmentDetails.date)}</p>
                    <p style="margin: 5px 0;"><strong>Time:</strong> ${this.appointmentDetails.slot}</p>
                    <p style="margin: 5px 0;"><strong>Type:</strong> ${this.appointmentDetails.consultationType === 'video-call' ? 'Video Call' : 'In-Person'}</p>
                </div>
                <button onclick="window.location.href='index.html'" style="
                    background: #28a745;
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                ">
                    Return to Home
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
}

// Initialize the payment manager
window.paymentManager = new PaymentManager(); 