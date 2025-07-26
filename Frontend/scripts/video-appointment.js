import { baseURL, apiRequest, getAuthHeaders } from "./baseURL.js";

let doctorsGrid = document.getElementById("doctors-grid");
let isLoading = false;
let doctorsCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

let depObj = {
    1: "Neurology",
    2: "Dermatology", 
    3: "Dental",
    4: "Ayurveda",
    5: "Gastroenterology",
    6: "Gynaecology",
    7: "ENT",
    8: "General Physician",
    9: "Orthopedic",
    10: "Cardiology",
    // String versions
    "1": "Neurology",
    "2": "Dermatology", 
    "3": "Dental",
    "4": "Ayurveda",
    "5": "Gastroenterology",
    "6": "Gynaecology",
    "7": "ENT",
    "8": "General Physician",
    "9": "Orthopedic",
    "10": "Cardiology"
}

// Function to get department name with fallback
function getDepartmentName(departmentId) {
    if (!departmentId) return 'Unknown Department';
    
    // Handle the specific UUID department ID found in the database
    if (departmentId === 'dfae69ef-60b3-49eb-8d9c-76e682e1ebd3') {
        return 'Cardiology'; // Based on the qualifications showing "cardilogy"
    }
    
    // Try exact match first
    if (depObj[departmentId]) {
        return depObj[departmentId];
    }
    
    // Try converting to string if it's a number
    if (typeof departmentId === 'number') {
        const stringId = departmentId.toString();
        if (depObj[stringId]) {
            return depObj[stringId];
        }
    }
    
    // Try converting to number if it's a string
    if (typeof departmentId === 'string') {
        const numId = parseInt(departmentId);
        if (depObj[numId]) {
            return depObj[numId];
        }
    }
    
    return `Unknown Department (ID: ${departmentId})`;
}

// Function to validate and get safe image URL
function getSafeImageUrl(imageUrl) {
    const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9Ijc1IiB5PSI3NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2NjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RG9jdG9yPC90ZXh0Pgo8L3N2Zz4K';
    
    // If no image URL provided, return default
    if (!imageUrl || imageUrl.trim() === '') {
        return defaultImage;
    }
    
    // If it's already a data URL, return as is
    if (imageUrl.startsWith('data:')) {
        return imageUrl;
    }
    
    // Check for problematic URLs
    const problematicDomains = ['example.com', 'via.placeholder.com', 'pin.it'];
    const isProblematic = problematicDomains.some(domain => imageUrl.includes(domain));
    
    if (isProblematic) {
        return defaultImage;
    }
    
    // Return the original URL if it seems valid
    return imageUrl;
}

// Loading state management
function showLoading() {
    isLoading = true;
    doctorsGrid.innerHTML = `
        <div class="loading" style="grid-column: 1 / -1;">
                <div style="border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
            <p>Loading doctors...</p>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
    }

function hideLoading() {
    isLoading = false;
}

function showError(message) {
    doctorsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: white; padding: 50px;">
                <div style="color: #dc3545; font-size: 48px; margin-bottom: 20px;">⚠️</div>
                <h3 style="color: #dc3545; margin-bottom: 10px;">Oops! Something went wrong</h3>
            <p style="margin-bottom: 20px;">${message}</p>
            <button onclick="location.reload()" style="background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">
                    Try Again
                </button>
            </div>
        `;
    }

