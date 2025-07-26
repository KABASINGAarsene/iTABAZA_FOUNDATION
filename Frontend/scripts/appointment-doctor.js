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