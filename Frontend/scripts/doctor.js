import { baseURL, apiRequest, getAuthHeaders } from "./baseURL.js";

let docsCont = document.getElementById("doctors-cont");
let isLoading = false;
let doctorsCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

let depObj = {};
let departmentsLoaded = false;

// Fetch all departments and build the mapping
async function loadDepartments() {
    try {
        const response = await fetch(`${baseURL}/department/all`, {
            headers: getAuthHeaders(),
        });
        if (response.ok) {
            const data = await response.json();
            depObj = {};
            
            // Build department mapping
            data.departments.forEach(dept => {
                depObj[dept.id] = dept.dept_name;
            });
            
            // Populate the department dropdown
            const departmentSelect = document.querySelector('#doc-sf-right select');
            if (departmentSelect) {
                // Clear existing options except 'All'
                departmentSelect.innerHTML = '<option value="">All</option>';
                
                // Add departments from API
                data.departments.forEach(dept => {
                    const option = document.createElement('option');
                    option.value = dept.id;
                    option.textContent = dept.dept_name;
                    departmentSelect.appendChild(option);
                });
            }
            
            departmentsLoaded = true;
        } else {
            console.error('Failed to fetch departments:', response.status);
            // Fallback: keep existing HTML options if API fails
        }
    } catch (err) {
        console.error('Error loading departments:', err);
        // Fallback: keep existing HTML options if API fails
    }
}

