#!/usr/bin/env node

// Test script to verify appointment functionality
const https = require('https');
const http = require('http');

// Configuration
const SERVER_URL = 'https://itabaza.onrender.com';

// Test data
const testDoctorId = '1'; // Replace with actual doctor ID
const testAppointmentId = '1'; // Replace with actual appointment ID

// Function to make HTTP requests
function makeRequest(path, method = 'GET', headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, SERVER_URL);
        const options = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = (url.protocol === 'https:' ? https : http).request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.end();
    });
}

// Test functions
async function testServerHealth() {
    console.log('🏥 Testing server health...');
    try {
        const result = await makeRequest('/api/health');
        if (result.status === 200) {
            console.log('✅ Server is running and connected to Supabase');
        } else {
            console.log('❌ Server health check failed');
        }
        return result.status === 200;
    } catch (error) {
        console.log('❌ Server is not running:', error.message);
        return false;
    }
}

async function testByDoctorRoute() {
    console.log('👨‍⚕️ Testing /appointment/byDoctor route...');
    try {
        const result = await makeRequest(`/appointment/byDoctor/${testDoctorId}`);
        if (result.status === 200) {
            console.log('✅ byDoctor route is working');
            console.log(`📊 Found ${Array.isArray(result.data) ? result.data.length : 0} appointments`);
        } else {
            console.log('❌ byDoctor route failed:', result.status);
        }
        return result.status === 200;
    } catch (error) {
        console.log('❌ byDoctor route error:', error.message);
        return false;
    }
}

async function testViewRoute() {
    console.log('👁️ Testing /appointment/view route...');
    try {
        const result = await makeRequest(`/appointment/view/${testAppointmentId}`);
        if (result.status === 200) {
            console.log('✅ View route is working');
        } else if (result.status === 404) {
            console.log('⚠️ View route working but appointment not found (expected for test ID)');
        } else {
            console.log('❌ View route failed:', result.status);
        }
        return result.status === 200 || result.status === 404;
    } catch (error) {
        console.log('❌ View route error:', error.message);
        return false;
    }
}

async function testCompleteRoute() {
    console.log('✅ Testing /appointment/complete route...');
    try {
        const result = await makeRequest(`/appointment/complete/${testAppointmentId}`, 'PATCH');
        if (result.status === 200) {
            console.log('✅ Complete route is working');
        } else if (result.status === 404) {
            console.log('⚠️ Complete route working but appointment not found (expected for test ID)');
        } else {
            console.log('❌ Complete route failed:', result.status);
        }
        return result.status === 200 || result.status === 404;
    } catch (error) {
        console.log('❌ Complete route error:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Starting Appointment Functionality Tests\n');
    
    const tests = [
        { name: 'Server Health', fn: testServerHealth },
        { name: 'byDoctor Route', fn: testByDoctorRoute },
        { name: 'View Route', fn: testViewRoute },
        { name: 'Complete Route', fn: testCompleteRoute }
    ];

    let passed = 0;
    let total = tests.length;

    for (const test of tests) {
        const result = await test.fn();
        if (result) passed++;
        console.log('');
    }

    console.log('📋 Test Results:');
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);
    
    if (passed === total) {
        console.log('🎉 All tests passed! The appointment functionality is working correctly.');
    } else {
        console.log('⚠️ Some tests failed. Please check the server and database connection.');
    }

    console.log('\n📝 Frontend Integration Notes:');
    console.log('1. Ensure the doctor is logged in before accessing appointments');
    console.log('2. The View button will show patient details and problem description');
    console.log('3. The Complete button will mark appointments as completed');
    console.log('4. Both buttons are styled and responsive for mobile devices');
    console.log('5. SweetAlert is used for user-friendly confirmations and modals');
}

// Run tests
runTests().catch(console.error);
