const baseURL = 'http://127.0.0.1:8080';

async function testDoctorLogin() {
    try {
        console.log(' Testing doctor login and name display fix...');
        
        // Get available doctors first
        console.log('\n Getting available doctors...');
        const doctorsResponse = await fetch(`${baseURL}/doctor/allDoctor`);
        const doctorsData = await doctorsResponse.json();
        
        // Check different possible response formats
        let doctors = [];
        if (doctorsData.doctor) {
            doctors = doctorsData.doctor;
        } else if (doctorsData.data) {
            doctors = doctorsData.data;
        }
        
        if (!doctors || doctors.length === 0) {
            console.error(' No doctors available for testing');
            console.log('Response:', doctorsData);
            return;
        }
        
        const firstDoctor = doctors[0];
        console.log(` Found doctor: ${firstDoctor.doctor_name} (${firstDoctor.email})`);
        console.log(`   Qualifications: ${firstDoctor.qualifications}`);
        
        // Test login with the first available doctor
        console.log(`\n Testing login with doctor: ${firstDoctor.email}`);
        
        const loginResponse = await fetch(`${baseURL}/api/dashboard/doctor/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: firstDoctor.email,
                password: 'password123' // Temporary password since we're not implementing real auth yet
            })
        });
        
        const loginData = await loginResponse.json();
        console.log(' Login Response:', JSON.stringify(loginData, null, 2));
        
        if (loginData.success && loginData.doctor) {
            console.log('\n Login successful! Doctor information:');
            console.log(`   ID: ${loginData.doctor.id}`);
            console.log(`   Doctor Name: ${loginData.doctor.doctor_name}`);
            console.log(`   Name (backward compatibility): ${loginData.doctor.name}`);
            console.log(`   Email: ${loginData.doctor.email}`);
            console.log(`   Qualifications: ${loginData.doctor.qualifications}`);
            console.log(`   Department ID: ${loginData.doctor.department_id}`);
            
            // Test how frontend would use this data
            console.log('\n Frontend Display Test:');
            const doctorNameDisplay = loginData.doctor.doctor_name || 'Dr. John Doe';
            const qualificationsDisplay = loginData.doctor.qualifications || 'General Practitioner';
            console.log(`   Dashboard would show: "${doctorNameDisplay}"`);
            console.log(`   Specialty would show: "${qualificationsDisplay}"`);
            
            // Simulate localStorage storage like frontend does
            const storedDoctorInfo = JSON.stringify(loginData.doctor);
            console.log('\n Data that would be stored in localStorage:');
            console.log(storedDoctorInfo);
            
            // Parse it back like frontend does
            const parsedInfo = JSON.parse(storedDoctorInfo);
            console.log('\n How frontend would parse stored data:');
            console.log(`   parsedInfo.doctor_name: "${parsedInfo.doctor_name}"`);
            console.log(`   parsedInfo.qualifications: "${parsedInfo.qualifications}"`);
            
            console.log('\n Test Results:');
            console.log(`    Doctor name available: ${parsedInfo.doctor_name ? 'YES' : 'NO'}`);
            console.log(`    Qualifications available: ${parsedInfo.qualifications ? 'YES' : 'NO'}`);
            console.log(`    Will display real name: ${parsedInfo.doctor_name !== 'Dr. John Doe' ? 'YES' : 'NO'}`);
            
        } else {
            console.log(' Login failed:', loginData.error || 'Unknown error');
        }
        
    } catch (error) {
        console.error(' Test failed with error:', error.message);
    }
}

// Run the test
testDoctorLogin();
