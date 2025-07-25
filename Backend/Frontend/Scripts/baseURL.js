// Base URL configuration for API calls
// Frontend runs on port 3000, backend on port 8080
const baseURL = 'http://localhost:8080';

// Common API response handler
async function handleApiResponse(response) {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || 'Request failed');
    }
    return await response.json();
}

// Get authentication headers for API requests
function getAuthHeaders() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}

// Export for use in other modules
export { baseURL, handleApiResponse, getAuthHeaders };
