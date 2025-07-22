const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { spawn } = require('child_process');

async function finalTest() {
    console.log(' Final test with server logging...\n');
    
    // Start the server with visible output
    console.log(' Starting server with logging...');
    const server = spawn('node', ['index.js'], { 
        stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Log server output
    server.stdout.on('data', (data) => {
        console.log('SERVER:', data.toString().trim());
    });
    
    server.stderr.on('data', (data) => {
        console.log('SERVER ERROR:', data.toString().trim());
    });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    try {
        // Create and login user
        const userData = {
            first_name: 'Final',
            last_name: 'Test',
            email: `final.test.${Date.now()}@example.com`,
            mobile: `+250${Math.floor(Math.random() * 1000000000)}`,
            password: 'test123'
        };
        
        const signupResponse = await fetch('http://localhost:8080/user/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        const signupResult = await signupResponse.json();
        
        const loginResponse = await fetch('http://localhost:8080/user/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                payload: userData.email,
                password: userData.password
            })
        });
        const loginResult = await loginResponse.json();
        
        // Get doctor
        const doctorsResponse = await fetch('http://localhost:8080/doctor/availableDoctors');
        const doctorsData = await doctorsResponse.json();
        const testDoctor = doctorsData.doctor[0];
        
        console.log('\n Making appointment request...');
        console.log('User ID:', loginResult.id);
        console.log('Doctor ID:', testDoctor.id);
        console.log('Token:', loginResult.token ? 'Present' : 'Missing');
        
        // Test appointment creation
        const appointmentData = {
            userID: loginResult.id,
            email: userData.email,
            ageOfPatient: 25,
            gender: 'F',
            address: 'Kigali, Rwanda',
            problemDescription: 'Final test appointment',
            appointmentDate: '2024-07-20',
            appointmentTime: '11:00',
            consultationType: 'in-person',
            symptoms: ['headache'],
            medicalHistory: 'None',
            medications: 'None',
            paymentDetails: {
                transactionId: 'FINAL123',
                simcardHolder: 'Final Test',
                ownerName: 'Final Test',
                phoneNumber: '+250123456789',
                paymentMethod: 'mobile-money',
                amount: 6000,
                currency: 'RWF'
            }
        };
        
        console.log('\nSending request data:', {
            userID: appointmentData.userID,
            doctorId: testDoctor.id,
            appointmentTime: appointmentData.appointmentTime,
            consultationType: appointmentData.consultationType
        });
        
        const appointmentResponse = await fetch(`http://localhost:8080/enhanced-appointment/create/${testDoctor.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${loginResult.token}`
            },
            body: JSON.stringify(appointmentData)
        });
        
        const appointmentResult = await appointmentResponse.json();
        
        console.log('\n Response received:');
        console.log('Status:', appointmentResponse.status);
        console.log('Response:', appointmentResult);
        
        if (appointmentResponse.ok) {
            console.log(' SUCCESS! Appointment created successfully!');
        } else {
            console.log(' FAILED! Check server logs above for details.');
        }
        
    } catch (error) {
        console.log(' Test failed:', error.message);
    } finally {
        console.log('\n Stopping server...');
        server.kill();
        
        setTimeout(() => {
            process.exit(0);
        }, 2000);
    }
}

finalTest().catch(console.error);