function showNoDoctors(message = "No doctors available at the moment.") {
    doctorsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: white; padding: 50px;">
                <div style="color: #6c757d; font-size: 48px; margin-bottom: 20px;">👨‍⚕️</div>
                <h3 style="color: #6c757d; margin-bottom: 10px;">No Doctors Found</h3>
            <p style="margin-bottom: 20px;">${message}</p>
            <button onclick="getdata()" style="background: #28a745; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">
                    Refresh
                </button>
            </div>
        `;
    }

// Enhanced data fetching with caching and retry logic
async function getdata(retryCount = 0) {
    if (isLoading) return;
        
        const now = Date.now();
        
        // Use cached data if available and not expired
    if (doctorsCache && (now - lastFetchTime) < CACHE_DURATION) {
        renderdata(doctorsCache);
            return;
        }
        
    showLoading();
        
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
            hideLoading();
            showNoDoctors("No available doctors found. Please check back later.");
                return;
            }
            
            // Cache the successful response
        doctorsCache = data.doctor;
        lastFetchTime = now;
        
        hideLoading();
        renderdata(data.doctor);
            
        } catch (error) {
            console.error('Error fetching doctors:', error);
        hideLoading();
            
            // Retry logic for network errors
            if (retryCount < 3 && (error.name === 'TypeError' || error.name === 'AbortError')) {
                console.log(`Retrying... Attempt ${retryCount + 1}`);
            setTimeout(() => getdata(retryCount + 1), 2000 * (retryCount + 1));
            return;
        }
        
        showError(`Failed to load doctors: ${error.message}. Please check your internet connection and try again.`);
    }
}

// Enhanced rendering with better error handling
function renderdata(arr) {
    if (!Array.isArray(arr) || arr.length === 0) {
        showNoDoctors();
        return;
    }

    doctorsGrid.innerHTML = arr.map((elem, index) => {
        if (!elem || !elem.doctor_name) {
            console.warn('Invalid doctor data:', elem);
            return '';
        }
        const departmentName = getDepartmentName(elem.department_id);
        const isAvailable = elem.status && elem.is_available;
        
        return `
            <div class="doctor-card" style="opacity: ${isAvailable ? '1' : '0.7'}">
                <div class="doctor-header">
                    <div class="doctor-avatar">
                        <i class="fas fa-user-md"></i>
                    </div>
                    <div class="doctor-info">
                        <h3>${elem.doctor_name}</h3>
                        <p>${departmentName}</p>
                    </div>
                </div>
                
                <div class="doctor-details">
                    <div class="detail-item">
                        <span class="detail-label">Experience:</span>
                        <span class="detail-value">${elem.experience || 'Not specified'} years</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Qualification:</span>
                        <span class="detail-value">${elem.qualifications || 'Not specified'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Consultation Fee:</span>
                        <span class="detail-value">Rs. 1,000</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value" style="color: ${isAvailable ? '#28a745' : '#dc3545'}">
                            ${isAvailable ? 'Available' : 'Not Available'}
                        </span>
                    </div>
                </div>
                
                <div class="slots-info">
                    <div class="slots-title">Video Call Availability</div>
                    <div class="slots-count">${isAvailable ? 'Available Now' : 'Not Available'}</div>
                </div>
                
                <button class="book-button" ${!isAvailable ? 'disabled style="opacity:0.5;pointer-events:none;"' : ''} data-doctor-id="${elem._id || elem.id}">
                    <i class="fas fa-video me-2"></i>Book Video Call
                </button>
                
                <input type="hidden" value="${elem.doctor_name}">
                <input type="hidden" value="${departmentName}">
                <input type="hidden" value="${elem.experience || 'Not specified'}">
                <input type="hidden" value="${elem.qualifications || 'Not specified'}">
                <input type="hidden" value="${getSafeImageUrl(elem.image)}">
            </div>
        `;
    }).join("");

    // Attach booking button listeners
    let bookBtns = document.querySelectorAll('.book-button');
    bookBtns.forEach((btn) => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Check if user is logged in
            if (!localStorage.getItem("token")) {
                swal("", "Please Login!", "warning").then(function() {
                    window.location.href = "./login.html";
                });
                return;
            }
            
            try {
                const doctorCard = btn.closest('.doctor-card');
                const doctorInfo = {
                    img: doctorCard.querySelector('input[type="hidden"]:nth-child(5)').value,
                    name: doctorCard.querySelector('input[type="hidden"]:nth-child(1)').value,
                    dept: doctorCard.querySelector('input[type="hidden"]:nth-child(2)').value,
                    exp: doctorCard.querySelector('input[type="hidden"]:nth-child(3)').value + ' years',
                    qual: doctorCard.querySelector('input[type="hidden"]:nth-child(4)').value,
                    docID: btn.getAttribute('data-doctor-id'),
                    appointmentType: 'video'
                };
                
                // Store doctor info and redirect to patient details
                localStorage.setItem("docObj", JSON.stringify(doctorInfo));
                localStorage.setItem("appointmentType", "video");
                window.location.href = "./patient_details.html";
                
            } catch (error) {
                console.error('Error processing booking:', error);
                swal("Error", "Failed to process booking. Please try again.", "error");
            }
        });
    });
}

// Enhanced search with debouncing
let searchTimeout;
let searchInput = document.getElementById('search-doctor');
searchInput.addEventListener("input", async (e) => {
    clearTimeout(searchTimeout);
    const searchVal = searchInput.value.trim();
    
    if (searchVal.length === 0) {
        getdata();
        return;
    }
    
    // Debounce search requests
    searchTimeout = setTimeout(async () => {
        try {
            showLoading();
            const response = await fetch(`${baseURL}/doctor/search?q=${encodeURIComponent(searchVal)}`, {
                headers: getAuthHeaders(),
                signal: AbortSignal.timeout(5000)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            hideLoading();
            
            if (!data || data.length === 0) {
                showNoDoctors(`No doctors found matching "${searchVal}"`);
            } else {
                renderdata(data);
            }
            
        } catch (error) {
            console.error('Search error:', error);
            hideLoading();
            showError(`Search failed: ${error.message}`);
        }
    }, 300);
});

// Enhanced department filtering
let departmentFilter = document.getElementById('filter-department');
departmentFilter.addEventListener("change", async (e) => {
    const filterValue = departmentFilter.value;
    
    if (!filterValue) {
        getdata();
        return;
    }
    
    try {
        showLoading();
        const response = await fetch(`${baseURL}/doctor/availableDoctors/${filterValue}`, {
            headers: getAuthHeaders(),
            signal: AbortSignal.timeout(5000)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        hideLoading();
        
        if (data.msg) {
            swal("", `${data.msg}`, "info").then(function() {
                getdata();
            });
        } else {
            renderdata(data.doctor);
        }
        
    } catch (error) {
        console.error('Filter error:', error);
        hideLoading();
        showError(`Filter failed: ${error.message}`);
    }
});

// Availability filter
let availabilityFilter = document.getElementById('filter-availability');
availabilityFilter.addEventListener("change", (e) => {
    const filterValue = availabilityFilter.value;
    
    if (!filterValue) {
        getdata();
        return;
    }
    
    // Filter the cached data based on availability
    if (doctorsCache) {
        let filteredDoctors = doctorsCache;
        
        if (filterValue === 'available') {
            filteredDoctors = doctorsCache.filter(doctor => 
                doctor.status && doctor.is_available
            );
        } else if (filterValue === 'today') {
            filteredDoctors = doctorsCache.filter(doctor => 
                doctor.status && doctor.is_available
            );
        }
        
        if (filteredDoctors.length === 0) {
            showNoDoctors(`No doctors available with the selected criteria.`);
        } else {
            renderdata(filteredDoctors);
        }
    }
});

// Initialize on page load
window.addEventListener("load", async (e) => {
    let deptID = localStorage.getItem("deptID");
    if (deptID) {
        try {
            showLoading();
            const response = await fetch(`${baseURL}/doctor/availableDoctors/${deptID}`, {
                headers: getAuthHeaders(),
                signal: AbortSignal.timeout(10000)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            hideLoading();
            
            if (data.msg) {
                swal("", `${data.msg}`, "info").then(function() {
                    getdata();
                });
            } else {
                renderdata(data.doctor);
            }
            
            localStorage.removeItem("deptID");
        } catch (err) {
            console.error('Department filter error:', err);
            hideLoading();
            showError(`Failed to load doctors for department: ${err.message}`);
        }
    } else {
        getdata();
    }
});

// Add refresh functionality
window.addEventListener('focus', () => {
    // Refresh data when user returns to the tab (if cache is expired)
    const now = Date.now();
    if (!doctorsCache || (now - lastFetchTime) >= CACHE_DURATION) {
        getdata();
    }
}); 