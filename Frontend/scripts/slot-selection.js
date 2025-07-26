import { baseURL } from './baseURL.js';

class SlotSelectionManager {
    constructor() {
        this.selectedDoctor = null;
        this.consultationType = null;
        this.selectedSlot = null;
        this.selectedDate = null;
        this.init();
    }

    init() {
        this.loadStoredData();
        this.setupEventListeners();
        this.setupDatePicker();
        this.updateDoctorInfo();
    }

    loadStoredData() {
        const doctorData = sessionStorage.getItem('selectedDoctor');
        const consultationType = sessionStorage.getItem('consultationType');
        
        if (doctorData) {
            this.selectedDoctor = JSON.parse(doctorData);
        } else {
            // Redirect back if no doctor selected
            window.location.href = 'book.appointment.html';
            return;
        }
        
        this.consultationType = consultationType || 'in-person';
    }

    setupEventListeners() {
        const dateInput = document.getElementById('appointment-date');
        const continueBtn = document.getElementById('continue-btn');

        dateInput.addEventListener('change', () => this.loadSlots());
        continueBtn.addEventListener('click', () => this.continueToDescription());
    }

    setupDatePicker() {
        const dateInput = document.getElementById('appointment-date');
        const today = new Date();
        const maxDate = new Date();
        maxDate.setDate(today.getDate() + 30); // Allow booking up to 30 days in advance

        // Set minimum date to today
        dateInput.min = today.toISOString().split('T')[0];
        dateInput.max = maxDate.toISOString().split('T')[0];
        
        // Set default date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        dateInput.value = tomorrow.toISOString().split('T')[0];
        
        // Load slots for default date
        this.selectedDate = tomorrow.toISOString().split('T')[0];
        this.loadSlots();
    }

    updateDoctorInfo() {
        if (!this.selectedDoctor) return;

        document.getElementById('doctor-name').textContent = this.selectedDoctor.doctor_name;
        document.getElementById('doctor-specialty').textContent = this.selectedDoctor.qualifications;
        document.getElementById('doctor-experience').textContent = this.selectedDoctor.experience;
        
        const consultationTypeText = this.consultationType === 'video-call' ? 'Video Call Consultation' : 'In-Person Consultation';
        document.getElementById('consultation-type').textContent = consultationTypeText;
    }

    async loadSlots() {
        const dateInput = document.getElementById('appointment-date');
        this.selectedDate = dateInput.value;
        
        if (!this.selectedDate || !this.selectedDoctor) return;

        const container = document.getElementById('slots-container');
        container.innerHTML = '<div class="loading">Loading available slots...</div>';

        try {
            // Get available slots for the selected date
            const availableSlots = this.getAvailableSlotsForDate(this.selectedDate);
            
            if (availableSlots.length === 0) {
                container.innerHTML = '<div class="no-slots">No available slots for this date. Please select another date.</div>';
                return;
            }

            this.renderSlots(availableSlots);
        } catch (error) {
            console.error('Error loading slots:', error);
            container.innerHTML = '<div class="no-slots">Error loading slots. Please try again.</div>';
        }
    }

    getAvailableSlotsForDate(date) {
        if (!this.selectedDoctor) return [];

        const dateKey = this.getDateKey(new Date(date));
        const availableSlots = this.selectedDoctor[dateKey] || [];
        
        // Filter out any slots that might be booked (in a real app, you'd check against booked appointments)
        return availableSlots.filter(slot => slot && slot.trim() !== '');
    }

    getDateKey(date) {
        const months = ['january', 'february', 'march', 'april', 'may', 'june', 
                       'july', 'august', 'september', 'october', 'november', 'december'];
        const month = months[date.getMonth()];
        const day = date.getDate();
        return `${month}_${day}`;
    }

    renderSlots(availableSlots) {
        const container = document.getElementById('slots-container');
        
        const slotsHTML = availableSlots.map(slot => this.createSlotCard(slot)).join('');
        container.innerHTML = `
            <div class="slots-grid">
                ${slotsHTML}
            </div>
        `;
    }

    createSlotCard(slot) {
        const isSelected = this.selectedSlot === slot;
        const cardClass = isSelected ? 'slot-card selected' : 'slot-card';
        
        return `
            <div class="${cardClass}" onclick="window.slotSelectionManager.selectSlot('${slot}')">
                <div class="slot-time">${slot}</div>
                <div class="slot-status available">Available</div>
            </div>
        `;
    }

    selectSlot(slot) {
        this.selectedSlot = slot;
        
        // Update visual selection
        const slotCards = document.querySelectorAll('.slot-card');
        slotCards.forEach(card => {
            card.classList.remove('selected');
            if (card.querySelector('.slot-time').textContent === slot) {
                card.classList.add('selected');
            }
        });
        
        // Enable continue button
        const continueBtn = document.getElementById('continue-btn');
        continueBtn.disabled = false;
    }

    continueToDescription() {
        if (!this.selectedSlot || !this.selectedDate) {
            alert('Please select a date and time slot.');
            return;
        }

        // Store slot selection in sessionStorage
        sessionStorage.setItem('selectedSlot', this.selectedSlot);
        sessionStorage.setItem('selectedDate', this.selectedDate);
        
        // Navigate to problem description page
        window.location.href = 'problem-description.html';
    }
}

// Initialize the slot selection manager
window.slotSelectionManager = new SlotSelectionManager(); 