const { supabase } = require('./config/db');

async function createTestPatientLogin() {
    console.log(' Creating test patient login data...\n');
    
    try {
        // Get a real user from the database
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('*')
            .limit(1);
        
        if (userError || !users || users.length === 0) {
            console.log(' No users found in database');
            return;
        }
        
        const testUser = users[0];
        console.log(' Found test user:', testUser);
        
        // Create a mock patient login session
        const patientInfo = {
            id: testUser.id,
            first_name: testUser.first_name,
            last_name: testUser.last_name,
            email: testUser.email,
            mobile: testUser.mobile
        };
        
        const patientToken = 'test_patient_token_' + Date.now();
        
        console.log('\n Test patient login data:');
        console.log('Patient Info:', JSON.stringify(patientInfo, null, 2));
        console.log('Patient Token:', patientToken);
        
        // Create an HTML file with JavaScript to set localStorage
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Patient Login Setup</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .success { color: #28a745; }
        .info { color: #17a2b8; }
        .button {
            background-color: #007bff;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin: 10px 5px;
        }
        .button:hover { background-color: #0056b3; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h2>🔧 Test Patient Login Setup</h2>
        
        <div class="info">
            <p><strong>Test User Information:</strong></p>
            <pre>${JSON.stringify(patientInfo, null, 2)}</pre>
        </div>
        
        <div class="info">
            <p><strong>Test Token:</strong></p>
            <pre>${patientToken}</pre>
        </div>
        
        <button class="button" onclick="setupLogin()">Setup Test Login</button>
        <button class="button" onclick="clearLogin()">Clear Login</button>
        <button class="button" onclick="openDashboard()">Open Dashboard</button>
        
        <div id="status"></div>
        
        <script>
            const patientInfo = ${JSON.stringify(patientInfo)};
            const patientToken = '${patientToken}';
            
            function setupLogin() {
                localStorage.setItem('patientInfo', JSON.stringify(patientInfo));
                localStorage.setItem('patientToken', patientToken);
                
                sessionStorage.setItem('patientInfo', JSON.stringify(patientInfo));
                sessionStorage.setItem('patientToken', patientToken);
                
                document.getElementById('status').innerHTML = 
                    '<div class="success"><p> Test login data set successfully!</p></div>';
                
                console.log(' Patient login data set:', patientInfo);
            }
            
            function clearLogin() {
                localStorage.removeItem('patientInfo');
                localStorage.removeItem('patientToken');
                sessionStorage.removeItem('patientInfo');
                sessionStorage.removeItem('patientToken');
                
                document.getElementById('status').innerHTML = 
                    '<div class="info"><p> Login data cleared</p></div>';
                
                console.log(' Patient login data cleared');
            }
            
            function openDashboard() {
                window.open('/patient-dashboard-new.html', '_blank');
            }
            
            // Auto-setup on page load
            window.onload = function() {
                setupLogin();
            };
        </script>
    </div>
</body>
</html>
        `;
        
        // Write the HTML file
        const fs = require('fs');
        const path = require('path');
        
        const htmlPath = path.join(__dirname, 'Frontend', 'test-patient-login.html');
        fs.writeFileSync(htmlPath, htmlContent);
        
        console.log('\n Test patient login HTML file created at:', htmlPath);
        console.log('\n Instructions:');
        console.log('1. Open your browser and go to: http://localhost:3000/test-patient-login.html');
        console.log('2. Click "Setup Test Login" to set the patient login data');
        console.log('3. Click "Open Dashboard" to test the patient dashboard');
        console.log('4. Check the browser console for debugging information');
        
        // Also create some test documents for this patient
        console.log('\n Creating test documents...');
        
        const { data: doctors } = await supabase
            .from('doctors')
            .select('id, doctor_name')
            .limit(1);
        
        if (doctors && doctors.length > 0) {
            const testDoctorId = doctors[0].id;
            
            const testDocuments = [
                {
                    patient_id: testUser.id,
                    doctor_id: testDoctorId,
                    appointment_id: null,
                    document_name: 'Blood Test Results.pdf',
                    document_type: 'lab_report',
                    file_url: 'https://example.com/blood-test-results.pdf',
                    file_name: 'blood_test_results.pdf',
                    file_size: 1024,
                    mime_type: 'application/pdf',
                    description: 'Complete blood count and chemistry panel',
                    medical_notes: 'All values within normal range',
                    doctor_comments: 'Patient shows good health indicators',
                    document_category: 'medical',
                    is_accessible_to_patient: true,
                    status: 'active',
                    document_date: new Date().toISOString().split('T')[0]
                },
                {
                    patient_id: testUser.id,
                    doctor_id: testDoctorId,
                    appointment_id: null,
                    document_name: 'X-Ray Report.pdf',
                    document_type: 'imaging',
                    file_url: 'https://example.com/xray-report.pdf',
                    file_name: 'xray_report.pdf',
                    file_size: 2048,
                    mime_type: 'application/pdf',
                    description: 'Chest X-ray examination',
                    medical_notes: 'Clear chest X-ray, no abnormalities detected',
                    doctor_comments: 'Lungs and heart appear normal',
                    document_category: 'medical',
                    is_accessible_to_patient: true,
                    status: 'active',
                    document_date: new Date().toISOString().split('T')[0]
                }
            ];
            
            const { data: insertedDocs, error: insertError } = await supabase
                .from('patient_documents')
                .insert(testDocuments)
                .select();
            
            if (insertError) {
                console.log(' Error creating test documents:', insertError);
            } else {
                console.log(` Created ${insertedDocs.length} test documents`);
            }
        }
        
        console.log('\n Test setup complete!');
        
    } catch (error) {
        console.error(' Error creating test patient login:', error);
    }
}

createTestPatientLogin();
