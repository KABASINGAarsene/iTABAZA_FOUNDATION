const { spawn } = require('child_process');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testFrontendBackendIntegration() {
    console.log(' Testing Frontend-Backend Integration Issues\n');
    
    // Start the server
    console.log(' Starting server...');
    const server = spawn('node', ['index.js'], { stdio: 'pipe' });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    let serverStarted = false;
    server.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Server listening')) {
            console.log(' Server started successfully');
            serverStarted = true;
        }
    });
    
    server.stderr.on('data', (data) => {
        console.log('Server error:', data.toString());
    });
    
    if (!serverStarted) {
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    try {
        // Test 1: User Registration Flow
        console.log('\n Testing User Registration Flow...');
        
        // Step 1: Email verification (what signup.js does first)
        const emailVerifyData = {
            first_name: 'Frontend',
            last_name: 'Test',
            email: `frontend.test.${Date.now()}@example.com`,
            mobile: `+250${Math.floor(Math.random() * 1000000000)}`,
            password: 'test123'
        };
        
        try {
            const emailVerifyResponse = await fetch('http://localhost:8080/user/emailVerify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emailVerifyData)
            });
            
            const emailVerifyResult = await emailVerifyResponse.json();
            console.log('    Email verification:', emailVerifyResponse.ok ? ' Success' : ' Failed');
            if (!emailVerifyResponse.ok) {
                console.log('   Error:', emailVerifyResult.msg || emailVerifyResult.error);
            } else {
                console.log('   OTP generated for testing');
            }
        } catch (error) {
            console.log('    Email verification failed:', error.message);
        }
        
        // Step 2: User signup (what otp.js does after OTP verification)
        try {
            const signupResponse = await fetch('http://localhost:8080/user/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emailVerifyData)
            });
            
            const signupResult = await signupResponse.json();
            console.log('    User signup:', signupResponse.ok ? ' Success' : ' Failed');
            if (!signupResponse.ok) {
                console.log('   Error:', signupResult.msg || signupResult.error);
            } else {
                console.log('   User ID:', signupResult.user?.id);
            }
        } catch (error) {
            console.log('    User signup failed:', error.message);
        }
        
        // Test 2: User Login Flow  
        console.log('\n Testing User Login Flow...');
        
        try {
            const loginResponse = await fetch('http://localhost:8080/user/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payload: emailVerifyData.email,
                    password: emailVerifyData.password
                })
            });
            
            const loginResult = await loginResponse.json();
            console.log('    User login:', loginResponse.ok ? ' Success' : ' Failed');
            if (!loginResponse.ok) {
                console.log('   Error:', loginResult.msg || loginResult.error);
            } else {
                console.log('   Token generated for user:', loginResult.id);
                
                // Test 3: Enhanced Appointment Creation (what payment.js does)
                console.log('\n Testing Enhanced Appointment Creation...');
                
                // First get a doctor
                const doctorsResponse = await fetch('http://localhost:8080/doctor/availableDoctors', {
                    headers: { 'Authorization': `Bearer ${loginResult.token}` }
                });
                
                if (doctorsResponse.ok) {
                    const doctorsData = await doctorsResponse.json();
                    if (doctorsData.doctor && doctorsData.doctor.length > 0) {
                        const testDoctor = doctorsData.doctor[0];
                        console.log('    Doctor found:', testDoctor.doctor_name);
                        
                        // Create enhanced appointment (simulating payment.js)
                        const appointmentData = {
                            userID: loginResult.id,
                            email: emailVerifyData.email,
                            ageOfPatient: 30,
                            gender: 'M',
                            address: 'Test Address, Kigali',
                            problemDescription: 'Frontend integration test appointment',
                            appointmentDate: '2024-07-15',
                            appointmentTime: '10:00',
                            consultationType: 'in-person',
                            symptoms: ['fever', 'headache'],
                            medicalHistory: 'No significant history',
                            medications: 'None',
                            paymentDetails: {
                                transactionId: 'TEST123456',
                                simcardHolder: 'Frontend Test',
                                ownerName: 'Frontend Test',
                                phoneNumber: '+250123456789',
                                paymentMethod: 'mobile-money',
                                amount: 7000,
                                currency: 'RWF'
                            }
                        };
                        
                        try {
                            const appointmentResponse = await fetch(`http://localhost:8080/enhanced-appointment/create/${testDoctor.id}`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${loginResult.token}`
                                },
                                body: JSON.stringify(appointmentData)
                            });
                            
                            const appointmentResult = await appointmentResponse.json();
                            console.log('    Enhanced appointment creation:', appointmentResponse.ok ? '✅ Success' : '❌ Failed');
                            if (!appointmentResponse.ok) {
                                console.log('   Error:', appointmentResult.msg || appointmentResult.error);
                            } else {
                                console.log('   Appointment ID:', appointmentResult.appointment?.id);
                            }
                        } catch (error) {
                            console.log('    Appointment creation failed:', error.message);
                        }
                        
                    } else {
                        console.log('    No doctors available for testing');
                    }
                } else {
                    console.log('    Failed to fetch doctors');
                }
            }
        } catch (error) {
            console.log('    User login failed:', error.message);
        }
        
        // Test 4: Check common frontend issues
        console.log('\n Checking Common Frontend Issues...');
        
        // Check CORS
        try {
            const corsTestResponse = await fetch('http://localhost:8080/user/', {
                method: 'GET',
                headers: { 'Origin': 'http://localhost:3000' }
            });
            console.log('    CORS test:', corsTestResponse.ok ? ' Working' : ' Issue detected');
        } catch (error) {
            console.log('    CORS test failed:', error.message);
        }
        
        // Test 5: Missing authentication errors
        console.log('\n Testing Authentication Requirements...');
        
        try {
            const noAuthResponse = await fetch('http://localhost:8080/enhanced-appointment/create/test-id', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ test: 'data' })
            });
            
            const noAuthResult = await noAuthResponse.json();
            console.log('    Auth protection:', !noAuthResponse.ok ? ' Working (rejected unauthorized)' : '❌ Not protected');
            if (!noAuthResponse.ok) {
                console.log('   Error message:', noAuthResult.msg);
            }
        } catch (error) {
            console.log('    Auth test failed:', error.message);
        }
        
    } catch (error) {
        console.log(' Integration test failed:', error.message);
    } finally {
        // Stop the server
        console.log('\n Stopping server...');
        server.kill();
        
        console.log('\n DIAGNOSIS SUMMARY:');
        console.log('=====================================');
        console.log('Check the results above:');
        console.log('1. If email verification fails → Check EMAIL_USER and EMAIL_PASS in .env');
        console.log('2. If user signup fails → Check database connection and schema');
        console.log('3. If login fails → Check JWT_SECRET in .env and password hashing');
        console.log('4. If appointment creation fails → Check authentication middleware');
        console.log('5. If CORS fails → Check frontend is using correct baseURL');
        console.log('6. If auth protection fails → Check authenticate middleware');
        console.log('\n COMMON FIXES:');
        console.log('- Ensure server is running on port 8080');
        console.log('- Check frontend baseURL points to http://localhost:8080');
        console.log('- Verify user is logged in and token is stored in localStorage');
        console.log('- Check browser console for JavaScript errors');
        console.log('- Verify all form fields are filled correctly');
        
        process.exit(0);
    }
}

testFrontendBackendIntegration().catch(console.error);