// Function to get department name with fallback
function getDepartmentName(departmentId) {
    if (!departmentId) return 'Unknown Department';
    if (depObj[departmentId]) {
        return depObj[departmentId];
    }
    return `Unknown Department`;
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
    docsCont.innerHTML = `
        <div class="loading-container" style="text-align: center; padding: 50px;">
            <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #0077c0; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
            <p style="color: #666; font-size: 16px;">Loading doctors...</p>
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
    docsCont.innerHTML = `
        <div class="error-container" style="text-align: center; padding: 50px;">
            <div style="color: #dc3545; font-size: 48px; margin-bottom: 20px;">⚠️</div>
            <h3 style="color: #dc3545; margin-bottom: 10px;">Oops! Something went wrong</h3>
            <p style="color: #666; margin-bottom: 20px;">${message}</p>
            <button onclick="location.reload()" style="background: #0077c0; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">
                Try Again
            </button>
        </div>
    `;
}

function showNoDoctors(message = "No doctors available at the moment.") {
    docsCont.innerHTML = `
        <div class="no-doctors-container" style="text-align: center; padding: 50px;">
            <div style="color: #6c757d; font-size: 48px; margin-bottom: 20px;">👨‍⚕️</div>
            <h3 style="color: #6c757d; margin-bottom: 10px;">No Doctors Found</h3>
            <p style="color: #666; margin-bottom: 20px;">${message}</p>
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

    const isRowView = docsCont.classList.contains('row-view');
    docsCont.innerHTML = arr.map((elem, index) => {
        if (!elem || !elem.doctor_name) {
            console.warn('Invalid doctor data:', elem);
            return '';
        }
        const departmentName = getDepartmentName(elem.department_id);
        const isAvailable = elem.status && elem.is_available;

        if (isRowView) {
            // Full info row: image, name, department, experience, qualification, fee, availability, and Book button
            return `
                <div class="doc-card minimal-row">
                    <div class="doc-img"><img alt="doc-pfp" src="${getSafeImageUrl(elem.image)}" /></div>
                    <div class="row-info">
                        <div class="row-name">${elem.doctor_name}</div>
                        <div class="row-dept">Department: ${departmentName}</div>
                        <div class="row-exp">Experience: ${elem.experience || 'Not specified'} years</div>
                        <div class="row-qual">Qualification: ${elem.qualifications || 'Not specified'}</div>
                        <div class="row-fee">Rs.1,000 Consultation Fee</div>
                        <div class="row-available">${isAvailable ? 'Available' : 'Not Available'}</div>
                    </div>
                    <div class="row-action">
                        <button class="row-book-btn" ${!isAvailable ? 'disabled style="opacity:0.5;pointer-events:none;"' : ''}>Book Appointment</button>
                    </div>
                </div>
            `;
        } else {
            // Clean, minimal card view (no date/slot selection)
            return `
                <div class="doc-card" style="opacity: ${isAvailable ? '1' : '0.7'}">
                    <div class="top-cont">
                        <div class="doc-profile">
                            <div class="doc-img">
                                <img alt="doc-pfp" 
                                     src="${getSafeImageUrl(elem.image)}" 
                                     onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9Ijc1IiB5PSI3NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2NjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RG9jdG9yPC90ZXh0Pgo8L3N2Zz4K';" />
                            </div>
                            <div class="doc-desc">
                                <h2>${elem.doctor_name}</h2>
                                <h4>Department: ${departmentName}</h4>
                                <p>Experience: ${elem.experience || 'Not specified'} years</p>
                                <h4>Qualification: ${elem.qualifications || 'Not specified'}</h4>
                                <p style="color:white; display: none;">${elem._id || elem.id}</p>
                                <p>Rs.1,000 Consultation Fee</p>
                                <p style="color: #28a745">${isAvailable ? 'Available' : 'Not Available'}</p>
                            </div>
                        </div>
                        <div class="doc-book" style="display: flex; align-items: center; justify-content: center;">
                            <button class="clean-book-btn" style="padding:12px 24px;background:#0b9c6c;color:#fff;border:none;border-radius:8px;cursor:pointer;${!isAvailable ? 'opacity:0.5;pointer-events:none;' : ''}">
                                Book Appointment
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }).join("");

    // Only attach form listeners in card view
    if (!isRowView) {
        // Attach booking button listeners for clean card view
        let bookBtns = document.querySelectorAll('.clean-book-btn');
        bookBtns.forEach((btn, idx) => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                if (!localStorage.getItem("token")) {
                    swal("", "Please Login!", "warning").then(function() {
                        window.location.href = "./login.html";
                    });
                    return;
                }
                try {
                    const doctorCard = btn.closest('.doc-card');
                    const doctorInfo = {
                        img: doctorCard.querySelector('.doc-img img').src,
                        name: doctorCard.querySelector('.doc-desc h2').textContent,
                        dept: doctorCard.querySelector('.doc-desc h4').textContent,
                        exp: doctorCard.querySelector('.doc-desc p').textContent,
                        qual: doctorCard.querySelector('.doc-desc h4:nth-of-type(2)').textContent,
                        docID: doctorCard.querySelector('.doc-desc p[style*="color:white"]').textContent
                    };
                    // Assume appointment is for today (per day only)
                    const formObj = {
                        date: new Date().toISOString().split('T')[0],
                        slot: 'default' // No slot selection
                    };
                    const result = await swal({
                        title: "Confirm Booking?",
                        text: `Book appointment with Dr. ${doctorInfo.name}?`,
                        icon: "info",
                        buttons: ["Cancel", "Confirm"],
                        dangerMode: false,
                    });
                    if (result) {
                        localStorage.setItem("formObj", JSON.stringify(formObj));
                        localStorage.setItem("docObj", JSON.stringify(doctorInfo));
                        window.location.href = "./patient_details.html";
                    }
                } catch (error) {
                    console.error('Error processing booking:', error);
                    swal("Error", "Failed to process booking. Please try again.", "error");
                }
            });
        });
    } else {
        // Attach row view listeners: Book button and row click
        let rowCards = document.querySelectorAll('.doc-card.minimal-row');
        rowCards.forEach((row, idx) => {
            const bookBtn = row.querySelector('.row-book-btn');
            // Book button click
            bookBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const elem = arr[idx];
                if (!elem) return;
                // Prepare full doctor info for booking
                const doctorInfo = {
                    img: getSafeImageUrl(elem.image),
                    name: elem.doctor_name,
                    dept: getDepartmentName(elem.department_id),
                    exp: (elem.experience || 'Not specified') + ' years',
                    qual: elem.qualifications || 'Not specified',
                    docID: elem._id || elem.id
                };
                localStorage.setItem("docObj", JSON.stringify(doctorInfo));
                // For row view, you may want to ask for slot/date on next page
                window.location.href = "./patient_details.html";
            });
            // Row click for future details
            row.addEventListener('click', (e) => {
                if (e.target.classList.contains('row-book-btn')) return;
                // Placeholder: show alert or open modal for doctor details
                // In future, replace with modal or navigation
                alert('Doctor details coming soon!');
            });
        });
    }
}

// Enhanced search with debouncing
let searchTimeout;
let docInputTag = document.querySelector("#doc-sf-left>input");
docInputTag.addEventListener("input", async (e) => {
    clearTimeout(searchTimeout);
    const searchVal = docInputTag.value.trim();
    
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
let docFilterTag = document.querySelector("#doc-sf-right>select");
docFilterTag.addEventListener("change", async (e) => {
    const filterValue = docFilterTag.value;
    
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

// Initialize on page load
window.addEventListener("load", async (e) => {
    await loadDepartments();
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

// View toggle logic
const cardViewBtn = document.getElementById('card-view-btn');
const rowViewBtn = document.getElementById('row-view-btn');

function setCardView() {
    docsCont.classList.remove('row-view');
    docsCont.classList.add('card-view');
    if (cardViewBtn) cardViewBtn.style.color = '#0077c0';
    if (rowViewBtn) rowViewBtn.style.color = '#333';
}

function setRowView() {
    docsCont.classList.add('row-view');
    docsCont.classList.remove('card-view');
    if (rowViewBtn) rowViewBtn.style.color = '#0077c0';
    if (cardViewBtn) cardViewBtn.style.color = '#333';
}

if (cardViewBtn && rowViewBtn) {
    cardViewBtn.addEventListener('click', () => {
        setCardView();
        if (doctorsCache) renderdata(doctorsCache);
    });
    rowViewBtn.addEventListener('click', () => {
        setRowView();
        if (doctorsCache) renderdata(doctorsCache);
    });
}

// Set default view to card view on load
setCardView();
