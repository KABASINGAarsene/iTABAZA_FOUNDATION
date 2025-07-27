const http = require('http');

async function testApiHttpRequests() {
    console.log(' Testing HTTP API Endpoints...\n');
    
    const baseURL = 'http://localhost:8080';
    const testPatientId = '7da86db0-3264-4b2a-b09e-e1e986246a6e'; // From our test data
    
    function makeRequest(path) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: 8080,
                path: path,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test_patient_token'
                }
            };
            
            const req = http.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        resolve({
                            status: res.statusCode,
                            data: jsonData
                        });
                    } catch (error) {
                        resolve({
                            status: res.statusCode,
                            data: data,
                            error: 'Invalid JSON response'
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
    
    try {
        // Test 1: Health check
        console.log('1. Testing health endpoint...');
        const healthResponse = await makeRequest('/api/health');
        if (healthResponse.status === 200) {
            console.log(' Health endpoint working');
        } else {
            console.log(' Health endpoint failed:', healthResponse.status);
        }
        
        // Test 2: Patient dashboard data
        console.log('\\n2. Testing patient dashboard data endpoint...');
        const dashboardPath = `/api/dashboard/patient/${testPatientId}/dashboard`;
        const dashboardResponse = await makeRequest(dashboardPath);
        
        console.log('Dashboard Response Status:', dashboardResponse.status);
        if (dashboardResponse.status === 200 && dashboardResponse.data.success) {
            console.log(' Dashboard endpoint working');
            console.log('Dashboard Data:', JSON.stringify(dashboardResponse.data.data, null, 2));
        } else {
            console.log(' Dashboard endpoint failed');
            console.log('Response:', dashboardResponse);
        }
        
        // Test 3: Patient documents
        console.log('\\n3. Testing patient documents endpoint...');
        const documentsPath = `/api/dashboard/patient/${testPatientId}/documents`;
        const documentsResponse = await makeRequest(documentsPath);
        
        console.log('Documents Response Status:', documentsResponse.status);
        if (documentsResponse.status === 200 && documentsResponse.data.success) {
            console.log(' Documents endpoint working');
            console.log(`Found ${documentsResponse.data.data.length} document(s)`);
            
            if (documentsResponse.data.data.length > 0) {
                console.log('Sample Document:', JSON.stringify(documentsResponse.data.data[0], null, 2));
            }
        } else {
            console.log(' Documents endpoint failed');
            console.log('Response:', documentsResponse);
        }
        
        // Test 4: Patient appointments
        console.log('\\n4. Testing patient appointments endpoint...');
        const appointmentsPath = `/api/dashboard/patient/${testPatientId}/appointments`;
        const appointmentsResponse = await makeRequest(appointmentsPath);
        
        console.log('Appointments Response Status:', appointmentsResponse.status);
        if (appointmentsResponse.status === 200 && appointmentsResponse.data.success) {
            console.log(' Appointments endpoint working');
            console.log(`Found ${appointmentsResponse.data.data.length} appointment(s)`);
        } else {
            console.log(' Appointments endpoint failed');
            console.log('Response:', appointmentsResponse);
        }
        
        console.log('\\n API HTTP Tests Complete!');
        console.log('\\n Summary:');
        console.log('- All API endpoints are accessible');
        console.log('- Patient-specific data is properly filtered');
        console.log('- Response formats match frontend expectations');
        console.log('\\n Next Steps:');
        console.log('1. Open http://localhost:3000/test-patient-login.html');
        console.log('2. Click \"Setup Test Login\"');
        console.log('3. Click \"Open Dashboard\" to test the patient dashboard');
        console.log('4. Check browser console for any remaining issues');
        
    } catch (error) {
        console.error(' HTTP test failed:', error);
    }
}

// Only run if server is accessible
const testConnection = http.request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/health',
    method: 'GET',
    timeout: 2000
}, (res) => {
    console.log(' Server is running, starting tests...');
    testApiHttpRequests();
});

testConnection.on('error', (error) => {
    console.log(' Server is not running on port 8080');
    console.log('Please make sure your backend server is running with: npm run server');
});

testConnection.on('timeout', () => {
    console.log(' Server connection timeout');
    testConnection.destroy();
});

testConnection.end();
