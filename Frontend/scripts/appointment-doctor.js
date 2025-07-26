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