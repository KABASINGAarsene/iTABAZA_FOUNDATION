import { baseURL, getAuthHeaders } from './baseURL.js';

class InPersonAppointmentManager {
    constructor() {
        this.doctors = [];
        this.filteredDoctors = [];
        this.doctorsCache = null;
        this.lastFetchTime = 0;
        this.cacheDuration = 5 * 60 * 1000; // 5 minutes
        this.isLoading = false;
        this.locationData = {
            districts: {
                kigali: {
                    sectors: ['Gasabo', 'Kicukiro', 'Nyarugenge'],
                    cells: {
                        Gasabo: ['Cell 1', 'Cell 2', 'Cell 3'],
                        Kicukiro: ['Cell 1', 'Cell 2', 'Cell 3'],
                        Nyarugenge: ['Cell 1', 'Cell 2', 'Cell 3']
                    }
                },
                north: {
                    sectors: ['Burera', 'Gakenke', 'Gicumbi', 'Musanze', 'Rulindo'],
                    cells: {
                        Burera: ['Cell 1', 'Cell 2', 'Cell 3'],
                        Gakenke: ['Cell 1', 'Cell 2', 'Cell 3'],
                        Gicumbi: ['Cell 1', 'Cell 2', 'Cell 3'],
                        Musanze: ['Cell 1', 'Cell 2', 'Cell 3'],
                        Rulindo: ['Cell 1', 'Cell 2', 'Cell 3']
                    }
                },
                south: {
                    sectors: ['Gisagara', 'Huye', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyanza', 'Nyaruguru', 'Ruhango'],
                    cells: {
                        Gisagara: ['Cell 1', 'Cell 2', 'Cell 3'],
                        Huye: ['Cell 1', 'Cell 2', 'Cell 3'],
                        Kamonyi: ['Cell 1', 'Cell 2', 'Cell 3'],
                        Muhanga: ['Cell 1', 'Cell 2', 'Cell 3'],
                        Nyamagabe: ['Cell 1', 'Cell 2', 'Cell 3'],
                        Nyanza: ['Cell 1', 'Cell 2', 'Cell 3'],
                        Nyaruguru: ['Cell 1', 'Cell 2', 'Cell 3'],
                        Ruhango: ['Cell 1', 'Cell 2', 'Cell 3']
                    }
                },
                east: {
                    sectors: ['Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Rwamagana'],
                    cells: {
                        Bugesera: ['Cell 1', 'Cell 2', 'Cell 3'],
                        Gatsibo: ['Cell 1', 'Cell 2', 'Cell 3'],
                        Kayonza: ['Cell 1', 'Cell 2', 'Cell 3'],
                        Kirehe: ['Cell 1', 'Cell 2', 'Cell 3'],
                        Ngoma: ['Cell 1', 'Cell 2', 'Cell 3'],
                        Rwamagana: ['Cell 1', 'Cell 2', 'Cell 3']
                    }
                },
                west: {
                    sectors: ['Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke', 'Rubavu', 'Rusizi', 'Rutsiro'],
                    cells: {
                        Karongi: ['Cell 1', 'Cell 2', 'Cell 3'],
                        Ngororero: ['Cell 1', 'Cell 2', 'Cell 3'],
                        Nyabihu: ['Cell 1', 'Cell 2', 'Cell 3'],
                        Nyamasheke: ['Cell 1', 'Cell 2', 'Cell 3'],
                        Rubavu: ['Cell 1', 'Cell 2', 'Cell 3'],
                        Rusizi: ['Cell 1', 'Cell 2', 'Cell 3'],
                        Rutsiro: ['Cell 1', 'Cell 2', 'Cell 3']
                    }
                }
            }
        };
        this.init();
    }

    async init() {
        await this.loadDoctors();
        this.setupEventListeners();
        this.renderDoctors();
    }

    showLoading() {
        this.isLoading = true;
        const container = document.getElementById('doctors-container');
        container.innerHTML = `
            <div class="loading" style="text-align: center; padding: 50px;">
                <div style="border: 4px solid #f3f3f3; border-top: 4px solid #28a745; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <p style="color: white; font-size: 16px;">Loading doctors...</p>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
    }

    hideLoading() {
        this.isLoading = false;
    }

    showError(message) {
        const container = document.getElementById('doctors-container');
        container.innerHTML = `
            <div class="no-doctors" style="text-align: center; padding: 50px;">
                <div style="color: #dc3545; font-size: 48px; margin-bottom: 20px;">⚠️</div>
                <h3 style="color: #dc3545; margin-bottom: 10px;">Oops! Something went wrong</h3>
                <p style="color: white; margin-bottom: 20px;">${message}</p>
                <button onclick="window.inPersonAppointmentManager.loadDoctors()" style="background: #0077c0; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">
                    Try Again
                </button>
            </div>
        `;
    }

    showNoDoctors(message = "No doctors available at the moment.") {
        const container = document.getElementById('doctors-container');
        container.innerHTML = `
            <div class="no-doctors" style="text-align: center; padding: 50px;">
                <div style="color: #6c757d; font-size: 48px; margin-bottom: 20px;">👨‍⚕️</div>
                <h3 style="color: #6c757d; margin-bottom: 10px;">No Doctors Found</h3>
                <p style="color: white; margin-bottom: 20px;">${message}</p>
                <button onclick="window.inPersonAppointmentManager.loadDoctors()" style="background: #28a745; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">
                    Refresh
                </button>
            </div>
        `;
    }

    async loadDoctors(retryCount = 0) {
        if (this.isLoading) return;
        
        const now = Date.now();
        
        // Use cached data if available and not expired
        if (this.doctorsCache && (now - this.lastFetchTime) < this.cacheDuration) {
            this.doctors = this.doctorsCache;
            this.filteredDoctors = [...this.doctors];
            this.sortDoctorsBySlots();
            this.renderDoctors();
            return;
        }
        
        this.showLoading();
        
        try {
            const response = await fetch(`${baseURL}/doctor/availableDoctors`, {
                method: 'GET',
                headers: getAuthHeaders(),
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.doctor || data.doctor.length === 0) {
                this.hideLoading();
                this.showNoDoctors("No available doctors found. Please check back later.");
                return;
            }
            
            // Cache the successful response
            this.doctors = data.doctor;
            this.doctorsCache = data.doctor;
            this.lastFetchTime = now;
            this.filteredDoctors = [...this.doctors];
            this.sortDoctorsBySlots();
            
            this.hideLoading();
            this.renderDoctors();
            
        } catch (error) {
            console.error('Error fetching doctors:', error);
            this.hideLoading();
            
            // Retry logic for network errors
            if (retryCount < 3 && (error.name === 'TypeError' || error.name === 'AbortError')) {
                console.log(`Retrying... Attempt ${retryCount + 1}`);
                setTimeout(() => this.loadDoctors(retryCount + 1), 2000 * (retryCount + 1));
                return;
            }
            
            this.showError(`Failed to load doctors: ${error.message}. Please check your internet connection and try again.`);
        }
    }

    sortDoctorsBySlots() {
        this.filteredDoctors.sort((a, b) => {
            const aSlots = this.getAvailableSlotsCount(a);
            const bSlots = this.getAvailableSlotsCount(b);
            return bSlots - aSlots; // Sort by most available slots first
        });
    }

    getAvailableSlotsCount(doctor) {
        // Count available slots for the next few days
        let totalSlots = 0;
        const today = new Date();
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dateKey = this.getDateKey(date);
            
            if (doctor[dateKey] && Array.isArray(doctor[dateKey])) {
                totalSlots += doctor[dateKey].length;
            }
        }
        
        return totalSlots;
    }

    getDateKey(date) {
        const months = ['january', 'february', 'march', 'april', 'may', 'june', 
                       'july', 'august', 'september', 'october', 'november', 'december'];
        const month = months[date.getMonth()];
        const day = date.getDate();
        return `${month}_${day}`;
    }

    setupEventListeners() {
        const districtFilter = document.getElementById('district-filter');
        const sectorFilter = document.getElementById('sector-filter');
        const cellFilter = document.getElementById('cell-filter');
        const departmentFilter = document.getElementById('department-filter');
        const searchFilter = document.getElementById('search-filter');
        const sortFilter = document.getElementById('sort-filter');

        if (districtFilter) districtFilter.addEventListener('change', () => this.updateLocationFilters());
        if (sectorFilter) sectorFilter.addEventListener('change', () => this.updateLocationFilters());
        if (cellFilter) cellFilter.addEventListener('change', () => this.applyFilters());
        if (departmentFilter) departmentFilter.addEventListener('change', () => this.applyFilters());
        if (searchFilter) searchFilter.addEventListener('input', () => this.applyFilters());
        if (sortFilter) sortFilter.addEventListener('change', () => this.applyFilters());
    }

    updateLocationFilters() {
        const districtFilter = document.getElementById('district-filter');
        const sectorFilter = document.getElementById('sector-filter');
        const cellFilter = document.getElementById('cell-filter');
        
        if (!districtFilter || !sectorFilter || !cellFilter) return;
        
        const selectedDistrict = districtFilter.value;
        
        // Update sector options
        sectorFilter.innerHTML = '<option value="">All Sectors</option>';
        cellFilter.innerHTML = '<option value="">All Cells</option>';
        
        if (selectedDistrict && this.locationData.districts[selectedDistrict]) {
            const sectors = this.locationData.districts[selectedDistrict].sectors;
            sectors.forEach(sector => {
                const option = document.createElement('option');
                option.value = sector;
                option.textContent = sector;
                sectorFilter.appendChild(option);
            });
        }
        
        this.applyFilters();
    }

    applyFilters() {
        const districtFilter = document.getElementById('district-filter')?.value || '';
        const sectorFilter = document.getElementById('sector-filter')?.value || '';
        const cellFilter = document.getElementById('cell-filter')?.value || '';
        const departmentFilter = document.getElementById('department-filter')?.value || '';
        const searchFilter = document.getElementById('search-filter')?.value.toLowerCase() || '';
        const sortFilter = document.getElementById('sort-filter')?.value || 'slots';

        this.filteredDoctors = this.doctors.filter(doctor => {
            const matchesDistrict = !districtFilter || doctor.district === districtFilter;
            const matchesSector = !sectorFilter || doctor.sector === sectorFilter;
            const matchesCell = !cellFilter || doctor.cell === cellFilter;
            const matchesDepartment = !departmentFilter || doctor.department_id == departmentFilter;
            const matchesSearch = !searchFilter || 
                doctor.doctor_name.toLowerCase().includes(searchFilter) ||
                doctor.qualifications.toLowerCase().includes(searchFilter);
            
            return matchesDistrict && matchesSector && matchesCell && matchesDepartment && matchesSearch;
        });

        this.sortDoctors(sortFilter);
        this.renderDoctors();
    }

    sortDoctors(sortBy) {
        switch (sortBy) {
            case 'slots':
                this.sortDoctorsBySlots();
                break;
            case 'name':
                this.filteredDoctors.sort((a, b) => a.doctor_name.localeCompare(b.doctor_name));
                break;
            case 'experience':
                this.filteredDoctors.sort((a, b) => {
                    const aExp = parseInt(a.experience.match(/\d+/)?.[0] || 0);
                    const bExp = parseInt(b.experience.match(/\d+/)?.[0] || 0);
                    return bExp - aExp;
                });
                break;
            case 'distance':
                // For now, sort by city (could be enhanced with actual distance calculation)
                this.filteredDoctors.sort((a, b) => a.city.localeCompare(b.city));
                break;
        }
    }

    renderDoctors() {
        const container = document.getElementById('doctors-container');
        
        if (!container) {
            console.error('Doctors container not found');
            return;
        }
        
        if (this.filteredDoctors.length === 0) {
            container.innerHTML = '<div class="no-doctors">No doctors found matching your criteria.</div>';
            return;
        }

        const doctorsHTML = this.filteredDoctors.map(doctor => this.createDoctorCard(doctor)).join('');
        container.innerHTML = `<div class="doctors-grid">${doctorsHTML}</div>`;
    }

    createDoctorCard(doctor) {
        if (!doctor || !doctor.doctor_name) {
            console.warn('Invalid doctor data:', doctor);
            return '';
        }
        
        const availableSlots = this.getAvailableSlotsCount(doctor);
        const isAvailable = doctor.status && doctor.is_available;
        
        return `
            <div class="doctor-card" onclick="window.inPersonAppointmentManager.selectDoctor('${doctor.id || doctor._id}')" style="opacity: ${isAvailable ? '1' : '0.7'}">
                <div class="doctor-header">
                    <div class="doctor-avatar">
                        <i class="fas fa-user-md"></i>
                    </div>
                    <div class="doctor-info">
                        <h3>${doctor.doctor_name}</h3>
                        <p>${doctor.qualifications || 'Not specified'}</p>
                    </div>
                </div>
                
                <div class="doctor-details">
                    <div class="detail-item">
                        <span class="detail-label">Experience:</span>
                        <span class="detail-value">${doctor.experience || 'Not specified'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Phone:</span>
                        <span class="detail-value">${doctor.phone_no || 'Not specified'}</span>
                    </div>
                </div>
                
                <div class="location-info">
                    <h4><i class="fas fa-map-marker-alt"></i> Location</h4>
                    <p>${doctor.city || 'Location not specified'}</p>
                </div>
                
                <div class="slots-info">
                    <div class="slots-title">Available Slots (Next 7 days)</div>
                    <div class="slots-count">${availableSlots}</div>
                </div>
                
                <button class="book-button" ${!isAvailable ? 'disabled' : ''}>
                    ${isAvailable ? 'Book In-Person Consultation' : 'Not Available'}
                </button>
                
                ${!isAvailable ? '<p style="color: #ffc107; font-size: 12px; text-align: center; margin-top: 10px;">This doctor is not accepting appointments at the moment</p>' : ''}
            </div>
        `;
    }

    selectDoctor(doctorId) {
        // Store doctor selection in sessionStorage
        const doctor = this.doctors.find(d => (d.id === doctorId || d._id === doctorId));
        if (doctor) {
            if (!doctor.status || !doctor.is_available) {
                alert('This doctor is not available for appointments at the moment.');
                return;
            }
            
            sessionStorage.setItem('selectedDoctor', JSON.stringify(doctor));
            sessionStorage.setItem('consultationType', 'in-person');
            
            // Navigate to slot selection page
            window.location.href = 'slot-selection.html';
        } else {
            console.error('Doctor not found:', doctorId);
            alert('Doctor information not found. Please try again.');
        }
    }
}

// Initialize the in-person appointment manager
window.inPersonAppointmentManager = new InPersonAppointmentManager(); 