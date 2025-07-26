import { baseURL, apiRequest, getAuthHeaders } from "./baseURL.js";

let docsCont = document.getElementById("doctors-cont");
let isLoading = false;
let doctorsCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Department cache object - will be populated from API
let depObj = {};
let departmentsLoaded = false;

// Load departments from API and cache them
async function loadDepartments() {
    if (departmentsLoaded) return;
    
    try {
        const response = await fetch(`${baseURL}/department/all`, {
            method: 'GET',
            headers: getAuthHeaders()
            });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Departments loaded:', data);
        
        // Clear existing departments and populate with real data
        depObj = {};
        if (data.departments && Array.isArray(data.departments)) {
            data.departments.forEach(dept => {
                depObj[dept.id] = dept.dept_name;
            });
        }
        
        departmentsLoaded = true;
        console.log('Department mapping created:', depObj);

        } catch (error) {
        console.error('Error loading departments:', error);
        // Fallback to hardcoded departments if API fails
        depObj = {
            1: "Neurology",
            2: "Dermatology", 
            3: "Dental",
            4: "Ayurveda",
            5: "Gastroenterology",
            6: "Gynaecology",
            7: "ENT",
            8: "General Physician",
            9: "Orthopedic",
            10: "Cardiology"
        };
        departmentsLoaded = true;
    }
}

// Fast synchronous function to get department name from cache
function getDepartmentName(departmentId) {
    if (!departmentId) return 'Unknown Department';
    return depObj[departmentId] || `Unknown Department (ID: ${departmentId})`;
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
            <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #28a745; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
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
            <button onclick="location.reload()" style="background: #28a745; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">
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
    
    // Load departments first if not already loaded
    await loadDepartments();
    
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