const axios = require('axios');

// Configuration - adjust these based on your server setup
const BASE_URL = 'http://localhost:3000'; // Change this to your actual server URL
const ADMIN_EMAIL = 'admin@itabaza.com';
const ADMIN_PASSWORD = 'k@#+ymej@AQ@3';

// Test admin login via the API endpoint
async function testAdminLoginAPI() {
    try {
        console.log('🧪 Testing admin login via API...');
        console.log('URL:', `${BASE_URL}/api/admin/login`);
        console.log('Email:', ADMIN_EMAIL);
        
        const response = await axios.post(`${BASE_URL}/api/admin/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });

        if (response.data.success) {
            console.log('✅ Admin login API test successful!');
            console.log('Response:', {
                success: response.data.success,
                admin: response.data.admin,
                token: response.data.token ? '[TOKEN_RECEIVED]' : 'No token'
            });
            
            return {
                success: true,
                token: response.data.token,
                admin: response.data.admin
            };
        } else {
            console.error('❌ Admin login failed:', response.data);
            return { success: false };
        }

    } catch (error) {
        console.error('❌ Error testing admin login API:', error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
}

// Test admin login via the alternative endpoint
async function testAdminLoginAlternativeAPI() {
    try {
        console.log('\n🧪 Testing admin login via alternative API...');
        console.log('URL:', `${BASE_URL}/api/adminDash/signin`);
        console.log('Email:', ADMIN_EMAIL);
        
        const response = await axios.post(`${BASE_URL}/api/adminDash/signin`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });

        console.log('✅ Admin alternative login API test completed!');
        console.log('Response:', response.data);
        
        return response.data;

    } catch (error) {
        console.error('❌ Error testing admin alternative login API:', error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
}

// Test admin dashboard access with token
async function testAdminDashboard(token) {
    try {
        console.log('\n🧪 Testing admin dashboard access...');
        
        const response = await axios.get(`${BASE_URL}/api/admin/dashboard/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Admin dashboard access test successful!');
        console.log('Dashboard stats:', response.data);
        
        return response.data;

    } catch (error) {
        console.error('❌ Error testing admin dashboard:', error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
}

// Main test function
async function main() {
    console.log('🚀 Testing admin login functionality...\n');
    
    // Test primary admin login endpoint
    const loginResult = await testAdminLoginAPI();
    
    // Test alternative admin login endpoint
    const altLoginResult = await testAdminLoginAlternativeAPI();
    
    // If we have a token, test dashboard access
    if (loginResult.success && loginResult.token) {
        await testAdminDashboard(loginResult.token);
    }
    
    console.log('\n📋 Test Summary:');
    console.log('Primary login endpoint:', loginResult.success ? '✅ PASSED' : '❌ FAILED');
    console.log('Alternative login endpoint:', altLoginResult.message ? '✅ PASSED' : '❌ FAILED');
    
    if (loginResult.success) {
        console.log('\n🔐 Your admin credentials are working correctly!');
        console.log('Email:', ADMIN_EMAIL);
        console.log('Password:', ADMIN_PASSWORD);
        console.log('\n📝 You can now use these credentials to login to your admin dashboard.');
    }
}

// Handle different scenarios
async function checkServerStatus() {
    try {
        console.log('🔍 Checking if server is running...');
        const response = await axios.get(`${BASE_URL}/api/health`);
        console.log('✅ Server is running');
        return true;
    } catch (error) {
        console.log('⚠️  Server might not be running or health endpoint not available');
        console.log('Make sure your server is running on', BASE_URL);
        return false;
    }
}

// Run the tests
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    testAdminLoginAPI,
    testAdminLoginAlternativeAPI,
    testAdminDashboard,
    checkServerStatus
};
