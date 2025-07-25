#!/usr/bin/env node

const http = require('http');
const path = require('path');
const fs = require('fs');

// Test server connection
async function testServerConnection() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8080,
            path: '/api/health',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        data: response
                    });
                } catch (error) {
                    resolve({
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

// Test client dashboard file existence
function testClientDashboardFiles() {
    const files = [
        'Frontend/client-dashboard.html',
        'Backend/Frontend/patient-dashboard-new.html',
        'Backend/Frontend/Scripts/patient-dashboard-new.js',
        'Frontend/Scripts/baseURL.js'
    ];

    const results = {};
    
    files.forEach(file => {
        const fullPath = path.join(__dirname, file);
        results[file] = fs.existsSync(fullPath);
    });

    return results;
}

// Main test function
async function runTests() {
    console.log(' Testing Client Dashboard Setup...\n');
    
    // Test 1: Server Connection
    console.log('1. Testing server connection...');
    try {
        const serverResponse = await testServerConnection();
        if (serverResponse.status === 200) {
            console.log(' Server is running and accessible');
            console.log(`   Response: ${JSON.stringify(serverResponse.data)}`);
        } else {
            console.log(` Server returned status: ${serverResponse.status}`);
        }
    } catch (error) {
        console.log(` Server connection failed: ${error.message}`);
        console.log('   Make sure your backend server is running on port 8080');
    }

    console.log();

    // Test 2: File Existence
    console.log('2. Testing client dashboard files...');
    const fileResults = testClientDashboardFiles();
    
    Object.entries(fileResults).forEach(([file, exists]) => {
        if (exists) {
            console.log(` ${file} - Found`);
        } else {
            console.log(` ${file} - Missing`);
        }
    });

    console.log();

    // Test 3: Check for JavaScript syntax errors
    console.log('3. Testing JavaScript syntax...');
    const dashboardFile = path.join(__dirname, 'Frontend/client-dashboard.html');
    
    if (fs.existsSync(dashboardFile)) {
        const content = fs.readFileSync(dashboardFile, 'utf8');
        
        // Check for common JavaScript issues
        const checks = [
            {
                name: 'showPage function definition',
                test: content.includes('function showPage(pageId, eventTarget = null)')
            },
            {
                name: 'Support form handler',
                test: content.includes('supportForm.addEventListener')
            },
            {
                name: 'Error handling in API calls',
                test: content.includes('try {') && content.includes('catch (error)')
            },
            {
                name: 'Menu onclick handlers updated',
                test: content.includes('onclick="showPage(\'dashboard\', this)"')
            }
        ];

        checks.forEach(check => {
            if (check.test) {
                console.log(` ${check.name} - OK`);
            } else {
                console.log(` ${check.name} - Issue detected`);
            }
        });
    } else {
        console.log(' client-dashboard.html not found');
    }

    console.log();

    // Test 4: Database connection check
    console.log('4. Testing database connection...');
    try {
        const dbTestResponse = await testDatabaseEndpoint();
        if (dbTestResponse.status === 200) {
            console.log(' Database connection working');
        } else {
            console.log(` Database test failed with status: ${dbTestResponse.status}`);
        }
    } catch (error) {
        console.log(` Database test failed: ${error.message}`);
    }

    console.log();
    console.log(' Test Summary:');
    console.log('   If all tests pass, your client dashboard should work correctly.');
    console.log('   If any tests fail, please fix the issues and run the tests again.');
    console.log();
    console.log(' To test the client dashboard:');
    console.log('   1. Open http://localhost:8080/api/health in your browser');
    console.log('   2. Open Frontend/client-dashboard.html in your browser');
    console.log('   3. Test the navigation and support form');
}

// Test database endpoint
async function testDatabaseEndpoint() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8080,
            path: '/test-supabase',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    data: data
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

// Run the tests
runTests().catch(console.error);
